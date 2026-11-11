import { Agent, setGlobalDispatcher } from "undici";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { dynamicTool, jsonSchema, type ToolSet } from "ai";

// savetheduck.com advertises an IPv6 address with no route to host; undici's
// Happy Eyeballs never recovers, so pin all connections to IPv4.
setGlobalDispatcher(new Agent({ connect: { family: 4 } }));

const UCP_ENDPOINT = "https://www.savetheduck.com/api/ucp/mcp";

function stripMeta(schema: Record<string, unknown>) {
  const properties = { ...(schema.properties as Record<string, unknown>) };
  delete properties.meta;
  const required = ((schema.required as string[]) ?? []).filter(
    (r) => r !== "meta"
  );
  return { ...schema, properties, required };
}

export async function createUCPTools(agentProfileUrlBase: string) {
  // Cache-bust so the UCP server always fetches our latest profile.
  const agentProfileUrl = `${agentProfileUrlBase}?t=${Date.now()}`;
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

  const transport = new StreamableHTTPClientTransport(new URL(UCP_ENDPOINT), {
    fetch: cookieFetch,
  });

  const client = new Client(
    { name: "shopping-agent", version: "1.0.0" },
    { capabilities: {} }
  );

  await client.connect(transport);

  const { tools: mcpTools } = await client.listTools();

  const tools: ToolSet = {};

  for (const mcpTool of mcpTools) {
    const cleanSchema = stripMeta(
      mcpTool.inputSchema as Record<string, unknown>
    );

    tools[mcpTool.name] = dynamicTool({
      description: mcpTool.description ?? mcpTool.name,
      inputSchema: jsonSchema(cleanSchema as Parameters<typeof jsonSchema>[0]),
      execute: async (args: unknown) => {
        console.log(`[UCP] → ${mcpTool.name}`, JSON.stringify(args, null, 2));
        const result = await client.callTool({
          name: mcpTool.name,
          arguments: {
            meta: { "ucp-agent": { profile: agentProfileUrl } },
            ...(args as Record<string, unknown>),
          },
        });
        console.log(`[UCP] ← ${mcpTool.name}`, JSON.stringify(result, null, 2));
        return result;
      },
    });
  }

  return { tools, close: () => client.close() };
}
