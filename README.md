# @bountylens/mcp

MCP server for [BountyLens](https://bountylens.com) — connect Claude Code to your Hunter Tracker.

Push findings, leads, tested endpoints, and full report drafts directly from your terminal to the BountyLens dashboard. Search across all sessions, get program intelligence, and track your hunt stats — all without leaving the terminal. Everything you log appears in real-time in the web UI with an `MCP` badge.

## Quick Start

### 1. Get an API key

Go to [bountylens.com/dashboard/settings](https://bountylens.com/dashboard/settings) → **Integrations** → **Generate New API Key**.

Copy the key — it's only shown once.

### 2. Add to Claude Code

Add to your MCP config at `~/.claude/.mcp.json`:

```json
{
  "mcpServers": {
    "bountylens": {
      "command": "npx",
      "args": ["-y", "@bountylens/mcp"],
      "env": {
        "BOUNTYLENS_API_KEY": "bl_your_key_here"
      }
    }
  }
}
```

### 3. Restart Claude Code

The BountyLens tools will be available immediately. No other setup needed.

## Tools (23)

### Sessions

| Tool | Description |
|------|-------------|
| `bountylens_list_sessions` | List hunt sessions — filter by `status` (active/paused/completed), `program_id`, or `program_handle` |
| `bountylens_create_session` | Start a new hunt session with a title and optional program (by ID or handle) |
| `bountylens_get_session` | Get a session with all its entries and counts |
| `bountylens_update_session` | Update title, status, or notes |
| `bountylens_delete_session` | Permanently delete a session and all its entries and reports |

### Entries

All entry tools support the Tracker Pro fields: **`tags`** (lowercase, max 10), **`chain_id`** (link to another entry in the same session to build exploit chains), and **`retest_at`** (ISO-8601 timestamp → retest queue).

| Tool | Description |
|------|-------------|
| `bountylens_list_entries` | List entries in a session — filter by `type` (tested/lead/finding/note) and/or `tag` |
| `bountylens_add_finding` | Log a validated finding with severity, endpoint, method, description, `tags`, `chain_id` |
| `bountylens_add_lead` | Log a promising lead — supports `tags`, `chain_id`, `retest_at` |
| `bountylens_add_tested` | Mark an endpoint or feature as tested — supports `tags`, `retest_at` |
| `bountylens_add_note` | Add a freeform note to the session — supports `tags` |
| `bountylens_update_entry` | Update title, description, status, severity, type, endpoint, method, `tags`, `chain_id`, `retest_at` (passing `tags` replaces them) |
| `bountylens_delete_entry` | Remove an entry |
| `bountylens_bulk_add_entries` | Add up to 50 entries in one call — each item supports `tags`, `chain_id`, `retest_at` |

**Tag conventions:** `vuln:<class>` (`vuln:idor`, `vuln:ssrf`…), `surface:<type>` (`web`, `api`, `graphql`, `mobile`, `cloud-aws`…), `src:<origin>` (`src:hack`, `src:pentest`), `platform:<name>` (`h1`, `synack`, `bugcrowd`, `intigriti`, `ywh`). Don't tag severity or status — those are first-class fields.

### Reports

| Tool | Description |
|------|-------------|
| `bountylens_draft_report` | Create a report draft — include summary, steps to reproduce, impact, and remediation |
| `bountylens_list_reports` | List all report drafts in a session |
| `bountylens_update_report` | Edit a report's title, body, severity, or status — lifecycle (draft/ready/submitted) or closed outcome (resolved/duplicate/informative/not_applicable) |
| `bountylens_delete_report` | Permanently delete a report |

### Search

| Tool | Description |
|------|-------------|
| `bountylens_search_entries` | Search across ALL sessions for entries matching a query — finds past findings, leads, or tested endpoints without knowing which session they're in |

### Programs

| Tool | Description |
|------|-------------|
| `bountylens_search_programs` | Search bug bounty programs by name or handle |
| `bountylens_get_program` | Get full program details — bounties, dupe risk, health score, scope list, and recent scope changes |

### Intelligence

| Tool | Description |
|------|-------------|
| `bountylens_recommend_programs` | Get program recommendations ranked by opportunity score — filter by platform or minimum bounty |
| `bountylens_get_watchlist` | Get your watched programs with metrics — bounties, dupe risk, health, scope changes, and session count |
| `bountylens_get_my_stats` | Get your hunt statistics — sessions, findings, leads, tested endpoints, time spent, and per-program breakdown |

## Usage Examples

During a hunt in Claude Code, the LLM uses these tools automatically based on your instructions:

```
"List my active sessions"
→ bountylens_list_sessions with status=active

"Save this XSS finding to my Shopify session"
→ bountylens_add_finding with title, severity, endpoint, description

"What leads do I have open on the Uber hunt?"
→ bountylens_list_entries with type=lead

"Mark /api/auth as tested, CSRF tokens are present"
→ bountylens_add_tested with endpoint and description

"Have I tested SSRF on any target before?"
→ bountylens_search_entries with query="SSRF"

"What's the scope for Shopify's program?"
→ bountylens_get_program with handle="shopify"

"What should I hunt next?"
→ bountylens_recommend_programs with min_bounty=1000

"How much time have I spent hunting this month?"
→ bountylens_get_my_stats

"Draft a report for the SSRF finding"
→ bountylens_draft_report with full report body

"Push reports/ssrf-uber.md to my Uber session"
→ reads the file, calls bountylens_draft_report with contents
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BOUNTYLENS_API_KEY` | Yes | — | API key from dashboard settings |
| `BOUNTYLENS_URL` | No | `https://bountylens.com` | Custom instance URL (self-hosted) |

## API Reference

The MCP server wraps the BountyLens API v1. All endpoints require a `Bearer` token in the `Authorization` header.

```
GET    /api/v1/sessions                         — list sessions
POST   /api/v1/sessions                         — create session
GET    /api/v1/sessions/:id                      — get session + entries
PUT    /api/v1/sessions/:id                      — update session
DELETE /api/v1/sessions/:id                      — delete session
GET    /api/v1/sessions/:id/entries              — list entries
POST   /api/v1/sessions/:id/entries              — create entry
POST   /api/v1/sessions/:id/entries/bulk         — bulk create entries (max 50)
PUT    /api/v1/sessions/:id/entries/:entryId     — update entry
DELETE /api/v1/sessions/:id/entries/:entryId     — delete entry
GET    /api/v1/sessions/:id/reports              — list reports
POST   /api/v1/sessions/:id/reports              — create report
PUT    /api/v1/sessions/:id/reports/:reportId    — update report
DELETE /api/v1/sessions/:id/reports/:reportId    — delete report
GET    /api/v1/search?q=query                    — search entries across all sessions
GET    /api/v1/programs?q=search                 — search programs
GET    /api/v1/programs/:handle                  — get program details
GET    /api/v1/recommend                         — get program recommendations
GET    /api/v1/watchlist                         — get watched programs
GET    /api/v1/stats                             — get hunt statistics
```

Rate limit: 60 requests/minute per API key.

## Security

- API keys are SHA-256 hashed in the database — never stored in plaintext
- Keys are shown once on creation and cannot be retrieved
- All queries are parameterized — no SQL injection
- Every request verifies resource ownership — no IDOR
- Pro subscription is validated on every API call
- Rate limited to prevent abuse

## Requirements

- Node.js 18+
- [BountyLens](https://bountylens.com) Pro subscription
- API key from the dashboard

## Contributing

We welcome contributions. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT — see [LICENSE](LICENSE)
