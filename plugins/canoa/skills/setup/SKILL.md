---
name: setup
description: Onboard a designer to Canoa — Google sign-in plus master Google Sheet attachment. Use this skill on first run, when the designer says "set me up", "sign me in", "connect my sheet", "log in to canoa", "attach my schedule", or any phrase about getting Canoa initialized. Also use it to recover from a wiped credentials file ("canoa says I'm not signed in"). After setup completes, hand off to `/canoa:start` for the working session.
allowed-tools:
  - mcp__canoa__canoa_status
  - mcp__canoa__canoa_signup
  - mcp__canoa__canoa_attach_sheet
---

# /canoa:setup — Onboarding

Walks a designer through Google OAuth and Google Sheet attachment. Run once on first session, or whenever credentials need to be re-established.

## Step 1 — Check current state

Call `canoa_status`. The result has `{signed_in, email, sheet_attached, sheet_name}`.

- If `signed_in` is true and `sheet_attached` is true → say "Already set up as <email>, working from '<sheet_name>'. Run `/canoa:start` to begin." and stop.
- If `signed_in` is true and `sheet_attached` is false → skip to Step 3.
- If `signed_in` is false → continue to Step 2.

## Step 2 — Google sign-in

Tell the designer:

> "I'll open Google in your browser to sign you in. Use the Google account you want Canoa to read and write your master sheet from. Give it a moment."

Call `canoa_signup`. The tool waits up to 5 minutes for the OAuth flow to complete in their browser.

If signup fails or times out, surface the error in plain language and stop. Do not fall through to Step 3 without authentication.

After signup succeeds, re-call `canoa_status` to refresh state, then continue.

## Step 3 — Attach a master sheet

Tell the designer:

> "Now connect your master schedule. Paste the URL of the Google Sheet you want Canoa to own. Make sure the Google account you signed in with has edit access. If you don't have a sheet yet or want to skip for now, just say 'skip'."

Wait for their response.

- If they paste a URL, call `canoa_attach_sheet(url)`. On a sheet-access error (not shared, wrong account, etc.), surface the error in plain language and ask them to share the sheet with the signed-in Google account (or use link sharing), then offer to retry.
- If they say 'skip' or 'not yet', move on. Tell them they can attach later by re-running `/canoa:setup` and pasting a URL.

## Step 4 — Hand off

Once setup is complete, tell the designer:

> "Setup complete — you're signed in as <email>, working from '<sheet_name>'. Run `/canoa:start` to begin a working session, or just ask me anything FF&E and I'll route to Canoa."

Don't enter working mode here. `/canoa:start` is the orient-and-go entry; this skill is the install/onboard path.

## Recovery

If `canoa_status` returns `signed_in: true` but a subsequent `canoa_chat` from another skill reports "no designer signed in," the credentials file was wiped or rotated. Re-run Step 2 and Step 3 in sequence — start clean rather than trying to surgically recover.
