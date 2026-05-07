import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

type NewsRequest = {
  symbol?: unknown;
  limit?: unknown;
  order?: unknown;
};

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function parseLimit(input: string | null | undefined): number {
  const n = Number(input ?? 10);
  if (!Number.isFinite(n)) return 10;
  return Math.min(Math.max(Math.trunc(n), 1), 50);
}

function normalizeOrder(input: string | null | undefined): "asc" | "desc" | null {
  const v = String(input ?? "desc").toLowerCase();
  if (v === "asc" || v === "desc") return v;
  return null;
}

function getGetParams(req: Request): { symbol: string; limit: number; order: "asc" | "desc" } | Response {
  const url = new URL(req.url);
  const symbol = String(url.searchParams.get("symbol") ?? "").toUpperCase().trim();
  const limit = parseLimit(url.searchParams.get("limit"));
  const order = normalizeOrder(url.searchParams.get("order"));

  if (!symbol) {
    return new Response(JSON.stringify({ error: "symbol is required" }), {
      status: 400,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
  if (!order) {
    return new Response(JSON.stringify({ error: "order must be asc or desc" }), {
      status: 400,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
  return { symbol, limit, order };
}

async function getPostParams(req: Request): Promise<{ symbol: string; limit: number; order: "asc" | "desc" } | Response> {
  let body: NewsRequest;
  try {
    body = (await req.json()) as NewsRequest;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  const symbol = String(body.symbol ?? "").toUpperCase().trim();
  const limit = parseLimit(body.limit == null ? undefined : String(body.limit));
  const order = normalizeOrder(body.order == null ? undefined : String(body.order));

  if (!symbol) {
    return new Response(JSON.stringify({ error: "symbol is required" }), {
      status: 400,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
  if (!order) {
    return new Response(JSON.stringify({ error: "order must be asc or desc" }), {
      status: 400,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
  return { symbol, limit, order };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  const params = req.method === "GET" ? getGetParams(req) : await getPostParams(req);
  if (params instanceof Response) return params;

  try {
    const apiKey = Deno.env.get("POLYGON_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "POLYGON_API_KEY is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const polygonUrl = new URL("https://api.polygon.io/v2/reference/news");
    polygonUrl.searchParams.set("ticker", params.symbol);
    polygonUrl.searchParams.set("limit", String(params.limit));
    polygonUrl.searchParams.set("order", params.order);
    polygonUrl.searchParams.set("sort", "published_utc");
    polygonUrl.searchParams.set("apiKey", apiKey);

    const res = await fetch(polygonUrl.toString(), { method: "GET" });
    const body = await res.json().catch(() => ({}));
    const results = Array.isArray((body as { results?: unknown }).results)
      ? ((body as { results: unknown[] }).results)
      : [];

    return new Response(
      JSON.stringify({
        data: results,
        meta: {
          symbol: params.symbol,
          count: results.length,
          limit: params.limit,
          order: params.order,
        },
      }),
      {
        status: res.ok ? 200 : 502,
        headers: { ...corsHeaders, "content-type": "application/json" },
      },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
});
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts"

console.log("Hello from Functions!")

Deno.serve(async (req) => {
  const { name } = await req.json()
  const data = {
    message: `Hello ${name}!`,
  }

  return new Response(
    JSON.stringify(data),
    { headers: { "Content-Type": "application/json" } },
  )
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/polygon-news' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
