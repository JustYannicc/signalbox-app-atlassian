import { array, boolean, decodeJson, json, number, object, query, string } from "apps";
import type { QueryContext } from "apps";
import { never } from "apps/operations/approval";
import { apiFetch, apiOrigin, accessibleResourcesUrl, type requirements } from "./provider.js";

const boundedNumber = (value: number | undefined, fallback: number, maximum: number) =>
  Math.max(1, Math.min(maximum, Math.trunc(value ?? fallback)));

const Sites = array(
  object({
    id: string(),
    name: string(),
    url: string(),
    scopes: array(string()).optional(),
  }),
);

const listSites = query(
  {
    description: "List Atlassian Cloud sites accessible to the connected account.",
    approval: never(),
    input: object({}),
  },
  async (context: QueryContext<typeof requirements>) => {
    const response = await apiFetch(context, accessibleResourcesUrl);
    return decodeJson(response, Sites);
  },
);

const ConfluenceSearch = object({
  results: array(
    object({
      id: string(),
      title: string(),
      type: string().optional(),
      status: string().optional(),
      excerpt: string().optional(),
      space: object({ key: string().optional(), name: string().optional() }).optional(),
      _links: object({ webui: string().optional() }).optional(),
    }),
  ),
  size: number().optional(),
});

const searchConfluence = query(
  {
    description: "Search Confluence pages with a CQL query on one accessible site.",
    approval: never(),
    input: object({
      cloudId: string({ minLength: 1 }),
      cql: string({ minLength: 1 }),
      limit: number().optional(),
    }),
  },
  async (context: QueryContext<typeof requirements>, { cloudId, cql, limit }) => {
    const params = new URLSearchParams({
      cql,
      limit: String(boundedNumber(limit, 25, 100)),
      expand: "space",
    });
    const base = `${apiOrigin}/ex/confluence/${encodeURIComponent(cloudId)}/wiki/rest/api`;
    const response = await apiFetch(context, `${base}/content/search?${params}`);
    return decodeJson(response, ConfluenceSearch);
  },
);

const ConfluencePage = object({
  id: string(),
  title: string(),
  type: string().optional(),
  status: string().optional(),
  space: object({ key: string().optional(), name: string().optional() }).optional(),
  body: object({
    storage: object({ value: string(), representation: string().optional() }).optional(),
  }).optional(),
  _links: object({ webui: string().optional() }).optional(),
});

const readConfluencePage = query(
  {
    description: "Read a Confluence page and its storage-format body.",
    approval: never(),
    input: object({ cloudId: string({ minLength: 1 }), pageId: string({ minLength: 1 }) }),
  },
  async (context: QueryContext<typeof requirements>, { cloudId, pageId }) => {
    const base = `${apiOrigin}/ex/confluence/${encodeURIComponent(cloudId)}/wiki/rest/api`;
    const params = new URLSearchParams({ expand: "body.storage,space,version" });
    const response = await apiFetch(
      context,
      `${base}/content/${encodeURIComponent(pageId)}?${params}`,
    );
    return decodeJson(response, ConfluencePage);
  },
);

const JiraIssue = object({
  id: string(),
  key: string(),
  self: string().optional(),
  fields: object({
    summary: string(),
    description: json().optional(),
    status: object({ name: string() }).optional(),
    issuetype: object({ name: string() }).optional(),
    project: object({ key: string(), name: string().optional() }).optional(),
    updated: string().optional(),
  }),
});

const getJiraIssue = query(
  {
    description: "Read a Jira issue by key from one accessible site.",
    approval: never(),
    input: object({ cloudId: string({ minLength: 1 }), issueKey: string({ minLength: 1 }) }),
  },
  async (context: QueryContext<typeof requirements>, { cloudId, issueKey }) => {
    const base = `${apiOrigin}/ex/jira/${encodeURIComponent(cloudId)}/rest/api/3`;
    const params = new URLSearchParams({
      fields: "summary,description,status,issuetype,project,updated",
    });
    const response = await apiFetch(
      context,
      `${base}/issue/${encodeURIComponent(issueKey)}?${params}`,
    );
    return decodeJson(response, JiraIssue);
  },
);

const JiraSearch = object({
  issues: array(JiraIssue),
  total: number().optional(),
  isLast: boolean().optional(),
  nextPageToken: string().optional(),
});

const searchJiraIssues = query(
  {
    description: "Search Jira issues with JQL on one accessible site.",
    approval: never(),
    input: object({
      cloudId: string({ minLength: 1 }),
      jql: string({ minLength: 1 }),
      maxResults: number().optional(),
    }),
  },
  async (context: QueryContext<typeof requirements>, { cloudId, jql, maxResults }) => {
    const base = `${apiOrigin}/ex/jira/${encodeURIComponent(cloudId)}/rest/api/3`;
    const response = await apiFetch(context, `${base}/search/jql`, {
      method: "POST",
      body: {
        jql,
        maxResults: boundedNumber(maxResults, 25, 100),
        fields: ["summary", "status", "issuetype", "project", "updated"],
      },
    });
    return decodeJson(response, JiraSearch);
  },
);

export { listSites, searchConfluence, readConfluencePage, getJiraIssue, searchJiraIssues };
