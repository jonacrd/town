const BASE = import.meta.env.PUBLIC_API_BASE_URL; // opcional en dev

function buildUrl(path: string, params?: Record<string,string|number|boolean>) {
  // Si hay BASE (producción), arma URL absoluta; si no, usa ruta relativa /api
  const isAbsolute = !!BASE && !path.startsWith('http');
  const u = isAbsolute ? new URL(path, BASE) : new URL(path, window.location.origin);
  if (!isAbsolute && !path.startsWith('/api')) path = `/api${path.startsWith('/') ? '' : '/'}${path}`;
  const finalUrl = isAbsolute ? u : new URL(path, window.location.origin);
  if (params) Object.entries(params).forEach(([k,v]) => finalUrl.searchParams.set(k, String(v)));
  return finalUrl.toString();
}

export async function apiGet(path: string, params?: Record<string,string|number|boolean>) {
  const url = buildUrl(path, params);
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text().catch(()=>res.statusText)}`);
  return res.json();
}

export async function apiPost(path: string, body: unknown) {
  const url = buildUrl(path);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type':'application/json', Accept: 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text().catch(()=>res.statusText)}`);
  return res.json();
}
