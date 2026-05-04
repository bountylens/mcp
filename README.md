# @bountylens/mcp

MCP server for [BountyLens](https://bountylens.com) — connect Claude Code to your Hunter Tracker.

## Setup

1. Generate an API key at [bountylens.com/dashboard/settings](https://bountylens.com/dashboard/settings) (Integrations section)

2. Add to your Claude Code MCP config (`~/.claude/mcp.json`):

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

3. Restart Claude Code. You'll see BountyLens tools available.

## Tools

| Tool | Description |
|------|-------------|
| `bountylens_list_sessions` | List hunt sessions (filter by status/program) |
| `bountylens_create_session` | Start a new hunt session |
| `bountylens_get_session` | Get session with all entries |
| `bountylens_update_session` | Update session title/status/notes |
| `bountylens_add_finding` | Log a validated finding with severity |
| `bountylens_add_lead` | Log a lead for investigation |
| `bountylens_add_tested` | Mark endpoint as tested |
| `bountylens_add_note` | Add freeform note |
| `bountylens_update_entry` | Update entry details |
| `bountylens_delete_entry` | Remove an entry |
| `bountylens_search_programs` | Search programs by name |

## Usage

During a hunt in Claude Code, the LLM automatically uses these tools:

```
"Save this XSS finding to my Shopify session"
→ calls bountylens_add_finding with severity, endpoint, description

"What leads do I have open?"
→ calls bountylens_list_entries filtered by type=lead

"Mark /api/auth as tested, no issues found"
→ calls bountylens_add_tested
```

## Requirements

- Node.js 18+
- BountyLens Pro subscription
- API key from dashboard
