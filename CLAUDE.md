# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server (Turbopack)
npm run build    # production build
npm run start    # run production build
```

There is no test runner configured. Run the UCP smoke test manually:

```bash
npx tsx scripts/test-ucp.ts                          # tool discovery only (no HTTPS required)
NEXT_PUBLIC_APP_URL=https://... npx tsx scripts/test-ucp.ts  # full E2E including tool calls
```

> UCP tool **calls** require an HTTPS-reachable agent profile URL. Tool **discovery** works locally. Use `npx vercel dev` or deploy to Vercel to get a valid HTTPS URL for full E2E testing.

## Architecture

This is a Next.js 16 (App Router) AI shopping agent for **Save the Duck**, a sustainable outerwear brand. The agent connects to Save the Duck's Shopify UCP (Unified Commerce Platform) via MCP.

### Request flow

```
Browser → POST /api/chat
  → createUCPTools() opens an MCP session to savetheduck.com/api/ucp/mcp
  → streamText (AI SDK 7, claude-sonnet-4-6) with UCP tools injected
  → toUIMessageStreamResponse() streams back to the browser
  → onEnd: MCP client is closed
```

### Key files

| File | Purpose |
|------|---------|
| `lib/ucp-mcp-client.ts` | Opens a Streamable HTTP MCP session, discovers tools, wraps them for AI SDK's `ToolSet`. Handles session cookie persistence across requests and strips/re-injects the `meta.ucp-agent.profile` field on every tool call. |
| `app/api/chat/route.ts` | Streaming POST endpoint. Instantiates UCP tools per request and streams with a 5-step limit. |
| `app/api/agent-profile/route.ts` | GET endpoint that identifies this agent to Shopify (`dev.ucp.shopping` capability). The URL of this endpoint is passed as the agent profile URI in every UCP tool call. |
| `scripts/test-ucp.ts` | Smoke test for MCP connectivity and optional tool execution. |

### UCP MCP integration details

- **Session stickiness**: The MCP client uses a custom `cookieFetch` that captures the first `Set-Cookie` header and replays it on all subsequent requests within a session. This keeps the same UCP session across multi-step agent turns.
- **`meta` field**: Shopify UCP requires a `meta.ucp-agent.profile` argument on every tool call. `createUCPTools` strips `meta` from the tool's input schema (so the AI never sees or fills it) and injects it automatically at call time.
- **Price units**: UCP returns prices in minor currency units (cents). The system prompt instructs the model to divide by 100 before quoting.
- **MCP client lifecycle**: A new MCP client is opened on every POST `/api/chat` request and closed via `onEnd`. This is intentional — each chat turn is stateless from the server's perspective; conversation history is passed in `messages`.

### Environment variables

| Variable | Used for |
|----------|---------|
| `NEXT_PUBLIC_APP_URL` | Base URL injected into the agent profile URI sent to UCP. Must be HTTPS-reachable by Shopify. |
| `ANTHROPIC_API_KEY` | Authenticates the `@ai-sdk/anthropic` provider. |
