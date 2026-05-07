import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

type ChatMessage = {
  role?: unknown;
  content?: unknown;
};

type ChatRequest = {
  messages?: unknown;
};

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function parseMiniMaxText(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const content = (payload as { content?: unknown }).content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    const textBlock = content.find(
      (item) =>
        item &&
        typeof item === "object" &&
        (item as { type?: string }).type === "text" &&
        typeof (item as { text?: unknown }).text === "string",
    ) as { text?: string } | undefined;
    return textBlock?.text ?? null;
  }
  return null;
}

function normalizeMessages(input: unknown): Array<{ role: "user" | "assistant"; content: Array<{ type: "text"; text: string }> }> | null {
  if (!Array.isArray(input)) return null;
  const out: Array<{ role: "user" | "assistant"; content: Array<{ type: "text"; text: string }> }> = [];
  for (const m of input as ChatMessage[]) {
    const role = m.role === "assistant" ? "assistant" : m.role === "user" ? "user" : null;
    if (!role) continue;
    const rawContent = m.content;
    if (!Array.isArray(rawContent)) continue;
    const blocks = rawContent
      .filter((b) => b && typeof b === "object")
      .map((b) => ({
        type: "text" as const,
        text: typeof (b as { text?: unknown }).text === "string" ? (b as { text: string }).text : "",
      }))
      .filter((b) => b.text.trim().length > 0);
    if (!blocks.length) continue;
    out.push({ role, content: blocks });
  }
  return out.length ? out : null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  const apiKey = Deno.env.get("MINIMAX_API_KEY")?.trim();
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "MINIMAX_API_KEY is not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  const baseUrl = (Deno.env.get("MINIMAX_BASE_URL")?.trim() || "https://api.minimax.io/anthropic").replace(/\/$/, "");
  const model = Deno.env.get("MINIMAX_MODEL")?.trim() || "MiniMax-M2.7";

  let body: ChatRequest;
  try {
    body = (await req.json()) as ChatRequest;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  const messages = normalizeMessages(body.messages);
  if (!messages) {
    return new Response(JSON.stringify({ error: "messages are required" }), {
      status: 400,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  try {
    const upstream = await fetch(`${baseUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 500,
        system:
          "You are Tradlyte AI, a concise journaling coach for traders. Keep responses practical, supportive, and brief (2-4 sentences).",
        messages,
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => "");
      return new Response(JSON.stringify({ error: "MiniMax request failed", detail: errText || upstream.statusText }), {
        status: 502,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const data = (await upstream.json()) as unknown;
    const text = parseMiniMaxText(data);
    if (!text) {
      return new Response(JSON.stringify({ error: "MiniMax returned no text content" }), {
        status: 502,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "MiniMax upstream unreachable", detail: String(e) }), {
      status: 502,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
});
