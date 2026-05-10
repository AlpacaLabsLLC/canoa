#!/usr/bin/env node
// Canoa MCP server — thin proxy to canoa-site /api/* for Claude Desktop.
//
// Tools:
//   canoa_signup      — Google OAuth signup; opens browser, polls until done,
//                       persists user_id to ~/.canoa/credentials.json.
//   canoa_chat        — relay a designer's message to /api/chat. Requires signup.
//
// Inference runs on Canoa's Anthropic key server-side. This process is stateless
// except for in-memory chat history (lost on restart).
//
// Env:
//   CANOA_API_BASE   Default https://canoa-site.pages.dev/api. Set http://localhost:8788/api for local dev.
//                    Will move to https://canoa.supply/api once DNS cuts over from the legacy Webflow site.

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const API_BASE = process.env.CANOA_API_BASE ?? "https://canoa-site.pages.dev/api";
const CREDS_PATH = resolve(homedir(), ".canoa", "credentials.json");

const __dirname = dirname(fileURLToPath(import.meta.url));
// dist/server.js → ../../agents/canoa.md
const PERSONA_PATH = resolve(__dirname, "..", "..", "agents", "canoa.md");

let personaBody: string;
try {
  const raw = readFileSync(PERSONA_PATH, "utf-8");
  personaBody = raw.replace(/^---[\s\S]*?---\n+/, "").trim();
} catch (err) {
  console.error(`[canoa-mcp] failed to load persona at ${PERSONA_PATH}: ${err}`);
  process.exit(1);
}

interface Credentials {
  user_id: string;
  email?: string;
  signed_in_at?: number;
  // Wedge 2: master sheet binding. Populated by canoa_attach_sheet on success.
  sheet_id?: string;
  sheet_name?: string;
  sheet_attached_at?: number;
}

function readCredentials(): Credentials | undefined {
  try {
    const raw = readFileSync(CREDS_PATH, "utf-8");
    const parsed = JSON.parse(raw) as Partial<Credentials>;
    if (typeof parsed.user_id === "string" && parsed.user_id) {
      return parsed as Credentials;
    }
  } catch {
    // file missing or unreadable — fine, just means not signed in yet
  }
  return undefined;
}

function writeCredentials(creds: Credentials): void {
  mkdirSync(dirname(CREDS_PATH), { recursive: true });
  writeFileSync(CREDS_PATH, JSON.stringify(creds, null, 2));
}

// Mutable so canoa_signup / canoa_attach_sheet can update without restarting the process.
const _bootCreds = readCredentials();
let activeUserId: string | undefined = _bootCreds?.user_id;
let activeEmail: string | undefined = _bootCreds?.email;
let activeSheetId: string | undefined = _bootCreds?.sheet_id;
let activeSheetName: string | undefined = _bootCreds?.sheet_name;

type HistoryEntry = { role: "user" | "assistant"; content: string };
const history: HistoryEntry[] = [];

const server = new Server(
  {
    name: "canoa",
    version: "0.2.1",
  },
  {
    capabilities: {
      tools: {},
    },
    // The persona reference is loaded as background context. Routing + onboarding
    // orchestration live in the /canoa Claude Desktop Skill (separate file), which
    // is what users invoke to start a session. These tools are the underlying
    // primitives the skill calls.
    instructions: personaBody,
  },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "canoa_status",
      description:
        "Return whether the designer is signed in to Canoa, with their email and master sheet info if so. Cheap local lookup — no network call. The /canoa skill calls this first to decide whether onboarding steps are needed.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "canoa_signup",
      description:
        "Sign the designer in to Canoa via Google OAuth. Opens their default browser to Google's consent screen (Sheets + Drive scopes), waits up to 5 minutes for them to complete the flow, and persists the resulting user_id locally so future tool calls are bound to this account. Called by the /canoa onboarding prompt when canoa_status reports not signed in.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "canoa_signout",
      description:
        "Sign the designer out of Canoa. Removes the local credentials file and clears the in-process user binding so subsequent canoa_chat calls error until the designer signs in again. Use when the designer says 'sign out', 'log out', 'switch accounts', or similar.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "canoa_attach_sheet",
      description:
        "Attach a Google Sheet as the designer's master schedule. Validates that Canoa has access to it (the designer must have shared it with the signed-in Google account, OR enabled link-based editing) and stores its title locally so the agent knows which sheet to read/write. Called by the /canoa onboarding prompt after signup, and any time the designer says 'attach my sheet', 'connect my schedule', etc.",
      inputSchema: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "The Google Sheet URL (or bare sheet ID) the designer wants to use as their master schedule.",
          },
        },
        required: ["url"],
      },
    },
    {
      name: "canoa_chat",
      description:
        "Relay a message to Canoa, the designer's signed-in FF&E specifications agent. The /canoa onboarding prompt sets this as the default route for the rest of the conversation — once onboarded, every designer message goes through here. Canoa has the verified catalog, dealer redaction, and (after Wedge 2/3) the designer's master schedule. Requires sign-in via canoa_signup.",
      inputSchema: {
        type: "object",
        properties: {
          message: {
            type: "string",
            description: "The designer's message to relay to Canoa.",
          },
        },
        required: ["message"],
      },
    },
  ],
}));

function textResult(text: string, isError = false) {
  return { content: [{ type: "text", text }], isError: isError || undefined };
}

async function handleSignout() {
  const wasSignedIn = Boolean(activeUserId);
  const previousEmail = activeEmail;
  try {
    unlinkSync(CREDS_PATH);
  } catch {
    // file already missing — fine
  }
  activeUserId = undefined;
  activeEmail = undefined;
  activeSheetId = undefined;
  activeSheetName = undefined;
  history.length = 0;
  console.error(`[canoa-mcp] signed out (was ${previousEmail ?? "<none>"})`);
  return textResult(
    wasSignedIn
      ? `Signed out${previousEmail ? ` (${previousEmail})` : ""}. Run /canoa to sign in again.`
      : `Already signed out. Run /canoa to sign in.`,
  );
}

async function handleStatus() {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          signed_in: Boolean(activeUserId),
          email: activeEmail ?? null,
          user_id: activeUserId ?? null,
          sheet_attached: Boolean(activeSheetId),
          sheet_id: activeSheetId ?? null,
          sheet_name: activeSheetName ?? null,
        }),
      },
    ],
  };
}

async function handleAttachSheet(rawArgs: unknown) {
  if (!activeUserId) {
    return textResult(
      "Can't attach a sheet — no designer is signed in. Run canoa_signup first.",
      true,
    );
  }
  const args = rawArgs as { url?: unknown } | undefined;
  const url = typeof args?.url === "string" ? args.url.trim() : "";
  if (!url) {
    return textResult("No URL provided. Pass the Google Sheet URL the designer wants to attach.", true);
  }

  let resp: Response;
  try {
    resp = await fetch(`${API_BASE}/sheets/attach`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ user_id: activeUserId, url }),
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return textResult(`Network error reaching ${API_BASE}/sheets/attach: ${detail}`, true);
  }

  const bodyText = await resp.text();
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(bodyText) as Record<string, unknown>;
  } catch {
    return textResult(`Non-JSON response from /api/sheets/attach (status ${resp.status}): ${bodyText.slice(0, 500)}`, true);
  }

  if (!resp.ok) {
    const errCode = String(body.error ?? "unknown");
    const detail = String(body.detail ?? "");
    return textResult(`Could not attach sheet: ${errCode}${detail ? ` — ${detail}` : ""}`, true);
  }

  const sheet = body.sheet as
    | { id: string; google_sheet_id: string; sheet_name: string }
    | undefined;
  if (!sheet) {
    return textResult(`Attach succeeded but response missing sheet payload. Raw: ${bodyText.slice(0, 300)}`, true);
  }

  // Persist + update in-process state.
  const updated: Credentials = {
    user_id: activeUserId,
    email: activeEmail,
    signed_in_at: _bootCreds?.signed_in_at,
    sheet_id: sheet.google_sheet_id,
    sheet_name: sheet.sheet_name,
    sheet_attached_at: Date.now(),
  };
  writeCredentials(updated);
  activeSheetId = sheet.google_sheet_id;
  activeSheetName = sheet.sheet_name;

  const tabs = Array.isArray(body.tabs) ? (body.tabs as string[]) : [];
  console.error(
    `[canoa-mcp] sheet attached id=${sheet.google_sheet_id.slice(0, 8)}... name="${sheet.sheet_name}" tabs=${tabs.length}`,
  );

  return textResult(
    `Attached "${sheet.sheet_name}" as the master schedule.${tabs.length ? ` Tabs: ${tabs.join(", ")}.` : ""} Canoa can now read this sheet (and, in Wedge 3, write specs back to it).`,
  );
}

async function handleSignup() {
  let startBody: { state?: string; url?: string; error?: string };
  try {
    const resp = await fetch(`${API_BASE}/signup/start`, { method: "POST" });
    startBody = (await resp.json()) as typeof startBody;
    if (!resp.ok) {
      return textResult(`Sign-in failed to start: ${JSON.stringify(startBody)}`, true);
    }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return textResult(
      `Could not reach ${API_BASE}/signup/start. Is wrangler pages dev running? (${detail})`,
      true,
    );
  }

  const { state, url } = startBody;
  if (!state || !url) {
    return textResult(`Bad response from /signup/start: ${JSON.stringify(startBody)}`, true);
  }

  // Open default browser. Cross-platform: macOS uses `open`, Linux `xdg-open`, Windows `start`.
  // We don't await — the OS hands the URL to the browser and returns.
  try {
    const opener =
      process.platform === "darwin" ? "open"
      : process.platform === "win32" ? "cmd"
      : "xdg-open";
    const args = process.platform === "win32" ? ["/c", "start", "", url] : [url];
    spawn(opener, args, { detached: true, stdio: "ignore" }).unref();
  } catch (err) {
    // Non-fatal — surface the URL so the user can paste it manually.
    console.error(`[canoa-mcp] failed to launch browser: ${err}`);
  }

  console.error(`[canoa-mcp] signup state=${state.slice(0, 8)}... url=${url.slice(0, 80)}...`);

  // Poll status. 2s interval, 5min max — most users finish in 30–60s.
  const startedAt = Date.now();
  const pollIntervalMs = 2000;
  const timeoutMs = 5 * 60 * 1000;

  while (Date.now() - startedAt < timeoutMs) {
    await new Promise((r) => setTimeout(r, pollIntervalMs));

    let statusBody: {
      status?: string;
      user_id?: string;
      email?: string;
      error?: string;
    };
    try {
      const resp = await fetch(`${API_BASE}/signup/status?state=${encodeURIComponent(state)}`);
      statusBody = (await resp.json()) as typeof statusBody;
    } catch (err) {
      console.error(`[canoa-mcp] poll error: ${err}`);
      continue;
    }

    if (statusBody.status === "complete" && statusBody.user_id) {
      // Fresh signup wipes any prior sheet attachment (new account, new sheet).
      writeCredentials({
        user_id: statusBody.user_id,
        email: statusBody.email,
        signed_in_at: Date.now(),
      });
      activeUserId = statusBody.user_id;
      activeEmail = statusBody.email;
      activeSheetId = undefined;
      activeSheetName = undefined;
      // Reset chat history — new user, fresh conversation.
      history.length = 0;
      console.error(
        `[canoa-mcp] signup complete user_id=${statusBody.user_id} email=${statusBody.email}`,
      );
      return textResult(
        `Signed in to Canoa as ${statusBody.email ?? statusBody.user_id}.\n\n` +
          `**How to use Canoa from here:**\n` +
          `- Address it by name for guaranteed routing: "Canoa, find me task chairs under $1500", "have Canoa pull the spec sheet for the Aeron", "ask Canoa about lead times on Hem"\n` +
          `- Or just ask any product / specs / sourcing / schedule question — Claude should defer to Canoa for FF&E topics where catalog data and citations matter\n` +
          `- For general design conversation, theory, or non-FF&E topics, Claude will answer directly without going through Canoa\n\n` +
          `Try: *"Canoa, what Herman Miller chairs do you have in the catalog?"* to see the verified-tier data Canoa returns vs. what Claude would tell you from training memory.`,
      );
    }
    if (statusBody.status === "error") {
      return textResult(`Sign-in failed: ${statusBody.error ?? "unknown error"}`, true);
    }
    // 'pending' — keep polling
  }

  return textResult(
    `Sign-in timed out after 5 minutes without completion. If you finished the OAuth flow, check the browser tab for an error. Otherwise, run canoa_signup again.`,
    true,
  );
}

async function handleChat(rawArgs: unknown) {
  const args = rawArgs as { message?: unknown } | undefined;
  const message = typeof args?.message === "string" ? args.message : "";
  if (!message.trim()) {
    return textResult("Empty message — nothing to send.", true);
  }

  if (!activeUserId) {
    return textResult(
      "No designer is signed in to Canoa yet. Run canoa_signup first to complete Google OAuth, then retry this message.",
      true,
    );
  }

  let resp: Response;
  try {
    resp = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ user_id: activeUserId, message, history }),
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return textResult(`Network error reaching ${API_BASE}/chat: ${detail}`, true);
  }

  const bodyText = await resp.text();
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(bodyText) as Record<string, unknown>;
  } catch {
    return textResult(
      `Non-JSON response from /api/chat (status ${resp.status}): ${bodyText.slice(0, 500)}`,
      true,
    );
  }
  if (!resp.ok) {
    return textResult(`Canoa API error (${resp.status}): ${JSON.stringify(body)}`, true);
  }

  const text = typeof body.message === "string" ? body.message : "";
  if (!text) {
    return textResult(`Canoa returned no message. Raw: ${bodyText.slice(0, 500)}`, true);
  }

  history.push({ role: "user", content: message });
  history.push({ role: "assistant", content: text });

  const tools = Array.isArray(body.tools_executed) ? body.tools_executed : [];
  console.error(
    `[canoa-mcp] turn ok — tools=${tools.length} cost_cents=${body.cost_cents ?? "?"} remaining_cents=${body.remaining_trial_cents ?? "?"} latency_ms=${body.latency_ms ?? "?"}`,
  );

  return textResult(text);
}

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  switch (req.params.name) {
    case "canoa_status":
      return handleStatus();
    case "canoa_signup":
      return handleSignup();
    case "canoa_signout":
      return handleSignout();
    case "canoa_attach_sheet":
      return handleAttachSheet(req.params.arguments);
    case "canoa_chat":
      return handleChat(req.params.arguments);
    default:
      return textResult(`Unknown tool: ${req.params.name}`, true);
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error(
  `[canoa-mcp] connected — api_base=${API_BASE} active_user=${activeUserId ?? "<none>"} ${activeEmail ? `(${activeEmail}) ` : ""}persona_chars=${personaBody.length}`,
);
