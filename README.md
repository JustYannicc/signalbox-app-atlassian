# Atlassian Cloud

Personal OAuth 2.0 access to Jira Platform, Jira Service Management and Confluence REST v1/v2.
All API writes require approval. Existing site, Jira and Confluence read shortcuts remain available.
Every imported operation requires a cloudId from listSites and sends credentials only to api.atlassian.com.
Connect/Forge-owned operations, Basic-only endpoints and Beta-only scopes are excluded.
Confluence v2 page bodies accept the documented flat or nested representation. The OpenAPI adapter
closes those two object schemas so their oneOf alternatives do not both match the same valid input.
JSM experimental methods send X-ExperimentalApi: opt-in. Attachment, avatar and watcher requests
include the exact X-Atlassian-Token header their API operation documents. Read-only POST operations are queries.

The source-derived request has 73 scopes, including read:me and offline_access. Classic scopes
are used where documented; Confluence v2 and other granular-only operations need additional scopes.
This exceeds Atlassian's recommendation of fewer than 50. The saved hosted registration's classic
scope counts do not establish that its granular scopes are configured. Keep sharing off until the
hosted registration, same-account reconsent and live provider acceptance are verified. Custom OAuth
clients remain available. Atlassian site permissions, product roles and plan limits still apply.

api-coverage.json records the checked public OpenAPI URLs, hashes, exclusions and scope mapping.
The helper reads the official documents at runtime through a loader that verifies their recorded
SHA-256 hashes before compilation. Compiled cache entries are bound to that hash. A changed document
cannot introduce tools until its scopes, exclusions and hash are reviewed in a source update. This source does not claim live provider authorization or API success.
