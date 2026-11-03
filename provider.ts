import {
  array,
  bearer,
  decodeJson,
  defineProvider,
  object,
  oauth2,
  string,
  type QueryContext,
} from "apps";
import { apiOrigin, scopes } from "./configuration.js";
export { apiOrigin };

export const accessibleResourcesUrl = `${apiOrigin}/oauth/token/accessible-resources`;
const atlassian = defineProvider({
  name: "Atlassian",
  hosts: ["api.atlassian.com"],
  auth: {
    oauth: oauth2({
      authorizationUrl: "https://auth.atlassian.com/authorize",
      tokenUrl: "https://auth.atlassian.com/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      tokenRequestFormat: "json",
      authorizationParams: { audience: "api.atlassian.com", prompt: "consent" },
      scopes,
      request: ({ access_token }) => bearer(access_token),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(accessibleResourcesUrl, {
      signal,
      headers: { ...account.headers(), accept: "application/json" },
    });
    const sites = await decodeJson(response, array(object({ id: string(), name: string() })));
    if (sites.length === 0) throw new Error("No Atlassian sites are accessible to this account.");
  },
});

export const requirements = { user: { accounts: { atlassian } } };

export const apiFetch = (
  context: QueryContext<typeof requirements>,
  url: string,
  options: { readonly method?: "GET" | "POST"; readonly body?: unknown } = {},
) => {
  const body = options.body === undefined ? undefined : JSON.stringify(options.body);
  return context.fetch(url, {
    ...(options.method === undefined ? {} : { method: options.method }),
    ...(body === undefined ? {} : { body }),
    signal: context.signal,
    headers: {
      ...context.user.accounts.atlassian.headers(),
      accept: "application/json",
      ...(body === undefined ? {} : { "content-type": "application/json" }),
    },
  });
};
