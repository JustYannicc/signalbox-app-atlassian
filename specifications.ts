import type { AppCache, CacheGetOptions, CacheLoadContext, JsonValue } from "apps";
import coverage from "./api-coverage.json" with { type: "json" };
import type { ApiName } from "./openapi.js";

const maximumDocumentBytes = 40_000_000;

async function verifiedResponse(response: Response, expected: string): Promise<Response> {
  if (!response.ok || response.body === null) return response;
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      length += chunk.value.byteLength;
      if (length > maximumDocumentBytes)
        throw new Error("Atlassian OpenAPI document exceeds 40 MB.");
      chunks.push(chunk.value);
    }
  } finally {
    await reader.cancel();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const actual = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  if (actual !== expected)
    throw new Error(
      "Atlassian OpenAPI document changed. Review its scopes and exclusions before updating the recorded hash.",
    );
  return new Response(bytes, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

/** Guard the SDK's loader-owned fetch and bind every compiled cache entry to the reviewed hash. */
export function specificationCache(name: ApiName, cache: AppCache): AppCache {
  const api = coverage[name];
  const key = (value: JsonValue): JsonValue => [
    "atlassian-reviewed-spec",
    api.url,
    api.sha256,
    value,
  ];
  const options = <A>(original: CacheGetOptions<A>): CacheGetOptions<A> => ({
    ...original,
    key: key(original.key),
    load: (context: CacheLoadContext) =>
      original.load({
        ...context,
        cache: specificationCache(name, context.cache),
        fetch: async (input, init) => {
          const request = input instanceof Request ? input : undefined;
          const url = new URL(request?.url ?? input.toString());
          const method = (init?.method ?? request?.method ?? "GET").toUpperCase();
          const response = await context.fetch(input, init);
          return url.href === api.url && method === "GET"
            ? verifiedResponse(response, api.sha256)
            : response;
        },
      }),
  });
  return {
    get: (original) => cache.get(options(original)),
    revalidate: (original) => cache.revalidate(options(original)),
    read: (value, schema) => cache.read(key(value), schema),
    readMany: (values, schema) => cache.readMany(values.map(key), schema),
    write: (entries, retention) =>
      cache.write(
        entries.map((entry) => ({ ...entry, key: key(entry.key) })),
        retention,
      ),
    invalidate: (value) => cache.invalidate(key(value)),
    forAccount: (account) => specificationCache(name, cache.forAccount(account)),
  };
}
