import type { OpenapiToolNamesOptions } from "apps/openapi";
import coverage from "./api-coverage.json" with { type: "json" };
import { apiOrigin } from "./configuration.js";

export type ApiName = keyof typeof coverage;
const pointer = (value: string) => value.replaceAll("~", "~0").replaceAll("/", "~1");

export function optionsFor(name: ApiName) {
  const api = coverage[name];
  return {
    title: api.title,
    source: { url: api.url },
    allowedOrigin: apiOrigin,
    baseUrl: apiOrigin,
    pathPrefix: api.pathPrefix,
    securitySchemes: { [api.scheme]: { type: "http", scheme: "bearer" } },
    methods: { oauth: [{ scheme: api.scheme, field: "access_token", part: "value", prefix: "" }] },
    oauth: [],
    kinds: Object.fromEntries(api.queries.map((id) => [id, "query" as const])),
    patches: [
      ...api.excluded.map((operation) => ({
        op: "remove" as const,
        path: `/paths/${pointer(operation.path)}/${operation.method}`,
      })),
      // The documented flat and nested page bodies must match only their own branch.
      ...(name === "confluenceV2"
        ? ["PageBodyWrite", "PageNestedBodyWrite"].map((schema) => ({
            op: "add" as const,
            path: `/components/schemas/${schema}/additionalProperties`,
            value: false,
          }))
        : []),
    ],
  } satisfies OpenapiToolNamesOptions & { title: string };
}
