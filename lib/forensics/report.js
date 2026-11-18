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
      note: `Parakh DeepGuard model scores this media with low face-swap probability (${aiGen.score}%). The model targets facial deepfakes; a low score does not rule out other AI edits or fully AI-generated images.`,
    };
  }

  // Priority 5: no face in the image -> the facial model is out of scope.
  if (aiGen?.status === 'no_face_detected') {
    return {
      verdict: 'no-face',
      label: 'No Human Face Detected',
      tone: 'neutral',
      note: `${aiGen.message || 'No human face detected. Parakh DeepGuard specializes in facial deepfakes.'} No deepfake score was produced; the provenance checks below still apply.`,
    };
  }

  // Priority 6: backend offline / model failed -> say so, never imply "authentic".
  if (aiGen?.status === 'unavailable') {
    if (aiGen.reason === 'backend-unreachable') {
      return {
        verdict: 'backend-unreachable',
        label: 'Neural Verification Not Run',
        tone: 'warn',
        note: 'The AI neural backend could not be reached, so no deepfake score was produced. This is not an authenticity result.',
      };
    }
    const reason = aiGen.message || aiGen.details?.[0] || 'Neural model could not evaluate the image.';
    return {
      verdict: 'no-provenance',
      label: 'Neural Verification Incomplete',
      tone: 'warn',
      note: `${reason} No deepfake score was produced.`,
    };
  }

  return {
    verdict: 'no-provenance',
    label: 'No Provenance Found',
    tone: 'neutral',
    note: 'No C2PA manifest or detectable generator tags found.',
  };
}
