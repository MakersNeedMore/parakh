/**
 * Minimal browser client for the Parakh FastAPI backend.
 * Copy into the frontend app (for example, `lib/parakh-api.ts`).
 * The access token is held in module memory only; a page reload requires sign-in again.
 */

const API_BASE = (process.env.NEXT_PUBLIC_PARAKH_API_URL || "http://127.0.0.1:8000/api/v1").replace(/\/$/, "");
let accessToken: string | null = null;

export type ParakhUser = {
  id: string;
  email: string;
  is_active: boolean;
  created_at: string;
};

export type AuthResponse = {
  user: ParakhUser;
  message: string;
  access_token: string | null;
};

export type FrameResult = {
  frame_index: number;
  timestamp_seconds: number;
  fake_probability: number | null;
  verdict: "likely_manipulated" | "likely_authentic" | "not_scored";
  note: string | null;
};

export type SuspiciousSegment = {
  start_seconds: number;
  end_seconds: number;
  peak_fake_probability: number;
  sampled_frames: number;
};

export type ParakhDetection = {
  id: string;
  media_type: "image" | "video";
  original_filename: string;
  status: "queued" | "processing" | "completed" | "failed";
  verdict: "likely_manipulated" | "likely_authentic" | string | null;
  fake_probability: number | null; // 0..1, not a guarantee of authenticity
  model_id: string;
  total_frames: number;
  scored_frames: number;
  duration_seconds: number | null;
  frame_results: FrameResult[] | null;
  suspicious_segments: SuspiciousSegment[] | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
};

export type DetectionFramesResponse = {
  detection_id: string;
  status: string;
  frames: FrameResult[];
};

export type DetectionTimelineResponse = {
  detection_id: string;
  status: string;
  duration_seconds: number | null;
  aggregation_method: string;
  suspicious_segments: SuspiciousSegment[];
  note: string;
};

export class ParakhApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ParakhApiError";
    this.status = status;
    this.body = body;
  }
}

export function setParakhAccessToken(token: string | null): void {
  accessToken = token;
}

export function getParakhAccessToken(): string | null {
  return accessToken;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  // Do not set Content-Type for FormData: the browser must add its multipart boundary.
  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;
  if (init.body && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    // Bearer auth is the intended cross-site path for GitHub Pages.
    credentials: "omit",
  });

  if (response.status === 204) return undefined as T;
  const contentType = response.headers.get("content-type") || "";
  const body: unknown = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text().catch(() => "");

  if (!response.ok) {
    let message = `Parakh API request failed (${response.status})`;
    if (body && typeof body === "object" && "detail" in body) {
      const detail = (body as { detail?: unknown }).detail;
      message = typeof detail === "string" ? detail : JSON.stringify(detail);
    } else if (typeof body === "string" && body) {
      message = body;
    }
    throw new ParakhApiError(message, response.status, body);
  }
  return body as T;
}

export async function register(email: string, password: string): Promise<AuthResponse> {
  const result = await request<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setParakhAccessToken(result.access_token);
  return result;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const result = await request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setParakhAccessToken(result.access_token);
  return result;
}

export async function logout(): Promise<void> {
  try {
    await request<void>("/auth/logout", { method: "POST" });
  } finally {
    setParakhAccessToken(null);
  }
}

export function getCurrentUser(): Promise<ParakhUser> {
  return request<ParakhUser>("/auth/me");
}

export function analyzeImage(file: File): Promise<ParakhDetection> {
  const form = new FormData();
  form.append("file", file);
  return request<ParakhDetection>("/detections/image", { method: "POST", body: form });
}

export function analyzeVideo(file: File, numFrames = 12): Promise<ParakhDetection> {
  const form = new FormData();
  form.append("file", file);
  const n = Math.max(1, Math.min(24, Math.floor(numFrames)));
  return request<ParakhDetection>(`/detections/video?num_frames=${n}`, { method: "POST", body: form });
}

export function getDetection(id: string): Promise<ParakhDetection> {
  return request<ParakhDetection>(`/detections/${encodeURIComponent(id)}`);
}

export function listDetections(limit = 20, offset = 0): Promise<ParakhDetection[]> {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  return request<ParakhDetection[]>(`/detections?${params.toString()}`);
}

export function getDetectionFrames(id: string): Promise<DetectionFramesResponse> {
  return request<DetectionFramesResponse>(`/detections/${encodeURIComponent(id)}/frames`);
}

export function getDetectionTimeline(id: string): Promise<DetectionTimelineResponse> {
  return request<DetectionTimelineResponse>(`/detections/${encodeURIComponent(id)}/timeline`);
}

export function deleteDetection(id: string): Promise<void> {
  return request<void>(`/detections/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/** Poll video jobs until completed/failed. Use only in a client component. */
export async function waitForDetection(
  id: string,
  options: { intervalMs?: number; timeoutMs?: number; onUpdate?: (value: ParakhDetection) => void } = {},
): Promise<ParakhDetection> {
  const intervalMs = options.intervalMs ?? 1500;
  const timeoutMs = options.timeoutMs ?? 180_000;
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const detection = await getDetection(id);
    options.onUpdate?.(detection);
    if (detection.status === "completed") return detection;
    if (detection.status === "failed") {
      throw new ParakhApiError(detection.error_message || "Video analysis failed", 422, detection);
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new ParakhApiError("Video analysis timed out while waiting for the worker", 408, { id });
}
