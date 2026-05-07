/** Allowed upstream paths — blocks open redirects */
function isAllowedPath(path: string): boolean {
  if (!path.startsWith("/") || path.includes("://") || path.startsWith("//"))
    return false;
  return (
    path.startsWith("/market/") ||
    path.startsWith("/picks/") ||
    path === "/backtest"
  );
}

type JsonEnvelope = {
  path?: unknown;
  query?: unknown;
  method?: unknown;
  body?: unknown;
};

function toHeaderByteString(value: string): string {
  // Deno/Fetch `Headers` requires ByteString values. Strip control chars and
  // non-Latin1 code points to avoid runtime 502 from `Headers.set(...)`.
  return value
    .replace(/[\r\n\t]/g, " ")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "")
    .trim();
}

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const baseRaw = Deno.env.get("MARKET_API_BASE_URL")?.trim();
  const gwKey = Deno.env.get("MARKET_GATEWAY_API_KEY")?.trim();
  if (!baseRaw || !gwKey) {
    return new Response(
      JSON.stringify({ error: "MARKET_API_BASE_URL or MARKET_GATEWAY_API_KEY not set on Edge Function secrets" }),
      { status: 500, headers: { ...corsHeaders, "content-type": "application/json" } },
    );
  }
  const base = baseRaw.replace(/\/$/, "");
  let baseUrl: URL;
  try {
    baseUrl = new URL(base);
  } catch {
    return new Response(
      JSON.stringify({ error: "MARKET_API_BASE_URL is not a valid absolute URL" }),
      { status: 500, headers: { ...corsHeaders, "content-type": "application/json" } },
    );
  }

  try {
    const url = new URL(req.url);
    const pathFromQs = url.searchParams.get("path");

    let pathParam: string | null = null;
    let qs = "";
    let method = req.method;
    let body: ArrayBuffer | undefined;

    if (pathFromQs) {
      if (!isAllowedPath(pathFromQs)) {
        return new Response(JSON.stringify({ error: "Missing or forbidden path param" }), {
          status: 400,
          headers: { ...corsHeaders, "content-type": "application/json" },
        });
      }
      pathParam = pathFromQs;
      url.searchParams.delete("path");
      qs = url.searchParams.toString();
      if (!["GET", "HEAD"].includes(method)) {
        body = await req.arrayBuffer();
      }
    } else if (req.method === "POST") {
      const ct = req.headers.get("content-type") ?? "";
      if (!ct.includes("application/json")) {
        return new Response(
          JSON.stringify({ error: "POST without path query must use application/json envelope" }),
          { status: 400, headers: { ...corsHeaders, "content-type": "application/json" } },
        );
      }
      const rawText = await req.text();
      let j: JsonEnvelope;
      try {
        j = JSON.parse(rawText) as JsonEnvelope;
      } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
          status: 400,
          headers: { ...corsHeaders, "content-type": "application/json" },
        });
      }
      const p = j.path;
      if (typeof p !== "string" || !isAllowedPath(p)) {
        return new Response(JSON.stringify({ error: "Missing or forbidden path in JSON body" }), {
          status: 400,
          headers: { ...corsHeaders, "content-type": "application/json" },
        });
      }
      pathParam = p;
      if (j.query && typeof j.query === "object" && j.query !== null) {
        const sp = new URLSearchParams();
        for (const [k, v] of Object.entries(j.query as Record<string, unknown>)) {
          if (v === undefined || v === null) continue;
          sp.set(k, String(v));
        }
        qs = sp.toString();
      }
      method = j.method === "POST" ? "POST" : "GET";
      if (method === "POST" && typeof j.body === "string" && j.body.length > 0) {
        body = new TextEncoder().encode(j.body).buffer;
      }
    } else {
      return new Response(JSON.stringify({ error: "Missing path (query ?path= or JSON envelope)" }), {
        status: 400,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const destPathWithQuery = `${pathParam}${qs ? `?${qs}` : ""}`;
    const destUrl = `${base}${destPathWithQuery}`;

    const headersOut = new Headers();
    const safeApiKey = toHeaderByteString(gwKey);
    if (!safeApiKey) {
      return new Response(JSON.stringify({ error: "MARKET_GATEWAY_API_KEY is invalid after header sanitization" }), {
        status: 500,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }
    headersOut.set("x-api-key", safeApiKey);
    if (method === "POST" && body && body.byteLength > 0) {
      headersOut.set("content-type", "application/json");
    } else if (pathFromQs && !["GET", "HEAD"].includes(req.method)) {
      const incomingCt = req.headers.get("content-type");
      if (incomingCt) headersOut.set("content-type", toHeaderByteString(incomingCt));
    }

    const upstream = await fetch(destUrl, {
      method,
      headers: headersOut,
      body: body && body.byteLength > 0 ? body : undefined,
    });

    const outHeaders = new Headers(corsHeaders);
    const uct = upstream.headers.get("content-type");
    if (uct) outHeaders.set("content-type", toHeaderByteString(uct));

    return new Response(upstream.body, {
      status: upstream.status,
      headers: outHeaders,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[market-proxy]", msg);
    return new Response(JSON.stringify({
      error: "Upstream fetch failed",
      detail: msg,
      // Safe diagnostics (no secrets): helps verify env + route shape quickly.
      upstream_host: baseUrl.host,
      upstream_protocol: baseUrl.protocol,
    }), {
      status: 502,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
});
