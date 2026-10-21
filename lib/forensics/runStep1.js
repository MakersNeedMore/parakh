// Step-1 + Step-2 orchestrator: provenance engines + backend AI-generated detector.
// Yields to the UI thread between engines so progress paints and the page
// never goes unresponsive on large files.
import { buildReport } from './report.js';
import { runC2paReader } from './c2paEngine.js';
import { runSoftwareTags } from './softwareEngine.js';
import { runContainerCheck } from './containerEngine.js';
import { runAiGeneratedDetector } from './aiGenEngine.js';

const yieldToUI = () => new Promise((r) => setTimeout(r, 0));

export async function runStep1Provenance(file, onProgress) {
  const startedAt = Date.now();
  const tick = (p) => onProgress && onProgress(p);
  tick(5);
  await yieldToUI();
  // Cap the C2PA WASM/CDN wait so a blocked CDN can never freeze analysis.
  const c2pa = await runC2paReader(file, { timeoutMs: 12000 });
  tick(30);
  await yieldToUI();
  const [tags, container] = await Promise.all([runSoftwareTags(file), runContainerCheck(file)]);
  tick(45);
  await yieldToUI();
  // Step-2: backend pixel test. Probe ticks forward while we wait so the
  // button never looks frozen, even on cold-start (~10s model load).
  let shown = 45;
  const probe = setInterval(() => {
    shown = Math.min(92, shown + 3);
    tick(shown);
  }, 800);
  let aiGen;
  try {
    aiGen = await runAiGeneratedDetector(file, () => tick(Math.min(92, shown + 2)));
  } finally {
    clearInterval(probe);
  }
  tick(95);
  const report = buildReport({
    fileName: file.name, fileSize: file.size, fileType: file.type,
    engines: [c2pa, tags, container, aiGen], startedAt,
  });
  tick(100);
  return report;
}

