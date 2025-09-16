const BASE = import.meta.env.PUBLIC_API_BASE_URL; // vacío en dev

function buildUrl(path: string, params?: Record<string, string | number | boolean>) {
  const rel = path.startsWith('/api') ? path : `/api${path.startsWith('/') ? '' : '/'}${path}`;
  const href = BASE ? new URL(rel.replace('/api', ''), BASE).toString()
                    : new URL(rel, window.location.origin).toString();
  const url = new URL(href);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  return url.toString();
}

export async function apiGet(p: string, q?: Record<string, string | number | boolean>) {
  const r = await fetch(buildUrl(p, q));
  const t = await r.text().catch(() => '');
  if (!r.ok) throw new Error(t || r.statusText);
  return t ? JSON.parse(t) : null;
}

export async function apiPost(p: string, b: unknown) {
  const r = await fetch(buildUrl(p), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(b)
  });
  const t = await r.text().catch(() => '');
  if (!r.ok) throw new Error(t || r.statusText);
  return t ? JSON.parse(t) : null;
}