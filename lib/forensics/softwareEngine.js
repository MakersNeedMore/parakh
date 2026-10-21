// software-tags engine: match extracted text against AI signature table.
import { emptyEngine } from './report.js';
import { extractTextChunks, sniffFormat } from './bytes.js';
import { AI_SOFTWARE_SIGNATURES } from './signatures.js';

export async function runSoftwareTags(file) {
  const eng = emptyEngine('software-tags', 'AI Generator Fingerprints', 'parakh-sigdb v1');
  const t0 = performance.now();
  const buf = new Uint8Array(await file.arrayBuffer());
  const fmt = sniffFormat(buf, file.type);
  const text = extractTextChunks(buf).toLowerCase();
  const hits = AI_SOFTWARE_SIGNATURES.filter((s) => text.includes(s.tag));
  if (hits.length) {
    eng.status = 'flagged';
    eng.score = Math.min(60 + hits.length * 10, 95);
    eng.details = hits.map((h) => `${h.label} (${h.vendor})`);
    eng.details.unshift(`Format: ${fmt}. ${hits.length} fingerprint(s) matched in metadata text.`);
  } else {
    eng.status = 'not-found';
    eng.details = [`Format: ${fmt}. No known AI-generator tags in readable metadata.`, 'Scanned EXIF/XMP/PNG-text compatible ASCII strings.'];
  }
  eng.limitations = ['Metadata is trivially stripped or forged. Absence is inconclusive; presence needs manifest cross-check.'];
  eng.runtimeMs = Math.round(performance.now() - t0);
  return eng;
}
