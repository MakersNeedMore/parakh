# Parakh Frontend ↔ Backend Integration Guide

This guide describes how to connect the Parakh frontend repository ([anuragverma0907/parakh](https://github.com/anuragverma0907/parakh)) and live GitHub Pages demo to the FastAPI + AI/ML backend.

---

## 1. Frontend Repository Findings

The team's frontend project currently exists in two forms:

1. **Next.js 14 Application (`app/page.jsx`, `components/Navbar.jsx`)**:
   - The repository's `main` branch contains a modern Next.js 14 upload dashboard with real-time UI state.
   - The analysis handler (`handleRunAnalysis`) previously simulated progress via `setInterval` and used static mock metrics.
   - Designed to run with `npm run dev` or be deployed to Vercel.

2. **Standalone Web SPA (`index.html`, `script.js` / `app.js`, `style.css`)**:
   - Deployed on GitHub Pages at `https://anuragverma0907.github.io/parakh/`.
   - Contains a client-side prototype that runs simulated inference using seeded pseudo-random math.
   - Has sections for Image Detection, Video Detection, Batch Processing, Reports, and Settings.

The backend service is built with **FastAPI + PyTorch + DeepGuard (MS-EffGCViT on FaceForensics++)**, exposing high-performance REST endpoints with JWT/Argon2id authentication and SQLite/PostgreSQL persistence.

---

## 2. Integration Files Provided

- `parakh-api.ts` — TypeScript API client for the Next.js app (place in `lib/parakh-api.ts`).
- `parakh-api.js` — Vanilla JavaScript ES module API client for the GitHub Pages static site (place alongside `app.js` or `script.js`).

---

## 3. Connecting the Next.js Application (`app/page.jsx`)

1. Copy `frontend-integration/parakh-api.ts` to `lib/parakh-api.ts` in the frontend repo.
2. In `.env.local`:
   ```env
   NEXT_PUBLIC_PARAKH_API_URL=http://127.0.0.1:8000/api/v1
   ```
   *(For production deployment, replace with the public HTTPS URL of the backend).*
3. In `app/page.jsx`, replace the mock timer with `analyzeImage`:
   ```jsx
   import { analyzeImage, ParakhApiError } from "@/lib/parakh-api";

   const [analysisResult, setAnalysisResult] = useState(null);
   const [analysisError, setAnalysisError] = useState("");

   const handleRunAnalysis = async () => {
     if (!(selectedFile instanceof File)) {
       setAnalysisError("Please select an image or video file before starting analysis.");
       return;
     }

     setIsAnalyzing(true);
     setProgress(15);
     setShowScorecard(false);
     setAnalysisError("");

     try {
       setProgress(50);
       const result = await analyzeImage(selectedFile);
       setAnalysisResult(result);
       setProgress(100);
       setShowScorecard(true);
     } catch (err) {
       setAnalysisError(err instanceof Error ? err.message : "Analysis failed");
     } finally {
       setIsAnalyzing(false);
     }
   };
   ```
4. Render the real scores returned by the model:
   - `Math.round((analysisResult.fake_probability ?? 0) * 100)` — Fake Probability (%)
   - `analysisResult.verdict` — Classification verdict (`likely_manipulated` or `likely_authentic`)
   - `analysisResult.model_id` — Model architecture checkpoint identifier

---

## 4. Connecting the GitHub Pages App (`app.js` / `script.js`)

In `app.js`, replace the client-side pseudo-random generator with calls to the backend:

```javascript
import { analyzeImage as apiAnalyzeImage, analyzeVideo as apiAnalyzeVideo, waitForDetection } from "./parakh-api.js";

async function analyzeImage(file, onStage = () => {}) {
  onStage(0, imageStages); // Reading image
  const media = await imageData(file);
  
  onStage(1, imageStages); // Detecting face
  onStage(2, imageStages); // Extracting features
  
  const apiResult = await apiAnalyzeImage(file);
  onStage(3, imageStages); // Scoring
  
  const fakeProb = apiResult.fake_probability ?? 0;
  const risk = Math.round(fakeProb * 100);
  
  onStage(4, imageStages); // Done
  return {
    id: apiResult.id,
    type: "image",
    fileName: file.name,
    size: file.size,
    width: media.width,
    height: media.height,
    createdAt: apiResult.created_at,
    preview: media.preview,
    risk: risk,
    authenticity: 100 - risk,
    confidence: Math.round(Math.abs(risk - 50) * 2),
    technique: risk >= 50 ? "FaceForensics++ Detected" : null,
    regions: {},
    demo: false,
  };
}
```

---

## 5. API Response Schema Reference

### `POST /api/v1/detections/image`
Uploads a single image for immediate inference.

```json
{
  "id": "c8f2a174-8b9e-4b4e-9d22-1d54b4ef6101",
  "media_type": "image",
  "original_filename": "sample_face.jpg",
  "status": "completed",
  "verdict": "likely_manipulated",
  "fake_probability": 0.984851,
  "model_id": "KoreaPeter/ms-eff-gcvit-deepfake-b0-ff-plus-plus",
  "total_frames": 1,
  "scored_frames": 1,
  "duration_seconds": null,
  "frame_results": [
    {
      "frame_index": 0,
      "timestamp_seconds": 0.0,
      "fake_probability": 0.984851,
      "verdict": "likely_manipulated",
      "note": null
    }
  ],
  "suspicious_segments": [],
  "error_message": null,
  "created_at": "2026-10-29T11:00:00Z",
  "completed_at": "2026-10-29T11:00:02Z"
}
```

### `POST /api/v1/detections/video?num_frames=12`
Uploads a video and queues a background frame-sampling worker. Returns HTTP 202 Accepted. Use `GET /api/v1/detections/{id}` to poll until `status: "completed"`.

---

## 6. CORS Configuration
The backend is already configured to accept requests from:
- `http://localhost:3000` (Next.js default)
- `http://localhost:5173` (Vite default)
- `https://anuragverma0907.github.io` (GitHub Pages)
- `https://parakh.xyz`
- `https://pixpect.xyz`

Configure extra origins in `.env` via `CORS_ORIGINS`.
