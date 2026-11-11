export function GET() {
  return new Response(
    JSON.stringify({
      ucp: {
        version: "2026-08-25",
        services: {},
        payment_handlers: {},
        capabilities: {
          "dev.ucp.shopping.catalog.search": [
            {
              version: "2026-08-25",
              spec: "https://ucp.dev/2026-08-25/specification/shopping/catalog/search/",
              schema: "https://ucp.dev/2026-08-25/schemas/shopping/catalog_search.json",
            },
          ],
          "dev.ucp.shopping.cart": [
            {
              version: "2026-08-25",
              spec: "https://ucp.dev/2026-08-25/specification/shopping/cart/",
              schema: "https://ucp.dev/2026-08-25/schemas/shopping/cart.json",
            },
          ],
          "dev.ucp.shopping.checkout": [
            {
              version: "2026-08-25",
              spec: "https://ucp.dev/2026-08-25/specification/shopping/checkout/",
              schema: "https://ucp.dev/2026-08-25/schemas/shopping/checkout.json",
            },
          ],
          "dev.ucp.shopping.order": [
            {
              version: "2026-08-25",
              spec: "https://ucp.dev/2026-08-25/specification/shopping/order/",
              schema: "https://ucp.dev/2026-08-25/schemas/shopping/order.json",
            },
          ],
        },
      },
    }),
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
      },
    }
  );
}
