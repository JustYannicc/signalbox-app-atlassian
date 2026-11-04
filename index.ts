import { defineApp, router, withApprovals } from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { requirements } from "./provider.js";
import {
  listSites,
  searchConfluence,
  readConfluencePage,
  getJiraIssue,
  searchJiraIssues,
} from "./queries.js";
import { optionsFor, type ApiName } from "./openapi.js";
import { fetchFor } from "./transport.js";
import { specificationCache } from "./specifications.js";

export default defineApp(requirements, async ({ user, cache, fetch, signal }) => {
  const account = user?.accounts.atlassian;
  const api = (name: ApiName) =>
    account === undefined
      ? router({})
      : router(
          withApprovals(
            liveOpenapiRouter({
              ...optionsFor(name),
              cache: specificationCache(name, cache),
              fetch: fetchFor(name, fetch),
              signal,
              account,
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
          {
            title: optionsFor(name).title,
            description:
              "Personal Atlassian Cloud access. Site permissions and product plans apply. Every write requires approval.",
          },
        );
  return {
    tools: router({
      listSites,
      searchConfluence,
      readConfluencePage,
      getJiraIssue,
      searchJiraIssues,
      jira: api("jira"),
      serviceManagement: api("serviceManagement"),
      confluence: api("confluence"),
      confluenceV2: api("confluenceV2"),
    }),
  };
});
