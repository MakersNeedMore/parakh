# Deploying the Parakh backend (free / low-cost)

The Next.js frontend runs on Vercel, but Vercel cannot host this PyTorch backend
(image is ~2 GB, inference needs ~1.5–2.5 GB RAM). Host `deepfake-backend/` on a
container platform and point the frontend at its public HTTPS URL.

| Host | Cost | RAM | Verdict |
|---|---|---|---|
| **Hugging Face Spaces (Docker, CPU basic)** | Free | 16 GB, 2 vCPU | **Recommended free option.** Sleeps after ~48 h without traffic. |
| Render (Docker web service) | Free plan: 512 MB | Too small for PyTorch — expect OOM. Use `standard` (2 GB, paid) for real use. | 1-click via `render.yaml` |
| Railway | Trial credit, then paid | Configurable | Works with the same Dockerfile. |

All of them use the same `deepfake-backend/Dockerfile`, which:

- installs CPU-only PyTorch (much smaller image),
- bakes the pinned DeepGuard model snapshot into the image (faster cold start),
- listens on `$PORT` (default `8000`),
- keeps every writable path (`/service/uploads`, `/service/data`, `/service/.cache`) writable for non-root users (needed on HF Spaces).

> Storage note: the default database is SQLite at `/service/data/deepfake.db`. On free
> Render and free HF Spaces the disk is **ephemeral** — registered users are wiped on every
> restart/redeploy. The public `/v1/detect/ai-generated` scanner does not need the database.
> For persistent accounts, use a hosted Postgres via `DATABASE_URL` (add a Postgres driver such
> as `psycopg[binary]` to `requirements.txt`).

## Production environment variables

| Variable | Value |
|---|---|
| `ENVIRONMENT` | `production` |
| `SECRET_KEY` | Random string, 32+ chars: `python -c "import secrets; print(secrets.token_urlsafe(48))"` |
| `COOKIE_SECURE` | `true` (required when `ENVIRONMENT=production`) |
| `COOKIE_SAMESITE` | `none` (frontend and backend are on different sites) |
| `CORS_ORIGINS` | `https://parakh.xyz,https://www.parakh.xyz` (+ any other frontend origins) |
| `CORS_ORIGIN_REGEX` | Optional. Default allows `https://parakh.xyz`, `https://www.parakh.xyz` and other `*.parakh.xyz` / `*.pixpect.xyz` subdomains. Set it empty to disable. The app refuses to start in production with a regex that matches arbitrary origins. |
| `MODEL_DEVICE` | `cpu` |
| `HF_TOKEN` | Optional; only if the model repo is gated. |

## Option A — Hugging Face Spaces (free, recommended)

1. Create a Space at <https://huggingface.co/new-space>: name e.g. `parakh-backend`,
   **SDK: Docker → Blank**, hardware **CPU basic (free)**, visibility Public
   (a private Space needs an HF token on every request, which the browser cannot send).
2. Clone it and copy the backend into it:

   ```bash
   git clone https://huggingface.co/spaces/<hf-username>/parakh-backend
   cp -r deepfake-backend/app deepfake-backend/scripts deepfake-backend/Dockerfile deepfake-backend/.dockerignore deepfake-backend/requirements.txt deepfake-backend/requirements-ml.txt parakh-backend/
   ```

3. Replace the Space's `README.md` with this front matter (it tells HF which port the app uses):

   ```markdown
   ---
   title: Parakh Backend
   emoji: 🛡️
   colorFrom: gray
   colorTo: green
   sdk: docker
   app_port: 8000
   pinned: false
   ---
   Parakh DeepGuard inference API.
   ```

4. In the Space → **Settings → Variables and secrets**, add the production variables from the
   table above (`SECRET_KEY` as a *secret*, the rest as variables).
5. Push:

   ```bash
   cd parakh-backend && git add . && git commit -m "Deploy Parakh backend" && git push
   ```

6. Wait for the build (first one takes ~10–15 min), then open
   `https://<hf-username>-parakh-backend.hf.space/v1/health` — it should return `{"ok": true, ...}`.
   Your backend URL is `https://<hf-username>-parakh-backend.hf.space`.

## Option B — Render (1-click Blueprint)

1. Push this repo to GitHub (the `render.yaml` at the repo root is the Blueprint).
2. Render Dashboard → **New → Blueprint** → select the repo → **Apply**.
   `SECRET_KEY` is generated automatically; `HF_TOKEN` is optional.
3. Change `plan:` in `render.yaml` (or in the dashboard) to `standard` if the free 512 MB
   instance crashes with out-of-memory during the first scan.
4. Health check: `https://parakh-backend.onrender.com/v1/health` (your service name may differ).
   Free instances sleep after 15 min idle; the first request after that takes ~1 min.

## Point the Vercel frontend at the backend

In Vercel → Project → **Settings → Environment Variables** (Production, and Preview if wanted):

| Name | Value |
|---|---|
| `NEXT_PUBLIC_PARAKH_BACKEND` | `https://<your-backend-host>` — no trailing slash, no `/api/v1` |
| `NEXT_PUBLIC_PARAKH_API_URL` | `https://<your-backend-host>/api/v1` (optional; derived from the above if unset) |

`NEXT_PUBLIC_*` values are baked into the JavaScript at **build time**, so trigger a
**Redeploy** after setting them. To confirm, the `/analyze` page JS bundle should contain your
backend host instead of `http://127.0.0.1:8000`.

If you use Vercel preview URLs (`*.vercel.app`) against the production backend, add each
preview origin to `CORS_ORIGINS`, or a regex scoped to your own project such as
`^https://parakh-[a-z0-9]+-<your-vercel-team>\.vercel\.app$`. Do not use a broad
`.*\.vercel\.app` regex — anyone can create a Vercel project with a matching name.

## Smoke test

```bash
curl -s https://<your-backend-host>/v1/health
curl -s -X POST -F "image=@face.jpg" https://<your-backend-host>/v1/detect/ai-generated
curl -s -i -X OPTIONS -H "Origin: https://www.parakh.xyz" -H "Access-Control-Request-Method: POST" https://<your-backend-host>/v1/detect/ai-generated | grep -i access-control-allow-origin
```

An image without a face returns `"status": "no_face_detected"` with `"score": null`, which the
frontend shows as **N/A · No Face Found** (never as 0% / Authentic).
