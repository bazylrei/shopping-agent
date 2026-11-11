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
  console.log(`\n[req ${n}] ${method} ${input}`);
  if (init?.body) console.log(`[req ${n}] body:`, String(init.body).slice(0, 300));
  
  const res = await globalThis.fetch(input, init);
  const clone = res.clone();
  const body = await clone.text();
  console.log(`[res ${n}] status: ${res.status}, content-type: ${res.headers.get('content-type')}`);
  console.log(`[res ${n}] body:`, body.slice(0, 500));
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
