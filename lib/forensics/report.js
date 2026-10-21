// Parakh unified forensic report schema (spec section 6).
// Each engine reports independently. No averaged fake probability.
export function emptyEngine(id, name, version) {
  return {
    id, name, model: name, version,
    status: 'not-run', score: null, runtimeMs: 0,
    details: [], limitations: [],
  };
}

export function buildReport({ fileName, fileSize, fileType, engines, startedAt }) {
  const finishedAt = Date.now();
  return {
    schema: 'parakh-forensic-report/v1',
    file: { name: fileName, size: fileSize, type: fileType },
    engines,
    overall: summarize(engines),
    timing: { startedAt, finishedAt, totalMs: finishedAt - startedAt },
    hostedOn: 'edge (on-device, free)',
  };
}

function summarize(engines) {
  const c2pa = engines.find((e) => e.id === 'c2pa-reader');
  const tags = engines.find((e) => e.id === 'software-tags');
  const aiGen = engines.find((e) => e.id === 'ai-generated-detector');
  if (c2pa?.status === 'verified-signed' && c2pa?.aiFlag) {
    return { verdict: 'signed-ai', label: 'Signed AI-Generated Provenance', tone: 'warn',
      note: 'Content Credentials mark this asset as AI-generated. Strongest Step-1 signal.' };
  }
  if (c2pa?.status === 'verified-signed') {
    return { verdict: 'signed-provenance', label: 'Signed Provenance Found', tone: 'success',
      note: 'Verifiable Content Credential present. Check issuer below. Provenance proves origin, not real-vs-fake.' };
  }
  if (aiGen?.status === 'flagged') {
    return { verdict: 'pixel-ai', label: 'Pixel Forensics Flag AI Generation', tone: 'danger',
      note: `On-device model scores this image ${aiGen.score}% AI-generated with no signed provenance to contradict it.` };
  }
  if (tags?.status === 'flagged' || c2pa?.status === 'tampered-or-untrusted') {
    return { verdict: 'suspicious', label: 'AI Fingerprints Detected', tone: 'danger',
      note: 'Generator fingerprints or invalid manifest found. Confirm with pixel-forensic models (Steps 2-5).' };
  }
  if (aiGen?.status === 'likely-real') {
    return { verdict: 'pixel-real', label: 'Pixel Forensics Suggest Real Capture', tone: 'success',
      note: `On-device model scores this image ${aiGen.score}% AI-generated (low). No provenance found — still INCONCLUSIVE on its own.` };
  }
  return { verdict: 'no-provenance', label: 'No Provenance Found', tone: 'neutral',
    note: 'No C2PA manifest or known generator tags. INCONCLUSIVE — most real photos and stripped AI images look the same here.' };
}
