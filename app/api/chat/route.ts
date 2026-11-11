import { streamText, stepCountIs, convertToModelMessages } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { createUCPTools } from "@/lib/ucp-mcp-client";

export async function POST(req: Request) {
  const { messages } = await req.json();
  const agentProfileUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/agent-profile`;
  const { tools, close } = await createUCPTools(agentProfileUrl);

  const modelMessages = await convertToModelMessages(messages, {
    tools,
    ignoreIncompleteToolCalls: true,
  });

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: `You are a helpful shopping assistant for Save the Duck, a sustainable outerwear brand.
Help users find jackets, coats, and accessories. Use search_catalog to find products,
ask_business to answer questions about the store, and create_cart/update_cart to manage the cart.
Prices from the API are in minor currency units — divide by 100 before quoting (e.g. 19900 = €199.00).
When showing products, include name, price, and a brief description.`,
    messages: modelMessages,
    tools,
    stopWhen: stepCountIs(5),
    onEnd: () => close(),
  });

  return result.toUIMessageStreamResponse();
}
