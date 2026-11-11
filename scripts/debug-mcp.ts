import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

let sessionCookie = "";
const cookieFetch: typeof globalThis.fetch = async (input, init) => {
  console.log('cookieFetch url:', input?.toString?.() ?? input);
  console.log('headers type:', (init?.headers as any)?.constructor?.name);
  const headers = new Headers((init?.headers as HeadersInit) ?? {});
  if (sessionCookie) headers.set("cookie", sessionCookie);
  console.log('calling fetch...');
  try {
    const res = await globalThis.fetch(input, { ...init, headers });
    console.log('fetch OK:', res.status);
    return res;
  } catch (e: any) {
    console.error('fetch FAILED:', e?.cause?.code, e?.cause?.errors?.map((x: any) => x?.code));
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
main().catch(e => console.error('TOP-LEVEL ERROR:', e?.cause?.code, e.message));
