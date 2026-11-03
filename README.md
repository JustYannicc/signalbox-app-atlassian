# Atlassian

Source for the Atlassian app in Signalbox's catalog.

Access Jira, Jira Service Management, and Confluence through your own Atlassian account. The app includes five read shortcuts and the supported Jira, Jira Service Management, and Confluence REST API operations. Every API write requires approval. Atlassian site roles and product plans continue to limit what your account can do.

The app requests 73 OAuth scopes for the included read and write operations. It sends API requests to Atlassian's API origin and requires an accessible site ID from `listSites` for site operations. It excludes Connect and Forge owned operations, Basic only endpoints, and Beta only scopes.

The source does not contain an Atlassian OAuth client secret. The Signalbox host supplies its configured client for the requested scopes. A self-hosted instance can configure its own client. The app uses the supported Signalbox framework release pinned in package.json.

The app checks the hashes of its pinned public OpenAPI documents before compiling operations. Changed documents are rejected until their scopes, operation exclusions, and hashes are reviewed in source.
