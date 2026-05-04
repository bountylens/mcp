# Contributing to @bountylens/mcp

Thanks for your interest in contributing to BountyLens MCP. This document covers how to get started.

## Getting Started

1. Fork the repo and clone it locally
2. Install dependencies: `npm install`
3. Build: `npm run build`
4. Run in dev mode: `npm run dev` (watches for changes)

## Development Setup

You need a BountyLens API key to test against the live API:

```bash
export BOUNTYLENS_API_KEY="bl_your_key"
node dist/index.js
```

Or test against a local instance:

```bash
export BOUNTYLENS_API_KEY="bl_your_key"
export BOUNTYLENS_URL="http://localhost:3000"
node dist/index.js
```

## Project Structure

```
src/
  index.ts    — MCP server with all tool definitions
dist/         — compiled output (not committed)
```

## How to Contribute

### Bug Reports

Open an issue with:
- What you expected to happen
- What actually happened
- Steps to reproduce
- Your Node.js version and OS
- The MCP tool name and input that caused the issue

### Feature Requests

Open an issue with:
- What problem the feature solves
- Your proposed solution
- Example usage (what would the tool call look like?)

### Pull Requests

1. Create a branch from `main`: `git checkout -b feat/your-feature`
2. Make your changes in `src/index.ts`
3. Build and verify: `npm run build`
4. Test your changes against the BountyLens API
5. Commit with a clear message: `feat: add scope retrieval tool`
6. Push and open a PR against `main`

### Commit Messages

Use conventional commits:
- `feat:` — new tool or feature
- `fix:` — bug fix
- `docs:` — documentation only
- `chore:` — build, deps, config changes

### Adding a New Tool

When adding a new MCP tool:

1. Add the `server.tool()` call in the appropriate section of `src/index.ts`
2. Use zod schemas for all parameters with `.describe()` on each field
3. Validate inputs match the API constraints (max lengths, enums)
4. Return JSON responses in the standard format
5. Update the tools table in `README.md`

Example:

```typescript
server.tool(
  "bountylens_your_tool",
  "Clear description of what this tool does.",
  {
    session_id: z.number().describe("Session ID"),
    param: z.string().max(500).describe("What this param is for"),
  },
  async ({ session_id, param }) => {
    const data = await api(`/sessions/${session_id}/your-endpoint`, {
      method: "POST",
      body: JSON.stringify({ param }),
    });
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
);
```

## Code Style

- TypeScript strict mode
- No comments unless the WHY is non-obvious
- Use `z.enum()` for fixed value sets
- Always include `.describe()` on zod fields — the LLM reads these
- Keep tool descriptions concise but specific

## Questions?

Open an issue or reach out at [bountylens.com](https://bountylens.com).
