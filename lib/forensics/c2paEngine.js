// C2PA reader: official SDK first, local JUMBF scan as fallback.
// The SDK (WASM) is lazy-loaded from CDN so `next build` stays offline-safe.
import { emptyEngine } from './report.js';
import { scanForJumbf } from './bytes.js';

const C2PA_VERSION = 'https://cdn.jsdelivr.net/npm/@contentauth/c2pa-web@0.5.5/+esm';
const WASM_SRC = 'https://cdn.jsdelivr.net/npm/@contentauth/c2pa-web@0.5.5/dist/resources/c2pa_bg.wasm';

let c2paPromise = null;
function loadC2pa() {
  if (!c2paPromise) c2paPromise = import(/* webpackIgnore: true */ C2PA_VERSION)
    .then((m) => m.createC2pa({ wasmSrc: WASM_SRC }));
  return c2paPromise;
}

// Never let the CDN/WASM load hang the pipeline: 12s cap, then fall back
// to the local JUMBF scan (offline-safe). This was the "stuck at 30%" hang.
function withTimeout(promise, ms, label) {
  let timer;
  const cap = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, cap]).finally(() => clearTimeout(timer));
}

const AI_ACTIONS = ['created', 'created with ai', 'ai-generated', 'generated'];
const AI_GENERATORS = ['firefly', 'dall', 'gpt-image', 'midjourney', 'diffusion', 'imagen', 'gemini'];

function manifestFlags(manifest) {
  const text = JSON.stringify(manifest || {}).toLowerCase();
  return AI_ACTIONS.concat(AI_GENERATORS).some((k) => text.includes(k));
}

export async function runC2paReader(file, opts = {}) {
  const eng = emptyEngine('c2pa-reader', 'C2PA Content Credentials', 'c2pa-js 0.5.x + jumb-scan v1');
  const t0 = performance.now();
  const timeoutMs = opts.timeoutMs ?? 12000;
  // Read the file ONCE and reuse the bytes for both the local scan and the SDK.
  const buf = new Uint8Array(await file.arrayBuffer());
  const local = scanForJumbf(buf);
  try {
    const c2pa = await withTimeout(loadC2pa(), timeoutMs, 'C2PA WASM load');
    const reader = await withTimeout(
      c2pa.reader.fromBlob(file.type || 'image/jpeg', new Blob([buf.buffer], { type: file.type })),
      timeoutMs,
      'C2PA manifest read',
    );
    const store = await reader.manifestStore();
    await reader.free();
    const labels = store?.manifests ? Object.keys(store.manifests) : [];
    if (!labels.length) {
      eng.status = local.hasJumbf ? 'unverifiable-hint' : 'not-found';
      eng.details = local.hasJumbf
        ? [`JUMBF markers present (${local.hits.join(', ')}) but no readable manifest — likely stripped or truncated.`]
        : ['No C2PA manifest store found in this file.'];
      eng.limitations = ['Social platforms strip C2PA on recompress. Absence proves nothing.'];
    } else {
      const active = store.activeManifestLabel ? store.manifests[store.activeManifestLabel] : store.manifests[labels[0]];
      const aiFlag = manifestFlags(active);
      eng.aiFlag = aiFlag;
      eng.status = 'verified-signed';
      eng.score = aiFlag ? 95 : 5;
      eng.details = [
        `Active manifest: ${store.activeManifestLabel || labels[0]}`,
        `Claim generator: ${active?.claimGeneratorInfo?.[0]?.name || active?.claim_generator || 'unknown'}`,
        `Issuer: ${active?.issuer || active?.signatureInfo?.issuer || 'unknown'}`,
        `AI-generative signal in manifest: ${aiFlag ? 'YES' : 'no'}`,
        `Validation: ${store?.validationStatus?.length ? JSON.stringify(store.validationStatus) : 'no errors reported by reader'}`,
      ];
      eng.limitations = ['Trust depends on the signer chain shown above, not on this score alone.'];
    }
  } catch (err) {
    eng.status = local.hasJumbf ? 'unverifiable-hint' : 'not-found';
    eng.details = [
      `Full C2PA reader unavailable (${String(err?.message || err).slice(0, 140)}).`,
      local.hasJumbf
        ? `Local scan found JUMBF markers (${local.hits.join(', ')}) — manifest may exist but could not be validated offline.`
        : 'Local scan found no JUMBF/C2PA markers.',
    ];
    eng.limitations = ['Offline fallback cannot validate signatures. Re-run online for full validation.'];
  }
  eng.runtimeMs = Math.round(performance.now() - t0);
  return eng;
}
