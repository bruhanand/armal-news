// Tiny wrapper around fetch for the admin client-side calls. Each route
// returns { ok, ... } or { error } — we surface that uniformly so the
// callers don't repeat the shape check.

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

export async function adminPost<T = unknown>(
  url: string,
  body?: unknown,
): Promise<ApiResult<T>> {
  try {
    const init: RequestInit = { method: "POST" };
    if (body !== undefined) {
      init.headers = { "content-type": "application/json" };
      init.body = JSON.stringify(body);
    }
    const res = await fetch(url, init);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: (json as { error?: string }).error ?? `HTTP ${res.status}` };
    }
    return { ok: true, data: json as T };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function adminPatch<T = unknown>(
  url: string,
  body: unknown,
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: (json as { error?: string }).error ?? `HTTP ${res.status}` };
    }
    return { ok: true, data: json as T };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
