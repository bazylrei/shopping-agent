import { Agent, setGlobalDispatcher } from "undici";
setGlobalDispatcher(new Agent({ connect: { family: 4 } }));

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const UCP_ENDPOINT = "https://www.savetheduck.com/api/ucp/mcp";
const PROFILE_URL = "https://shopping-agent-opal-alpha.vercel.app/api/agent-profile";

let sessionCookie = "";
const cookieFetch: typeof globalThis.fetch = async (input, init) => {
  const headers = new Headers((init?.headers as HeadersInit) ?? {});
  if (sessionCookie) headers.set("cookie", sessionCookie);
  const res = await globalThis.fetch(input, { ...init, headers });
  if (!sessionCookie) {
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) sessionCookie = setCookie.split(";")[0];
  }
  return res;
};

async function tryTool(client: Client, name: string, args: Record<string, unknown>) {
  try {
    const result = await client.callTool({ name, arguments: args });
    console.log(`✓ ${name}:`, JSON.stringify(result).slice(0, 200));
  } catch (e: any) {
    console.log(`✗ ${name}:`, e.code, e.data ?? e.message);
  }
}

async function main() {
  const transport = new StreamableHTTPClientTransport(new URL(UCP_ENDPOINT), { fetch: cookieFetch });
  const client = new Client({ name: "shopping-agent", version: "1.0.0" }, { capabilities: {} });
  await client.connect(transport);

  const meta = { "ucp-agent": { profile: PROFILE_URL } };

  // Test various tools with meta
  await tryTool(client, "ask_business",   { meta, business: { query: "What jackets do you sell?" } });
  await tryTool(client, "search_catalog", { meta, catalog: { query: "jacket" } });
  await tryTool(client, "create_cart",    { meta, cart: { line_items: [] } });

  // Test without meta to confirm meta is what triggers the issue
  console.log("\n--- without meta ---");
  await tryTool(client, "search_catalog", { catalog: { query: "jacket" } });

  await client.close();
}
main().catch(console.error);
