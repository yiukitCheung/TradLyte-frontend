import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

function assertAllowedPath(pathname: string): void {
  if (
    pathname !== "/backtest" &&
    !pathname.startsWith("/market/") &&
    !pathname.startsWith("/picks/")
  ) {
    throw new Error(`Unsupported gateway path: ${pathname}`);
  }
}

/**
 * Proxy to AWS HTTP API via Supabase Edge Function `market-proxy`.
 * Sends `path` in the query string so older deployed versions of the function
 * (which only read `?path=`) still work; newer builds also accept a JSON envelope.
 * User JWT is sent as Bearer; gateway key stays in Edge secrets only.
 */
export async function marketGatewayFetch(
  pathname: string,
  init?: Omit<RequestInit, "headers"> & {
    searchParams?: URLSearchParams | Record<string, string>;
    headers?: HeadersInit;
  },
): Promise<Response> {
  if (!SUPABASE_URL) throw new Error("Missing VITE_SUPABASE_URL.");
  if (!SUPABASE_ANON) throw new Error("Missing VITE_SUPABASE_PUBLISHABLE_KEY.");

  const cleanPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  assertAllowedPath(cleanPath);

  const { searchParams: spInput, headers: hdrInit, signal, ...rest } = init ?? {};

  const u = new URL(`${SUPABASE_URL}/functions/v1/market-proxy`);
  u.searchParams.set("path", cleanPath);

  if (spInput instanceof URLSearchParams) {
    spInput.forEach((value, key) => u.searchParams.append(key, value));
  } else if (spInput && typeof spInput === "object") {
    Object.entries(spInput).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        u.searchParams.set(key, String(value));
      }
    });
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("Sign in required for market data");
  }

  const headers = new Headers(hdrInit);
  headers.set("Authorization", `Bearer ${session.access_token}`);
  headers.set("apikey", SUPABASE_ANON);

  return fetch(u.toString(), {
    ...rest,
    headers,
    signal,
  });
}
