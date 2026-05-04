#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_KEY = process.env.BOUNTYLENS_API_KEY;
const BASE_URL = (process.env.BOUNTYLENS_URL || "https://bountylens.com").replace(/\/$/, "");

if (!API_KEY) {
  console.error("BOUNTYLENS_API_KEY environment variable is required");
  process.exit(1);
}

async function api(path: string, options: RequestInit = {}): Promise<unknown> {
  const url = `${BASE_URL}/api/v1${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const body = await res.json();

  if (!res.ok) {
    throw new Error((body as { error?: string }).error || `API error ${res.status}`);
  }

  return body;
}

const server = new McpServer({
  name: "bountylens",
  version: "0.2.0",
});

// ── Sessions ──

server.tool(
  "bountylens_list_sessions",
  "List all hunt sessions. Optionally filter by status (active/paused/completed) or program_id.",
  {
    status: z.enum(["active", "paused", "completed"]).optional().describe("Filter by session status"),
    program_id: z.number().optional().describe("Filter by program ID"),
  },
  async ({ status, program_id }) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (program_id) params.set("program_id", String(program_id));
    const qs = params.toString();
    const data = await api(`/sessions${qs ? `?${qs}` : ""}`);
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
);

server.tool(
  "bountylens_create_session",
  "Create a new hunt session for a target program.",
  {
    title: z.string().max(200).describe("Session title (e.g. 'SSRF deep-dive', 'Auth bypass hunt')"),
    program_id: z.number().optional().describe("Program ID to associate with this session"),
  },
  async ({ title, program_id }) => {
    const data = await api("/sessions", {
      method: "POST",
      body: JSON.stringify({ title, program_id }),
    });
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
);

server.tool(
  "bountylens_get_session",
  "Get a hunt session with all its entries (findings, leads, tested endpoints, notes).",
  {
    session_id: z.number().describe("Session ID"),
  },
  async ({ session_id }) => {
    const data = await api(`/sessions/${session_id}`);
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
);

server.tool(
  "bountylens_update_session",
  "Update a hunt session's title, status, or notes.",
  {
    session_id: z.number().describe("Session ID"),
    title: z.string().max(200).optional().describe("New title"),
    status: z.enum(["active", "paused", "completed"]).optional().describe("New status"),
    notes: z.string().optional().describe("Session notes (overwrites existing)"),
  },
  async ({ session_id, ...body }) => {
    const data = await api(`/sessions/${session_id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
);

// ── Entries ──

server.tool(
  "bountylens_list_entries",
  "List entries in a hunt session. Optionally filter by type.",
  {
    session_id: z.number().describe("Session ID"),
    type: z.enum(["tested", "lead", "finding", "note"]).optional().describe("Filter by entry type"),
  },
  async ({ session_id, type }) => {
    const qs = type ? `?type=${type}` : "";
    const data = await api(`/sessions/${session_id}/entries${qs}`);
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
);

server.tool(
  "bountylens_add_finding",
  "Log a validated security finding in a hunt session.",
  {
    session_id: z.number().describe("Session ID"),
    title: z.string().max(500).describe("Finding title (e.g. 'Stored XSS in /profile/bio')"),
    severity: z.enum(["critical", "high", "medium", "low", "info"]).describe("Severity level"),
    endpoint: z.string().max(2000).optional().describe("Affected endpoint/URL"),
    method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH", "OTHER"]).optional().describe("HTTP method"),
    description: z.string().max(10000).optional().describe("Detailed description, PoC steps, impact"),
  },
  async ({ session_id, ...body }) => {
    const data = await api(`/sessions/${session_id}/entries`, {
      method: "POST",
      body: JSON.stringify({ ...body, type: "finding" }),
    });
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
);

server.tool(
  "bountylens_add_lead",
  "Log a promising lead that needs further investigation.",
  {
    session_id: z.number().describe("Session ID"),
    title: z.string().max(500).describe("Lead title (e.g. 'Interesting param reflection on /search')"),
    endpoint: z.string().max(2000).optional().describe("Endpoint/URL"),
    method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH", "OTHER"]).optional().describe("HTTP method"),
    description: z.string().max(10000).optional().describe("What you observed and why it's worth investigating"),
  },
  async ({ session_id, ...body }) => {
    const data = await api(`/sessions/${session_id}/entries`, {
      method: "POST",
      body: JSON.stringify({ ...body, type: "lead" }),
    });
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
);

server.tool(
  "bountylens_add_tested",
  "Mark an endpoint or feature as tested.",
  {
    session_id: z.number().describe("Session ID"),
    title: z.string().max(500).describe("What was tested (e.g. 'CSRF on /api/settings')"),
    endpoint: z.string().max(2000).optional().describe("Endpoint/URL tested"),
    method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH", "OTHER"]).optional().describe("HTTP method"),
    description: z.string().max(10000).optional().describe("What was tested and result"),
  },
  async ({ session_id, ...body }) => {
    const data = await api(`/sessions/${session_id}/entries`, {
      method: "POST",
      body: JSON.stringify({ ...body, type: "tested" }),
    });
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
);

server.tool(
  "bountylens_add_note",
  "Add a freeform note to a hunt session.",
  {
    session_id: z.number().describe("Session ID"),
    title: z.string().max(500).describe("Note title"),
    description: z.string().max(10000).optional().describe("Note content"),
  },
  async ({ session_id, ...body }) => {
    const data = await api(`/sessions/${session_id}/entries`, {
      method: "POST",
      body: JSON.stringify({ ...body, type: "note" }),
    });
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
);

server.tool(
  "bountylens_update_entry",
  "Update an existing entry (title, description, status, severity).",
  {
    session_id: z.number().describe("Session ID"),
    entry_id: z.number().describe("Entry ID"),
    title: z.string().max(500).optional().describe("New title"),
    description: z.string().max(10000).optional().describe("New description"),
    status: z.enum(["open", "closed", "reported"]).optional().describe("New status"),
    severity: z.enum(["critical", "high", "medium", "low", "info"]).optional().describe("New severity"),
  },
  async ({ session_id, entry_id, ...body }) => {
    const data = await api(`/sessions/${session_id}/entries/${entry_id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
);

server.tool(
  "bountylens_delete_entry",
  "Delete an entry from a hunt session.",
  {
    session_id: z.number().describe("Session ID"),
    entry_id: z.number().describe("Entry ID to delete"),
  },
  async ({ session_id, entry_id }) => {
    const data = await api(`/sessions/${session_id}/entries/${entry_id}`, {
      method: "DELETE",
    });
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
);

// ── Reports ──

server.tool(
  "bountylens_list_reports",
  "List report drafts in a hunt session.",
  {
    session_id: z.number().describe("Session ID"),
  },
  async ({ session_id }) => {
    const data = await api(`/sessions/${session_id}/reports`);
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
);

server.tool(
  "bountylens_draft_report",
  "Create a report draft in a hunt session. Use this to write vulnerability reports that the hunter can review and submit to bug bounty platforms.",
  {
    session_id: z.number().describe("Session ID"),
    title: z.string().max(300).describe("Report title (e.g. 'SSRF via image proxy allows internal network access')"),
    body: z.string().max(50000).describe("Full report body — include summary, steps to reproduce, impact, and remediation"),
    entry_id: z.number().optional().describe("Optional: link to a specific finding entry"),
  },
  async ({ session_id, ...body }) => {
    const data = await api(`/sessions/${session_id}/reports`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
);

server.tool(
  "bountylens_update_report",
  "Update a report draft (title, body, or status).",
  {
    session_id: z.number().describe("Session ID"),
    report_id: z.number().describe("Report ID"),
    title: z.string().max(300).optional().describe("New title"),
    body: z.string().max(50000).optional().describe("New body"),
    status: z.enum(["draft", "ready", "submitted"]).optional().describe("New status"),
  },
  async ({ session_id, report_id, ...body }) => {
    const data = await api(`/sessions/${session_id}/reports/${report_id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
);

// ── Programs ──

server.tool(
  "bountylens_search_programs",
  "Search bug bounty programs by name or handle.",
  {
    query: z.string().min(2).describe("Search query (min 2 chars)"),
    limit: z.number().min(1).max(100).optional().describe("Max results (default 20)"),
  },
  async ({ query, limit }) => {
    const params = new URLSearchParams({ q: query });
    if (limit) params.set("limit", String(limit));
    const data = await api(`/programs?${params.toString()}`);
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
);

// ── Start ──

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
