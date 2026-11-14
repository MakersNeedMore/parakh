// AI-generated image detector: thin client for the Parakh inference backend.
// The browser NEVER downloads model weights — it POSTs the image to
// POST {backend}/v1/detect/ai-generated and renders the returned engine result.
// Free + self-hosted. Set NEXT_PUBLIC_PARAKH_BACKEND (default http://127.0.0.1:8000).
import { emptyEngine } from './report.js';
import { getAccessToken } from '../parakh-api.js';

export const AI_GEN_VERSION = 'DeepGuard-FaceForensics++ (MS-EffGCViT)';
const BACKEND = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_PARAKH_BACKEND) || 'http://127.0.0.1:8000';

export function backendBase() {
  if (typeof window !== 'undefined') {
    if (window.__PARAKH_BACKEND__) return window.__PARAKH_BACKEND__.replace(/\/$/, '');
    if (window.__PARAKH_API_URL__) return window.__PARAKH_API_URL__.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
    if (window.location?.hostname === 'localhost') return 'http://localhost:8000';
  }
  return BACKEND.replace(/\/$/, '');
}

export async function runAiGeneratedDetector(file, onStage) {
  const eng = emptyEngine('ai-generated-detector', 'AI-Generated Image Detector', AI_GEN_VERSION);
  const now = () => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now());
  const t0 = now();
  const say = (s) => onStage && onStage(s);
  const base = backendBase();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 120000); // 2 min hard cap
  try {
    say('Uploading image to local inference backend…');
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
      throw new Error(
        `Backend unreachable at ${base} (${e?.name === 'AbortError' ? 'timed out after 120s' : String(e?.message || e)}). ` +
        'Start the backend with: .\\run_backend.ps1 or npm run dev:backend',
      );
    }
    say('Backend is scoring pixels…');
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 503 || data?.status === 'model-missing') {
        throw new Error('Backend model weights are initializing. Please re-run analysis in a few moments.');
      }
      throw new Error(data?.detail || `Backend error (HTTP ${res.status}).`);
    }
    eng.score = typeof data.score === 'number' ? data.score : null;
    eng.status = data.status || 'inconclusive';
    if (data.version) eng.version = String(data.version);
    if (typeof data.runtimeMs === 'number') eng.runtimeMs = data.runtimeMs;
    eng.details = Array.isArray(data.details) && data.details.length
      ? data.details.map(String)
      : ['Backend returned no details.'];
    eng.limitations = Array.isArray(data.limitations) ? data.limitations.map(String) : [];
  } catch (err) {
    eng.status = 'unavailable';
    eng.details = [`Pixel detector unavailable: ${String(err?.message || err).slice(0, 300)}`];
    eng.limitations = ['Provenance engines above still ran. Start the backend and re-run for the pixel score.'];
  } finally {
    clearTimeout(timer);
  }
  if (!eng.runtimeMs) eng.runtimeMs = Math.round(now() - t0);
  return eng;
}

