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

async function main() {
  const transport = new StreamableHTTPClientTransport(new URL(UCP_ENDPOINT), { fetch: cookieFetch });
  const client = new Client({ name: "shopping-agent", version: "1.0.0" }, { capabilities: {} });
  await client.connect(transport);
  
  const { tools } = await client.listTools();
  console.log("tools:", tools.map(t => t.name));
  console.log("\nsearch_catalog schema:", JSON.stringify(tools.find(t => t.name === "search_catalog")?.inputSchema, null, 2));
  
  console.log("\ncalling search_catalog...");
  try {
    const result = await client.callTool({
      name: "search_catalog",
      arguments: {
        meta: { "ucp-agent": { profile: PROFILE_URL } },
        catalog: { query: "jacket" },
      },
    });
    console.log("result:", JSON.stringify(result).slice(0, 500));
  } catch (e: any) {
    console.error("error:", e.code, e.message, e.data);
  }

  await client.close();
}
main().catch(console.error);
