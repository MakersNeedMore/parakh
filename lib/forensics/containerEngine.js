// container-check: file-structure sanity, not a real/fake classifier.
import { emptyEngine } from './report.js';
import { sniffFormat } from './bytes.js';

function countJpegScans(buf) {
  let n = 0;
  for (let i = 0; i < buf.length - 1; i++) {
    if (buf[i] === 0xff && buf[i + 1] === 0xda) n++;
  }
  return n;
}

export async function runContainerCheck(file) {
  const eng = emptyEngine('container-check', 'Container Integrity', 'parakh-container v1');
  const t0 = performance.now();
  const buf = new Uint8Array(await file.arrayBuffer());
  const fmt = sniffFormat(buf, file.type);
  const d = [`Format: ${fmt}. Size: ${(file.size / 1024).toFixed(1)} KB.`];
  if (fmt === 'JPEG') {
    const scans = countJpegScans(buf);
    d.push(scans > 1
      ? `Multiple SOS scan segments (${scans}) — consistent with re-encode or edit-save cycle.`
      : 'Single SOS scan segment — consistent with one export, not proof of camera origin.');
  } else if (fmt === 'PNG') {
    d.push('PNG is lossless; generator parameter chunks (if any) are reported by software-tags.');
  } else if (fmt === 'WEBP') {
    d.push('WEBP container; EXIF/XMP carried in VP8X chunks when present.');
  }
  const ascii = new TextDecoder('ascii').decode(buf.subarray(0, 65536)).toLowerCase();
  d.push(ascii.includes('exif') ? 'EXIF header present.' : 'No EXIF header in first 64 KB (common after social re-encode).');
  d.push(ascii.includes('xmp') ? 'XMP packet present.' : 'No XMP packet in first 64 KB.');
  eng.status = 'informational';
  eng.details = d;
  eng.limitations = ['Structure hints only. Never decide real-vs-fake from containers.'];
  eng.runtimeMs = Math.round(performance.now() - t0);
  return eng;
}
