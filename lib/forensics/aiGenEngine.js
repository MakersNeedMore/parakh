// AI-generated image detector: thin client for the Parakh inference backend.
// The browser NEVER downloads model weights — it POSTs the image to
// POST {backend}/v1/detect/ai-generated and renders the returned engine result.
// Free + self-hosted. Set NEXT_PUBLIC_PARAKH_BACKEND (default http://127.0.0.1:8000);
// on Vercel it must point at the public HTTPS backend URL.
import { emptyEngine } from './report.js';
import { getAccessToken } from '../parakh-api.js';

export const AI_GEN_VERSION = 'DeepGuard-FaceForensics++ (MS-EffGCViT)';
const PROD_BACKEND_DEFAULT = 'https://shivangsaxena10-parakh-backend.hf.space';
const BACKEND = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_PARAKH_BACKEND) || PROD_BACKEND_DEFAULT;

const isLocalHost = () =>
  typeof window !== 'undefined' && /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location?.hostname || '');

export function backendBase() {
  if (typeof window !== 'undefined') {
    if (window.__PARAKH_BACKEND__) return window.__PARAKH_BACKEND__.replace(/\/$/, '');
    if (window.__PARAKH_API_URL__) return window.__PARAKH_API_URL__.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
    if (isLocalHost()) return 'http://localhost:8000';
  }
  return BACKEND.replace(/\/$/, '');
}

// Why the pixel engine has no score. The UI uses this to pick an honest badge
// instead of rendering a null score as "0% / Authentic".
export const AI_GEN_REASON = {
  BACKEND_UNREACHABLE: 'backend-unreachable',
  MODEL_UNAVAILABLE: 'model-unavailable',
  NO_FACE: 'no-face',
  INVALID_MEDIA: 'invalid-media',
  BACKEND_ERROR: 'backend-error',
};

export const NO_FACE_MESSAGE = 'No human face detected. Parakh DeepGuard specializes in facial deepfakes.';

class DetectorError extends Error {
  constructor(message, reason) {
    super(message);
    this.reason = reason;
  }
}

export async function runAiGeneratedDetector(file, onStage) {
  const eng = emptyEngine('ai-generated-detector', 'AI-Generated Image Detector', AI_GEN_VERSION);
  eng.reason = null;
  eng.message = null;
  const now = () => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now());
  const t0 = now();
  const say = (s) => onStage && onStage(s);
  const base = backendBase();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 120000); // 2 min hard cap
  try {
    say('Uploading image to the inference backend…');
    const form = new FormData();
    form.append('image', file, file.name || 'upload.png');
    const headers = {};
    const token = getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    let res;
    try {
      res = await fetch(`${base}/v1/detect/ai-generated`, { method: 'POST', body: form, headers, signal: ctrl.signal });
    } catch (e) {
      const why = e?.name === 'AbortError' ? 'timed out after 120s' : String(e?.message || e);
      const hint = isLocalHost()
        ? 'Start the backend with: .\\run_backend.ps1 or npm run dev:backend'
        : 'The backend service may be asleep, down, or blocking this origin (CORS).';
      throw new DetectorError(`Backend unreachable at ${base} (${why}). ${hint}`, AI_GEN_REASON.BACKEND_UNREACHABLE);
    }
    say('Backend is scoring pixels…');
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 503 || data?.status === 'model-missing') {
        throw new DetectorError(
          'Backend model weights are initializing. Please re-run analysis in a few moments.',
          AI_GEN_REASON.MODEL_UNAVAILABLE,
        );
      }
      throw new DetectorError(String(data?.detail || `Backend error (HTTP ${res.status}).`), AI_GEN_REASON.BACKEND_ERROR);
    }
    if (data.version) eng.version = String(data.version);
    if (typeof data.runtimeMs === 'number') eng.runtimeMs = data.runtimeMs;
    eng.limitations = Array.isArray(data.limitations) ? data.limitations.map(String) : [];
    eng.message = data.message ? String(data.message) : null;

    if (data.status === 'no_face_detected') {
      eng.score = null;
      eng.status = 'no_face_detected';
      eng.reason = AI_GEN_REASON.NO_FACE;
      eng.message = eng.message || NO_FACE_MESSAGE;
      eng.details = [eng.message];
    } else if (typeof data.score === 'number') {
      eng.score = data.score;
      eng.status = data.status || 'inconclusive';
      eng.details = Array.isArray(data.details) && data.details.length
        ? data.details.map(String)
        : ['Backend returned no details.'];
    } else {
      // Backend answered but could not score (model loading, unreadable image, ...).
      eng.score = null;
      eng.status = 'unavailable';
      eng.reason = data.status === 'invalid_media' ? AI_GEN_REASON.INVALID_MEDIA : AI_GEN_REASON.MODEL_UNAVAILABLE;
      eng.details = Array.isArray(data.details) && data.details.length
        ? data.details.map(String)
        : [eng.message || 'The neural model returned no score.'];
    }
  } catch (err) {
    eng.score = null;
    eng.status = 'unavailable';
    eng.reason = err?.reason || AI_GEN_REASON.BACKEND_ERROR;
    eng.message = String(err?.message || err).slice(0, 300);
    eng.details = [`Pixel detector unavailable: ${eng.message}`];
    eng.limitations = ['Provenance engines still ran. Fix the backend and re-run for the pixel score.'];
  } finally {
    clearTimeout(timer);
  }
  if (!eng.runtimeMs) eng.runtimeMs = Math.round(now() - t0);
  return eng;
}
