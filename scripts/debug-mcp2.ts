import { dynamicTool, jsonSchema, type ToolSet } from "ai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

console.log('fetch after ai import:', globalThis.fetch?.name, globalThis.fetch?.toString().slice(0, 80));

let sessionCookie = "";
const cookieFetch: typeof globalThis.fetch = async (input, init) => {
  const headers = new Headers((init?.headers as HeadersInit) ?? {});
  if (sessionCookie) headers.set("cookie", sessionCookie);
  try {
    const res = await globalThis.fetch(input, { ...init, headers });
    if (!sessionCookie) {
      const setCookie = res.headers.get("set-cookie");
      if (setCookie) sessionCookie = setCookie.split(";")[0];
    }
    return res;
  } catch (e: any) {
    console.error('inner fetch FAILED:', e?.cause?.code, e?.cause?.errors?.map((x: any) => x?.code));
    throw e;
  }
};

async function main() {
  const transport = new StreamableHTTPClientTransport(
    new URL("https://www.savetheduck.com/api/ucp/mcp"),
    { fetch: cookieFetch }
  );
  const client = new Client({ name: "test", version: "1.0.0" }, { capabilities: {} });
  await client.connect(transport);
  console.log("connected!");
  await client.close();
}
main().catch(e => console.error('ERROR:', e.message));
