# Parakh — Backend, Authentication & Pretrained ML Integration

This package implements the backend scope for Parakh (परख), the Deepfake Face Detection System. It integrates a pretrained DeepGuard model; **it does not train a new model**. The default checkpoint is `KoreaPeter/ms-eff-gcvit-deepfake-b0-ff-plus-plus`, documented by its authors for image and video-frame inference.

- Model repo: <https://github.com/HanMoonSub/DeepGuard>
- Default model card/checkpoint: <https://huggingface.co/KoreaPeter/ms-eff-gcvit-deepfake-b0-ff-plus-plus>
- Model card says the checkpoint takes face-cropped image/video frames and returns a fake probability. It reports strong same-dataset FaceForensics++ results, but materially weaker cross-dataset results. Do not treat its confidence as proof.
- The DeepGuard code repository and the selected Hugging Face model card state MIT licensing. Review the current license and model-card code before deployment; FaceForensics++ dataset access and terms are separate.

## Included

- FastAPI REST API with interactive OpenAPI docs at `/docs`.
- Registration, login, logout and current-user endpoint.
- Password hashing with Argon2id through `argon2-cffi`.
- Short-lived signed access token stored in an HttpOnly cookie; Bearer token verification is also accepted by the auth dependency for clients that manage tokens themselves.
- SQLAlchemy persistence (SQLite by default; PostgreSQL via `DATABASE_URL`).
- Protected image upload and pretrained inference.
- MP4 upload with a background task, sampled frame-level scores, mean aggregation and approximate suspicious time intervals.
- Per-user detection history, detail and delete endpoints.
- Temporary media is removed after analysis; analysis metadata/results remain in the database until deleted.
- Local batch CLI (`app.cli`), held-out manifest evaluation with ROC-AUC/ROC plot, and JPEG/blur sensitivity script.
- Automated tests for auth, ownership-gated endpoints, upload validation and mocked inference integration.

## 1. Install locally (Windows PowerShell)

Python 3.11 is the recommended environment for this setup. Python 3.10 or 3.12 may also work depending on the PyTorch/Transformers wheel versions available for your machine.

```powershell
cd deepfake-backend
.\setup_windows.ps1 -WithML
```

If you want only to test auth/API docs first, omit `-WithML` and install the model runtime later. The helper creates `.venv` and copies `.env.example` to `.env` if it is missing.

Manual setup is also supported:

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
Copy-Item .env.example .env
pip install -r requirements-ml.txt
```

Edit `.env`. Generate a strong secret:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Paste the output as `SECRET_KEY` in `.env`. For local development the default SQLite database is enough.

### Install pretrained ML dependencies

```powershell
pip install -r requirements-ml.txt
```

PyTorch and the checkpoint/custom model code can require a large download. If PyTorch installation differs for your OS/GPU, use the official selector at <https://pytorch.org/get-started/locally/> and then install the remaining packages from `requirements-ml.txt`. The first inference downloads model assets from Hugging Face. Internet access is required on the first run unless the model is cached.

The chosen model's Hugging Face repository uses custom code (`trust_remote_code=True`) so the adapter explicitly enables it for the configured model. Review that model's files before changing `DEEPFAKE_MODEL_ID` to a different checkpoint.

## 2. Start the API

```powershell
.\run_windows.ps1
```

Or start the server manually with `uvicorn app.main:app --reload`.

Open <http://127.0.0.1:8000/docs> and <http://127.0.0.1:8000/health>.

The API can start without the ML dependencies to allow authentication and docs to work, but image/video analysis returns HTTP `503` until `requirements-ml.txt` is installed and the model loads. It never fabricates a model score as a fallback. Check `/health` for `model.loaded` and `model.load_error` (when present).

## 3. Main API endpoints

All application endpoints use prefix `/api/v1`.

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Register; sets session cookie |
| `POST` | `/auth/login` | Public | Login; sets session cookie |
| `POST` | `/auth/logout` | Public | Clear session cookie |
| `GET` | `/auth/me` | Required | Current user |
| `POST` | `/detections/image` | Required | Analyse JPEG/PNG/WebP image |
| `POST` | `/detections/video?num_frames=12` | Required | Queue MP4 frame analysis; returns 202 |
| `GET` | `/detections` | Required | Current user's history (`limit`, `offset`) |
| `GET` | `/detections/{id}` | Required | Get status/results; ownership is enforced |
| `GET` | `/detections/{id}/frames` | Required | Retrieve sampled frame scores |
| `GET` | `/detections/{id}/timeline` | Required | Retrieve suspicious intervals |
| `DELETE` | `/detections/{id}` | Required | Delete a user's analysis record |

Login/register return a short-lived `access_token` and also set an HttpOnly cookie. For the GitHub Pages frontend, prefer `Authorization: Bearer <access_token>` from in-memory application state because the frontend and API are on different sites and browsers may restrict cross-site cookies. Do not put the token in localStorage. `CORS_ORIGINS` must contain the exact frontend origin(s), comma-separated. Use HTTPS and `COOKIE_SECURE=true` in production. If you choose cookie-based authentication across sites, set `COOKIE_SAMESITE=none`, `COOKIE_SECURE=true`, and implement CSRF protection; browsers may still restrict third-party cookies. Do not loosen CORS to `*` when credentials are enabled.

### Example: register and upload (PowerShell)

Cookie handling is easiest in the interactive docs, or via a cookie-aware HTTP client. Using `curl.exe`:

```powershell
curl.exe -i -c cookies.txt -H "Content-Type: application/json" -d '{"email":"student@example.com","password":"VeryStrongPassword123!"}' http://127.0.0.1:8000/api/v1/auth/register
curl.exe -b cookies.txt -F "file=@C:\path\to\face.jpg" http://127.0.0.1:8000/api/v1/detections/image
curl.exe -b cookies.txt http://127.0.0.1:8000/api/v1/detections
```

For the video endpoint, the initial response has `status: queued` and a detection ID. Poll `GET /api/v1/detections/{id}` until `completed` or `failed`.

## 4. Result semantics

- `fake_probability` means the configured model's estimated probability for its `fake` class (0 to 1).
- The verdict is `likely_manipulated` when the score is greater than or equal to `FAKE_THRESHOLD`, otherwise `likely_authentic`.
- For videos, the aggregate is the arithmetic mean of successfully scored sampled frames. It is intentionally explicit, simple and replaceable after evaluation.
- `frame_results` includes frame indices, timestamps, scores and skipped-frame notes.
- `suspicious_segments` merges nearby sampled frames above the threshold. **Timeline boundaries are approximate** because not every video frame is analysed.
- This integration does not yet emit Grad-CAM/attention heatmaps. Add an explainability adapter only after the model version and target layers are fixed; do not display a fake placeholder heatmap.
- Scores are not calibrated probabilities of truth in the legal/evidentiary sense. Real-world generalisation can be significantly worse than same-dataset benchmark metrics.

## 5. Parakh frontend integration

The current GitHub Pages URL (`https://anuragverma0907.github.io/parakh/`) is the informational/coming-soon landing page. The repository also contains a Next.js upload prototype; its current `handleRunAnalysis` function simulates progress and uses hard-coded forensic metrics instead of calling an API. See `FRONTEND_INTEGRATION.md` and the `frontend-integration/parakh-api.ts` helper bundled alongside this README.

The backend returns a model-derived `fake_probability` (0–1), a verdict, model ID and, for videos, sampled frame scores and approximate suspicious intervals. It does not currently infer separate “spectral”, “facial boundary”, “neural synthesis”, or “biometric geometry” scores. Do not display those as actual model results unless separate validated models are later integrated.

Default CORS origins include the GitHub Pages **origin** `https://anuragverma0907.github.io` plus the documented project domains and local Next.js development origins. Origins contain no URL path (so do not add `/parakh`). When deploying, set `CORS_ORIGINS` to only the exact origins that will call the API. Use the returned short-lived access token as an `Authorization: Bearer ...` header; do not put it in `localStorage`. The included client helper keeps it in memory for the current page session.

For a deployed frontend, set `NEXT_PUBLIC_PARAKH_API_URL` to the backend base URL including `/api/v1`, for example `https://YOUR-API-HOST/api/v1`. The API must be deployed separately with HTTPS before the static website can call it.

## 6. Configuration

Copy `.env.example` to `.env`. Common settings:

- `DATABASE_URL`: e.g. `sqlite:///./deepfake.db` or a PostgreSQL SQLAlchemy URL.
- `DEEPFAKE_MODEL_ID`: defaults to the FaceForensics++ DeepGuard checkpoint above.
- `MODEL_DEVICE`: `auto`, `cpu`, `-1`, or a numeric CUDA device index.
- `MAX_IMAGE_MB`, `MAX_VIDEO_MB`, `MAX_VIDEO_SECONDS`: upload/processing limits.
- `DEFAULT_VIDEO_SAMPLES`, `MAX_VIDEO_SAMPLES`: sampled frames per video.
- `FAKE_THRESHOLD`: verdict threshold from 0 to 1.
- `CORS_ORIGINS`: exact comma-separated web client origins.

## 7. Batch CLI

This is a local command-line tool; it does not use web authentication.

```powershell
python -m app.cli .\samples --recursive --video-frames 12 --output .\batch-results.json
```

Supported extensions: `.jpg`, `.jpeg`, `.png`, `.webp`, `.mp4`.

## 8. Model evaluation and robustness

Install evaluation dependencies:

```powershell
pip install -r requirements-eval.txt
```

Prepare a **held-out** image manifest CSV with columns `path,label` and optional `method`. Labels must be `real`/`fake` or `0`/`1` (`1=fake`). Relative paths resolve against the CSV folder. Use face images/frames consistent with the model's input requirements.

```powershell
python scripts/evaluate_manifest.py .\evaluation\test_manifest.csv --output-dir .\evaluation-output
```

Creates `metrics.json` and (when both classes are present) `roc_curve.png`, including accuracy, precision, recall, F1, ROC-AUC and confusion matrix. If `method` exists, metrics are grouped by method. The script does not create a train/test split; use a properly held-out test set, split at original-video/source identity level to avoid leakage.

A simple JPEG/blur sensitivity probe for one image:

```powershell
python scripts/robustness_eval.py .\samples\face.jpg --output .\robustness.csv
```

This is only a per-image sensitivity check. Report dataset-level robustness by applying the same perturbations to many held-out examples and measuring performance metrics.

## 9. Tests

```powershell
pip install pytest
pytest -q
```

The inference endpoint test mocks the model adapter output so tests do not require downloading the large model checkpoint. It verifies backend wiring, not model accuracy.

## 10. Docker

After creating `.env` and changing `SECRET_KEY`:

```powershell
docker compose up --build
```

The container image installs the model runtime and may be large. It uses one Uvicorn worker because each worker would load its own copy of the model into memory. The Docker Compose file persists the Hugging Face model cache and the local SQLite DB for development.

## 11. Known MVP limitations / before production

1. The video processor uses FastAPI in-process `BackgroundTasks`; jobs can be lost if the process restarts and are not intended for multi-replica production. Replace with a durable worker queue (Celery/RQ + Redis) for production.
2. Configure HTTPS, `COOKIE_SECURE=true`, strong secret, exact CORS, CSRF protection for cookie-authenticated unsafe methods, request rate limits, monitoring and account lifecycle controls before public deployment.
3. Add email verification/password reset and refresh-session revocation before production; the current access token expires after 30 minutes by default.
4. Verify current model/checkpoint and dataset licenses for your intended use. The FaceForensics++ dataset is separately controlled.
5. Add method-specific evaluation, compression/blur robustness, calibration and cross-dataset tests before reporting accuracy publicly.
6. Attention maps are not implemented in this MVP; model confidence and heatmaps should not be represented as definitive explanations.
