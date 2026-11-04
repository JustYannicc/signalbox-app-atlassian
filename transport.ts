import coverage from "./api-coverage.json" with { type: "json" };
import { apiOrigin } from "./configuration.js";
import type { ApiName } from "./openapi.js";

type AppFetch = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;
const templatePattern = (value: string) =>
  new RegExp(
    "^" +
      value
        .split(/(\{[^}]+\})/)
        .map((part) =>
          part.startsWith("{") ? "[^/]+" : part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        )
        .join("") +
      "$",
  );

/** Add only the fixed headers the vendor requires for these exact API operations. */
export function fetchFor(name: ApiName, fetch: AppFetch): AppFetch {
  const api = coverage[name];
  const rules = api.requiredHeaders.map((rule) => ({
    ...rule,
    pattern: templatePattern(api.pathPrefix + rule.path),
  }));
  return (input, init = {}) => {
    const request = input instanceof Request ? input : undefined;
    const url = new URL(request?.url ?? input.toString());
    const method = (init.method ?? request?.method ?? "GET").toUpperCase();
    const rule =
      url.origin === apiOrigin
        ? rules.find((rule) => rule.method === method && rule.pattern.test(url.pathname))
        : undefined;
    if (rule === undefined) return fetch(input, init);
    const headers = new Headers(init.headers ?? request?.headers);
    for (const [name, value] of Object.entries(rule.headers)) headers.set(name, value);
    return fetch(input, { ...init, headers, redirect: "manual" });
  };
}
