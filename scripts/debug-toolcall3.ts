import { Agent, setGlobalDispatcher } from "undici";
setGlobalDispatcher(new Agent({ connect: { family: 4 } }));

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const UCP_ENDPOINT = "https://www.savetheduck.com/api/ucp/mcp";
const PROFILE_URL = "https://shopping-agent-opal-alpha.vercel.app/api/agent-profile";

async function main() {
  // No cookieFetch - use transport default fetch
  const transport = new StreamableHTTPClientTransport(new URL(UCP_ENDPOINT));
  const client = new Client({ name: "shopping-agent", version: "1.0.0" }, { capabilities: {} });
  await client.connect(transport);

  try {
    const result = await client.callTool({
      name: "search_catalog",
      arguments: {
        meta: { "ucp-agent": { profile: PROFILE_URL } },
        catalog: { query: "jacket" },
      },
    });
    console.log("✓ result:", JSON.stringify(result).slice(0, 300));
  } catch (e: any) {
    console.error("✗ error:", e.code, e.data ?? e.message);
  }

  await client.close();
}
main().catch(console.error);
