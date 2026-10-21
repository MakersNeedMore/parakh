// Zero-dependency byte scanners: JUMBF/C2PA marker + text-chunk extraction.
// Runs synchronously on the first bytes of the file, always available
// even when the WASM C2PA reader cannot load (offline / blocked CDN).

const JUMBF_SIGS = ['jumb', 'jumd', 'jums', 'c2pa', 'c2pa_manifest', 'manifest'];

export function scanForJumbf(bytes, maxScan = 4 * 1024 * 1024) {
  const n = Math.min(bytes.length, maxScan);
  // ASCII fast path
  let ascii = '';
  try {
    ascii = new TextDecoder('ascii').decode(bytes.subarray(0, n)).toLowerCase();
  } catch { ascii = ''; }
  const hits = JUMBF_SIGS.filter((s) => ascii.includes(s));
  return { scannedBytes: n, hits, hasJumbf: hits.length > 0 };
}

export function extractTextChunks(bytes, maxScan = 2 * 1024 * 1024) {
  const n = Math.min(bytes.length, maxScan);
  // Decode once, then split on non-text runs — no per-byte string concat.
  let ascii = '';
  try {
    ascii = new TextDecoder('ascii').decode(bytes.subarray(0, n));
  } catch { return ''; }
  const runs = ascii.split(/[^ -~\t\n\r]+/).filter((s) => s.length >= 6);
  let total = 0;
  const kept = [];
  for (const r of runs) {
    const chunk = r.length > 4096 ? r.slice(0, 4096) : r;
    kept.push(chunk);
    total += chunk.length + 1;
    if (total > 200000) break;
  }
  return kept.join('\n').slice(0, 200000);
}

export function sniffFormat(bytes, mime) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return 'JPEG';
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return 'PNG';
  if (bytes[0] === 0x52 && bytes[1] === 0x49) return 'WEBP';
  if (mime?.includes('png')) return 'PNG';
  if (mime?.includes('jpeg') || mime?.includes('jpg')) return 'JPEG';
  if (mime?.includes('webp')) return 'WEBP';
  return mime || 'unknown';
}
