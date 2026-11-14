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
    return {
      verdict: 'signed-ai',
      label: 'Signed AI-Generated Provenance',
      tone: 'warn',
      note: 'Content Credentials cryptographically certify this asset as AI-generated.',
    };
  }

  if (c2pa?.status === 'verified-signed') {
    return {
      verdict: 'signed-provenance',
      label: 'Signed Provenance Found',
      tone: 'success',
      note: 'Verifiable Content Credential present. Check issuer below. Provenance proves origin, not real-vs-fake.',
    };
  }

  // Priority 1: AI Model Flagged (>60%)
  if (aiGen?.status === 'flagged') {
    return {
      verdict: 'pixel-ai',
      label: 'Deepfake Manipulation Detected',
      tone: 'danger',
      note: `Parakh DeepGuard neural classifier scores this media ${aiGen.score}% manipulated with visible facial boundary anomalies.`,
    };
  }

  // Priority 2: Generator tags or tampered manifest
  if (tags?.status === 'flagged' || c2pa?.status === 'tampered-or-untrusted') {
    return {
      verdict: 'suspicious',
      label: 'Synthetic Fingerprints Detected',
      tone: 'danger',
      note: 'Generator fingerprints or invalid manifest found. Facial manipulation or metadata tampering suspected.',
    };
  }

  // Priority 3: AI Model Uncertain (40-59%)
  if (aiGen?.status === 'uncertain') {
    return {
      verdict: 'suspicious',
      label: 'Inconclusive / Potential Manipulation',
      tone: 'warn',
      note: `Parakh DeepGuard model scored ${aiGen.score}% manipulation probability. Minor artifacts or boundary noise detected.`,
    };
  }

  // Priority 4: AI Model Likely Real (<40%)
  if (aiGen?.status === 'likely-real') {
    return {
      verdict: 'pixel-real',
      label: 'Likely Authentic Facial Media',
      tone: 'success',
      note: `Parakh DeepGuard model scores this media with low manipulation probability (${aiGen.score}%). Facial features appear consistent.`,
    };
  }

  // Priority 5: AI Model Unavailable (e.g. no face detected)
  if (aiGen?.status === 'unavailable') {
    const reason = aiGen.details?.[0] || 'Neural model could not evaluate facial features.';
    return {
      verdict: 'no-provenance',
      label: 'Neural Verification Incomplete',
      tone: 'warn',
      note: `${reason} Ensure a clear, visible face is provided for neural analysis.`,
    };
  }

  return {
    verdict: 'no-provenance',
    label: 'No Provenance Found',
    tone: 'neutral',
    note: 'No C2PA manifest or detectable generator tags found.',
  };
}
