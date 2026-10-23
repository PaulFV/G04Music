/* ============================================================
   G04Musik — Songtitel-Server (Cloudflare Worker)
   Liest bei einem Radiosender den aktuellen Titel („Künstler - Titel“) aus dem
   Stream und gibt ihn der App weiter. Ein Browser darf das bei den meisten
   Sendern nicht selbst, ein Server schon.

   Aufruf:  https://<dein-worker>.workers.dev/?url=<Stream-Adresse>
   Antwort: { "ok": true, "title": "Künstler - Titel", "station": { "name": …, "genre": …, "bitrate": … } }

   Einrichten: siehe README.md, Abschnitt „Songtitel-Server“.
   ============================================================ */

/* Nur diese Seiten dürfen den Server nutzen (sonst könnte jeder ihn mitbenutzen) */
const ALLOWED_ORIGINS = [
  'https://paulfv.github.io',
  'http://localhost:8000',
  'http://localhost:8123',
  'http://127.0.0.1:8000'
];

const CACHE_SECONDS = 10;     /* gleiche Abfrage innerhalb dieser Zeit nicht doppelt zum Sender schicken */
const MAX_BYTES = 200000;     /* mehr als das wird nie aus dem Stream gelesen */

export default {
  async fetch(req) {
    const origin = req.headers.get('Origin') || '';
    const allowed = !origin || ALLOWED_ORIGINS.includes(origin);
    const cors = {
      'Access-Control-Allow-Origin': allowed && origin ? origin : ALLOWED_ORIGINS[0],
      'Vary': 'Origin'
    };

    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: { ...cors, 'Access-Control-Allow-Methods': 'GET', 'Access-Control-Max-Age': '86400' } });
    }
    if (!allowed) return reply({ ok: false, error: 'origin' }, 403, cors);
    if (req.method !== 'GET') return reply({ ok: false, error: 'method' }, 405, cors);

    const target = new URL(req.url).searchParams.get('url') || '';
    const stream = safeUrl(target);
    if (!stream) return reply({ ok: false, error: 'url' }, 400, cors);

    const cache = typeof caches !== 'undefined' ? caches.default : null;
    const key = new Request('https://nowplaying.cache/' + encodeURIComponent(stream.href));
    if (cache) {
      const hit = await cache.match(key);
      if (hit) return new Response(hit.body, { status: hit.status, headers: { ...Object.fromEntries(hit.headers), ...cors } });
    }

    let out;
    try { out = { ok: true, ...(await readTitle(stream.href)) }; }
    catch (e) { out = { ok: false, error: 'stream' }; }

    const res = reply(out, 200, { ...cors, 'Cache-Control': 'public, max-age=' + CACHE_SECONDS });
    if (cache) { try { await cache.put(key, res.clone()); } catch (e) { /* egal */ } }
    return res;
  }
};

function reply(obj, status, headers) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers } });
}

/* Nur normale Internet-Adressen, keine lokalen oder internen */
function safeUrl(s) {
  let u;
  try { u = new URL(s); } catch (e) { return null; }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
  const h = u.hostname.toLowerCase();
  if (h === 'localhost' || h.endsWith('.local') || h.endsWith('.internal') || h.endsWith('.localhost')) return null;
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(h)) {
    const [a, b] = h.split('.').map(Number);
    if (a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) return null;
  }
  if (h.includes(':') || h.startsWith('[')) return null;   /* keine IPv6-Adressen */
  return u;
}

async function readTitle(streamUrl) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 8000);
  try {
    const r = await fetch(streamUrl, {
      headers: { 'Icy-MetaData': '1', 'User-Agent': 'G04Musik-NowPlaying/1.0' },
      signal: ctl.signal, redirect: 'follow'
    });
    const station = {
      name: r.headers.get('icy-name') || '',
      genre: r.headers.get('icy-genre') || '',
      bitrate: r.headers.get('icy-br') || ''
    };
    const every = parseInt(r.headers.get('icy-metaint') || '0', 10);
    if (!every || !r.body) { try { await r.body?.cancel(); } catch (e) {} return { title: '', station }; }

    const reader = r.body.getReader();
    let buf = new Uint8Array(0), pos = 0, title = '';
    /* Nach jeweils „every“ Audio-Bytes folgt ein Textblock; der erste ist oft leer, darum bis zu 4 Blöcke */
    for (let block = 0; block < 4 && !title; block++) {
      const lenAt = pos + every;
      buf = await fill(reader, buf, lenAt + 1);
      if (buf.length < lenAt + 1) break;
      const size = buf[lenAt] * 16, end = lenAt + 1 + size;
      if (size > 0) {
        buf = await fill(reader, buf, end);
        if (buf.length < end) break;
        title = parseTitle(buf.subarray(lenAt + 1, end));
      }
      pos = end;
    }
    try { await reader.cancel(); } catch (e) {}
    return { title, station };
  } finally { clearTimeout(timer); }
}

async function fill(reader, buf, need) {
  while (buf.length < need && buf.length < MAX_BYTES) {
    const { value, done } = await reader.read();
    if (done) break;
    const next = new Uint8Array(buf.length + value.length);
    next.set(buf); next.set(value, buf.length);
    buf = next;
  }
  return buf;
}

/* Sender schicken Text mal als UTF-8, mal als Windows-1252 */
function decode(bytes) {
  try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
  catch (e) { return new TextDecoder('windows-1252').decode(bytes); }
}

function parseTitle(bytes) {
  const text = decode(bytes).replace(/\0+$/, '');
  const m = text.match(/StreamTitle='((?:[^']|'(?!;|$))*)'/);
  return m ? m[1].trim() : '';
}
