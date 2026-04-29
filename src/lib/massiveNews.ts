const MASSIVE_NEWS_BASE = "https://api.massive.com/v2/reference/news";

export interface MassiveNewsPublisher {
  name?: string;
  homepage_url?: string;
  logo_url?: string;
  favicon_url?: string;
}

export interface MassiveNewsArticle {
  id: string;
  title: string;
  author?: string;
  published_utc: string;
  article_url: string;
  publisher?: MassiveNewsPublisher;
  description?: string;
}

export interface MassiveNewsResponse {
  results?: MassiveNewsArticle[];
  status?: string;
  count?: number;
}

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

function todayUtcDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Fetches news for a ticker from Massive (Polygon) reference API.
 * Uses VITE_MASSIVE_API_KEY (required in browser). Falls back to same value as MASSIVE_API_KEY only on server — in Vite client use VITE_ prefix.
 */
export async function fetchMassiveNewsForTicker(
  ticker: string,
  options?: { signal?: AbortSignal; limit?: number; publishedUtc?: string }
): Promise<NewsListItem[]> {
  const apiKey =
    import.meta.env.VITE_MASSIVE_API_KEY as string | undefined;
  if (!apiKey?.trim()) {
    console.warn("VITE_MASSIVE_API_KEY is not set; news will not load.");
    return [];
  }

  const limit = options?.limit ?? 10;
  const publishedUtc = options?.publishedUtc;

  const buildUrl = (includeDate: boolean) => {
    const params = new URLSearchParams({
      ticker: ticker.toUpperCase(),
      order: "desc",
      limit: String(limit),
      sort: "published_utc",
      apiKey: apiKey.trim(),
    });
    if (includeDate && publishedUtc !== undefined) {
      params.set("published_utc", publishedUtc);
    } else if (includeDate) {
      params.set("published_utc", todayUtcDateString());
    }
    return `${MASSIVE_NEWS_BASE}?${params.toString()}`;
  };

  let res = await fetch(buildUrl(true), { signal: options?.signal });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Massive news failed (${res.status}): ${text.slice(0, 200)}`);
  }

  let json = (await res.json()) as MassiveNewsResponse;
  let results = json.results ?? [];

  if (results.length === 0 && publishedUtc === undefined) {
    res = await fetch(buildUrl(false), { signal: options?.signal });
    if (res.ok) {
      json = (await res.json()) as MassiveNewsResponse;
      results = json.results ?? [];
    }
  }

  return results.map((r) => ({
    id: r.id,
    title: r.title,
    source: r.publisher?.name ?? "News",
    time: formatNewsTime(r.published_utc),
    url: r.article_url,
  }));
}
