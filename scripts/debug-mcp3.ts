import { dynamicTool, jsonSchema, type ToolSet } from "ai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

let sessionCookie = "";
const cookieFetch: typeof globalThis.fetch = async (input, init) => {
  console.log('[fetch] →', (input as URL)?.href ?? input, 'cookie:', sessionCookie ? 'yes' : 'none');
  const headers = new Headers((init?.headers as HeadersInit) ?? {});
  if (sessionCookie) headers.set("cookie", sessionCookie);
  const res = await globalThis.fetch(input, { ...init, headers });
  console.log('[fetch] ←', res.status, res.headers.get('set-cookie') ? 'SET-COOKIE' : '');
  if (!sessionCookie) {
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) sessionCookie = setCookie.split(";")[0];
  }
  return res;
};

async function main() {
  const transport = new StreamableHTTPClientTransport(
    new URL("https://www.savetheduck.com/api/ucp/mcp"),
    { fetch: cookieFetch }
  );
  const client = new Client({ name: "shopping-agent", version: "1.0.0" }, { capabilities: {} });
  console.log('connecting...');
  await client.connect(transport);
  console.log('connected, listing tools...');
  const { tools: mcpTools } = await client.listTools();
  console.log('got', mcpTools.length, 'tools');
  await client.close();
}
main().catch(e => console.error('ERROR:', e?.cause?.code, e.message));
