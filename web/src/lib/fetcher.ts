const BASE = import.meta.env.PUBLIC_API_BASE_URL; // opcional en dev
const API_URL = BASE || 'http://localhost:4000'; // URL directa en desarrollo

function buildUrl(path: string, params?: Record<string,string|number|boolean>) {
  // En desarrollo, usar URL directa a la API (sin proxy)
  // En producción, usar BASE URL
  const baseUrl = import.meta.env.DEV ? 'http://localhost:4000' : (BASE || window.location.origin);
  
  // Construir URL completa
  const finalUrl = new URL(path, baseUrl);
  
  // Agregar parámetros si existen
  if (params) {
    Object.entries(params).forEach(([k,v]) => finalUrl.searchParams.set(k, String(v)));
  }
  
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
