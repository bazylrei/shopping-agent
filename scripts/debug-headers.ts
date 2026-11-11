import { Agent, setGlobalDispatcher } from "undici";
setGlobalDispatcher(new Agent({ connect: { family: 4 } }));

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const UCP_ENDPOINT = "https://www.savetheduck.com/api/ucp/mcp";
const PROFILE_URL = "https://shopping-agent-opal-alpha.vercel.app/api/agent-profile";

let reqCount = 0;
const loggingFetch: typeof globalThis.fetch = async (input, init) => {
  const n = ++reqCount;
  const method = init?.method ?? "GET";
  const reqHeaders = Object.fromEntries(new Headers(init?.headers as HeadersInit).entries());
  console.log(`\n[req ${n}] ${method} mcp-session-id: ${reqHeaders['mcp-session-id'] ?? 'none'}`);
  
  const res = await globalThis.fetch(input, init);
  const clone = res.clone();
  const body = await clone.text().catch(() => '[stream]');
  const sessionId = res.headers.get('mcp-session-id');
  console.log(`[res ${n}] status: ${res.status} mcp-session-id: ${sessionId ?? 'none'}`);
  if (body !== '[stream]') console.log(`[res ${n}] body:`, body.slice(0, 300));
  return res;
};

async function main() {
  const transport = new StreamableHTTPClientTransport(new URL(UCP_ENDPOINT), { fetch: loggingFetch });
  const client = new Client({ name: "shopping-agent", version: "1.0.0" }, { capabilities: {} });
  await client.connect(transport);
  
  console.log("\n=== calling search_catalog ===");
  try {
    await client.callTool({
      name: "search_catalog",
      arguments: {
        meta: { "ucp-agent": { profile: PROFILE_URL } },
        catalog: { query: "jacket" },
      },
    });
  } catch (e: any) {
    console.error("error:", e.code, e.data ?? e.message);
  }
  await client.close();
}
main().catch(console.error);
