# @bountylens/mcp

MCP server for [BountyLens](https://bountylens.com) — connect Claude Code to your Hunter Tracker.

Push findings, leads, tested endpoints, and full report drafts directly from your terminal to the BountyLens dashboard. Everything you log during a hunt session appears in real-time in the web UI with an `MCP` badge.

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

## Tools

### Sessions

| Tool | Description |
|------|-------------|
| `bountylens_list_sessions` | List hunt sessions — filter by `status` (active/paused/completed) or `program_id` |
| `bountylens_create_session` | Start a new hunt session with a title and optional program |
| `bountylens_get_session` | Get a session with all its entries and counts |
| `bountylens_update_session` | Update title, status, or notes |

### Entries

| Tool | Description |
|------|-------------|
| `bountylens_list_entries` | List entries in a session — filter by `type` (tested/lead/finding/note) |
| `bountylens_add_finding` | Log a validated finding with severity, endpoint, method, and description |
| `bountylens_add_lead` | Log a promising lead that needs further investigation |
| `bountylens_add_tested` | Mark an endpoint or feature as tested |
| `bountylens_add_note` | Add a freeform note to the session |
| `bountylens_update_entry` | Update an entry's title, description, status, or severity |
| `bountylens_delete_entry` | Remove an entry |

### Reports

| Tool | Description |
|------|-------------|
| `bountylens_draft_report` | Create a report draft — include summary, steps to reproduce, impact, and remediation |
| `bountylens_list_reports` | List all report drafts in a session |
| `bountylens_update_report` | Edit a report's title, body, or status (draft/ready/submitted) |

### Programs

| Tool | Description |
|------|-------------|
| `bountylens_search_programs` | Search bug bounty programs by name or handle |

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
PUT    /api/v1/sessions/:id/entries/:entryId     — update entry
DELETE /api/v1/sessions/:id/entries/:entryId     — delete entry
GET    /api/v1/sessions/:id/reports              — list reports
POST   /api/v1/sessions/:id/reports              — create report
PUT    /api/v1/sessions/:id/reports/:reportId    — update report
DELETE /api/v1/sessions/:id/reports/:reportId    — delete report
GET    /api/v1/programs?q=search                 — search programs
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
