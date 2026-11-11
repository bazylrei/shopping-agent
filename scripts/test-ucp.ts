/**
 * Smoke test for the UCP MCP communication layer.
 *
 * Tool discovery works locally. Tool calls require an HTTPS-reachable
 * agent profile URL (use `npx vercel dev` or deploy to Vercel for full E2E).
 */
import { createUCPTools } from "../lib/ucp-mcp-client";

const AGENT_PROFILE_URL =
  process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/agent-profile`
    : "https://localhost:3000/api/agent-profile";

async function main() {
  console.log("Connecting to Save the Duck UCP endpoint...");
  const { tools, close } = await createUCPTools(AGENT_PROFILE_URL);

  const names = Object.keys(tools);
  console.log(`\n✓ Discovered ${names.length} UCP tools:`);
  names.forEach((n) => console.log(`    - ${n}`));

  if (process.env.NEXT_PUBLIC_APP_URL) {
    console.log("\nCalling search_catalog with query 'jacket'...");
    try {
      const result = await tools.search_catalog.execute!(
        { catalog: { query: "jacket" } },
        {} as never
      );
      console.log("\n✓ Search result (first 500 chars):");
      console.log(JSON.stringify(result).slice(0, 500));
    } catch (e) {
      console.error("\n✗ Tool call failed:", e);
    }
  } else {
    console.log(
      "\n⚠  Skipping tool call — set NEXT_PUBLIC_APP_URL to an HTTPS URL to test tool execution."
    );
    console.log("  (Shopify requires HTTPS for the UCP agent profile URI)");
  }

  await close();
}

main().catch(console.error);
