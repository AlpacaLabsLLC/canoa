# canoa-mcp

MCP server that lets Claude Desktop reach the Canoa agent. All inference runs server-side on Canoa's Anthropic key against the `canoa-site` `/api/*` endpoints.

## Entry point

The designer activates Canoa via the **`canoa` prompt** in Claude Desktop's composer menu (the "+" / "/" icon — exact UI varies by version). Selecting it inserts an onboarding script into the conversation that:

1. Calls `canoa_status` (cheap local check)
2. If not signed in → calls `canoa_signup` (opens browser for Google OAuth)
3. Greets the designer and explains what Canoa does
4. Frames the rest of the conversation so every subsequent message routes through `canoa_chat`

This is the only intended way users start Canoa. The tools below exist to back the prompt — designers never invoke them directly.

## Tools

| Tool | Purpose |
|---|---|
| `canoa_status` | Local lookup — is the designer signed in, and is a master sheet attached? Returns `{signed_in, email, user_id, sheet_attached, sheet_id, sheet_name}`. No network. |
| `canoa_signup` | Opens browser for Google OAuth, polls `/api/signup/status`, persists `user_id` + `email` to `~/.canoa/credentials.json`. |
| `canoa_signout` | Wipes credentials.json and clears in-process state. Use on "sign out" / "switch accounts". |
| `canoa_attach_sheet` | Attach a Google Sheet as the designer's master schedule. Validates Sheets API access, fetches title, persists `sheet_id` + `sheet_name` to credentials.json. |
| `canoa_chat` | Relay a message to the Canoa FF&E agent at `/api/chat`. Requires sign-in. |

## Prompts

| Prompt | Purpose |
|---|---|
| `canoa` | The single onboarding-and-go entry point. See "Entry point" above. |

## Install (local dev)

```
cd canoa-skill/mcp
npm install
npm run build
```

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "canoa": {
      "command": "node",
      "args": ["/absolute/path/to/canoa-skill/mcp/dist/server.js"],
      "env": {
        "CANOA_API_BASE": "http://localhost:8788/api"
      }
    }
  }
}
```

Restart Claude Desktop. The `canoa_signup` and `canoa_chat` tools appear in any new conversation.

## One-time backend setup (Wedge 1)

The MCP server only proxies — sign-in actually runs in `canoa-site/functions/api/{signup,oauth}/`. Before `canoa_signup` will work end-to-end you need a Google OAuth client and an encryption key on the backend.

### 1. Create a Google OAuth client

In [Google Cloud Console](https://console.cloud.google.com/):

1. Pick (or create) a project. For dev, anything works — call it `canoa-dev` or reuse an existing one.
2. **APIs & Services → OAuth consent screen** — configure as External, app name "Canoa (Dev)", user support email = yours, scopes can be left empty here (we request them at runtime), add yourself as a test user.
3. **APIs & Services → Library** — enable **Google Sheets API** and **Google Drive API**.
4. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**
   - Name: `canoa-mcp-dev`
   - Authorized redirect URIs: `http://localhost:8788/api/oauth/callback`
5. Copy the resulting **Client ID** and **Client secret**.

For prod, repeat with `https://canoa.supply/api/oauth/callback` as the redirect URI and a separate "Canoa" OAuth client.

### 2. Generate an encryption key

```
openssl rand -base64 32
```

This 32-byte AES-GCM key encrypts Google refresh tokens at rest in D1.

### 3. Wire the secrets into `canoa-site/.dev.vars`

Append (or fill in) the following — see `canoa-site/.dev.vars.example`:

```
GOOGLE_CLIENT_ID=...client-id-from-step-1...
GOOGLE_CLIENT_SECRET=...client-secret-from-step-1...
GOOGLE_REDIRECT_URI=http://localhost:8788/api/oauth/callback
OAUTH_ENCRYPTION_KEY=...base64-key-from-step-2...
```

For prod, use `npx wrangler pages secret put <NAME>` instead of `.dev.vars`.

### 4. Apply the D1 migration

```
cd canoa-site
npx wrangler d1 execute canoa-prod --local --file=./migrations/0002_signup_states.sql
# and on prod when ready:
# npx wrangler d1 execute canoa-prod --remote --file=./migrations/0002_signup_states.sql
```

### 5. Run wrangler pages dev

```
cd canoa-site
npx wrangler pages dev
```

The MCP server's signup tool will hit `http://localhost:8788/api/signup/start` per `CANOA_API_BASE`.

## Env vars

| | |
|---|---|
| `CANOA_API_BASE` | Default `https://canoa.supply/api`. Override for local dev. |
| `CANOA_USER_ID` | Optional. Used only when `~/.canoa/credentials.json` doesn't exist (e.g. forced test user before signup is wired). The credentials file always wins. |

## Pointing at prod

Set `CANOA_API_BASE` to `https://canoa.supply/api` once the Pages project is deployed and DNS is cut over. Until then, run `wrangler pages dev` in the `canoa-site` repo first — the server will fail with a network error if `/api/*` isn't reachable.

## What the server does (and doesn't)

- Loads `agent/canoa.md` (frontmatter stripped) into the MCP `instructions` field so Claude Desktop sees the Canoa persona.
- Maintains conversation `history` in process memory and passes it on every `/api/chat` call. History dies on Claude Desktop restart.
- Persists `user_id` to `~/.canoa/credentials.json` after `canoa_signup` so it survives restarts.
- Does **not** expose individual tools (`catalog_search`, `parse_product_url`, `parse_pdf`) or run any Anthropic inference of its own.

## Diagnostics

Per-turn diagnostics print to stderr (visible in Claude Desktop's MCP logs):

```
[canoa-mcp] turn ok — tools=2 cost_cents=1.42 remaining_cents=298.58 latency_ms=4123
[canoa-mcp] signup complete user_id=g-1234567890 email=designer@example.com
```
