/** News via dedicated Edge function `polygon-news` (Polygon key stays server-side). */

import { FunctionsHttpError } from "@supabase/functions-js";
import { supabase } from "@/integrations/supabase/client";

export interface NewsListItem {
  id: string;
  title: string;
  source: string;
  time: string;
  url: string;
}

function formatNewsTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const now = Date.now();
    const diffMs = now - d.getTime();
    const diffM = Math.floor(diffMs / 60000);
    if (diffM < 1) return "just now";
    if (diffM < 60) return `${diffM}m ago`;
    const diffH = Math.floor(diffM / 60);
    if (diffH < 48) return `${diffH}h ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
}

function pickArticles(payload: unknown): unknown[] {
  if (!payload || typeof payload !== "object") return [];
  const obj = payload as Record<string, unknown>;

  const d = obj.data;
  if (Array.isArray(d)) return d;
  if (d && typeof d === "object") {
    const inner = (d as Record<string, unknown>).results;
    if (Array.isArray(inner)) return inner;
    const nested = (d as Record<string, unknown>).articles;
    if (Array.isArray(nested)) return nested;
    const news = (d as Record<string, unknown>).news;
    if (Array.isArray(news)) return news;
  }
  const r = obj.results;
  if (Array.isArray(r)) return r;

  return [];
}

function normalizeArticle(raw: unknown, idx: number): NewsListItem | null {
  if (!raw || typeof raw !== "object") return null;
  const a = raw as Record<string, unknown>;
  const title = typeof a.title === "string" ? a.title : null;
  if (!title?.trim()) return null;

  const id =
    typeof a.id === "string"
      ? a.id
      : typeof a.article_id === "string"
        ? a.article_id
        : `news-${idx}`;

  let url =
    typeof a.article_url === "string"
      ? a.article_url
      : typeof a.url === "string"
        ? a.url
        : typeof a.link === "string"
          ? a.link
          : "";

  let published =
    typeof a.published_utc === "string"
      ? a.published_utc
      : typeof a.published_at === "string"
        ? a.published_at
        : typeof a.pub_date === "string"
          ? a.pub_date
          : typeof a.timestamp === "string"
            ? a.timestamp
            : "";

  let source = "News";
  if (typeof a.publisher === "object" && a.publisher && "name" in (a.publisher as object)) {
    const name = (a.publisher as { name?: unknown }).name;
    if (typeof name === "string") source = name;
  }
  if (typeof a.source === "string") source = a.source || source;
  if (typeof a.publisher === "string") source = a.publisher || source;

  return {
    id,
    title: title.trim(),
    source,
    time: published ? formatNewsTime(published) : "",
    url,
  };
}

function responseFromFunctionHttpError(err: FunctionsHttpError): Response {
  const ctx = err.context;
  if (ctx instanceof Response) return ctx;
  return new Response(JSON.stringify({ error: err.message }), {
    status: 500,
    headers: { "content-type": "application/json" },
  });
}

/** Loads ticker news from Edge function `polygon-news` (server-side Polygon key). */
export async function fetchMassiveNewsForTicker(
  ticker: string,
  options?: { signal?: AbortSignal; limit?: number; publishedUtc?: string },
): Promise<NewsListItem[]> {
  void options?.publishedUtc;

  const limit = options?.limit ?? 10;
  let res: Response;
  try {
    const { data, error } = await supabase.functions.invoke("polygon-news", {
      body: {
        symbol: ticker.toUpperCase(),
        limit,
        order: "desc",
      },
      signal: options?.signal,
    });
    if (error) {
      if (error instanceof FunctionsHttpError) {
        res = responseFromFunctionHttpError(error);
      } else {
        throw error;
      }
    } else {
      res = new Response(JSON.stringify(data), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "Polygon news function unavailable.";
    console.warn("[news]", msg);
    throw new Error(msg);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`News API failed (${res.status}): ${text.slice(0, 240)}`);
  }

  const json = (await res.json()) as unknown;
  const rawList = pickArticles(json);
  const items: NewsListItem[] = [];
  for (let i = 0; i < rawList.length; i++) {
    const n = normalizeArticle(rawList[i], i);
    if (n) items.push(n);
    if (items.length >= limit) break;
  }
  return items;
}
