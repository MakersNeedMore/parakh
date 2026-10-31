/**
 * Parakh API Client for Browser / Vanilla JS / GitHub Pages SPA
 * Works in modern browsers without a bundler, or can be imported as an ES module.
 */

const DEFAULT_API_BASE = "http://127.0.0.1:8000/api/v1";

let apiBase = (typeof window !== "undefined" && window.PARAKH_API_URL) || DEFAULT_API_BASE;
let accessToken = null;

export function setApiBase(url) {
  apiBase = url.replace(/\/$/, "");
}

export function setAccessToken(token) {
  accessToken = token;
  if (typeof localStorage !== "undefined") {
    if (token) localStorage.setItem("parakh_token", token);
    else localStorage.removeItem("parakh_token");
  }
}

export function getAccessToken() {
  if (!accessToken && typeof localStorage !== "undefined") {
    accessToken = localStorage.getItem("parakh_token");
  }
  return accessToken;
}

export class ParakhApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = "ParakhApiError";
    this.status = status;
    this.body = body;
  }
}

async function request(path, options = {}) {
  const token = getAccessToken();
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  if (options.body && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers,
    credentials: "omit",
  });

  if (response.status === 204) return undefined;

  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text().catch(() => "");

  if (!response.ok) {
    let message = `Parakh API request failed (${response.status})`;
    if (body && typeof body === "object" && "detail" in body) {
      const detail = body.detail;
      message = typeof detail === "string" ? detail : JSON.stringify(detail);
    } else if (typeof body === "string" && body) {
      message = body;
    }
    throw new ParakhApiError(message, response.status, body);
  }
  return body;
}

export async function register(email, password) {
  const result = await request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setAccessToken(result.access_token);
  return result;
}

export async function login(email, password) {
  const result = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setAccessToken(result.access_token);
  return result;
}

export async function logout() {
  try {
    await request("/auth/logout", { method: "POST" });
  } finally {
    setAccessToken(null);
  }
}

export function getCurrentUser() {
  return request("/auth/me");
}

export function analyzeImage(file) {
  const form = new FormData();
  form.append("file", file);
  return request("/detections/image", { method: "POST", body: form });
}

export function analyzeVideo(file, numFrames = 12) {
  const form = new FormData();
  form.append("file", file);
  const n = Math.max(1, Math.min(24, Math.floor(numFrames)));
  return request(`/detections/video?num_frames=${n}`, { method: "POST", body: form });
}

export function getDetection(id) {
  return request(`/detections/${encodeURIComponent(id)}`);
}

export function listDetections(limit = 20, offset = 0) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  return request(`/detections?${params.toString()}`);
}

export function getDetectionFrames(id) {
  return request(`/detections/${encodeURIComponent(id)}/frames`);
}

export function getDetectionTimeline(id) {
  return request(`/detections/${encodeURIComponent(id)}/timeline`);
}

export async function waitForDetection(id, options = {}) {
  const intervalMs = options.intervalMs || 1500;
  const timeoutMs = options.timeoutMs || 180000;
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const detection = await getDetection(id);
    if (options.onUpdate) options.onUpdate(detection);
    if (detection.status === "completed") return detection;
    if (detection.status === "failed") {
      throw new ParakhApiError(detection.error_message || "Video analysis failed", 422, detection);
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new ParakhApiError("Video analysis timed out while waiting for worker", 408, { id });
}
