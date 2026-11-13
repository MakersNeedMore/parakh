# Parakh (परख) • Deepfake Face Detection System

## 🖥️ Running locally (frontend + inference backend)

The pixel detector (Step-2) lives in `backend/` (FastAPI + self-hosted ONNX,
~40 MB one-time download — never committed). The Next.js frontend just POSTs
the image to it, so analysis can never get "stuck" loading weights in the browser.

```powershell
# Terminal 1 — backend:
npm run dev:backend
# Or: .\run_backend.ps1
# Check health: http://127.0.0.1:8000/v1/health  -> {"ok": true, ...}

# Terminal 2 — frontend:
npm install
npm run dev   # http://localhost:3000
```

Point the frontend at a deployed backend with `NEXT_PUBLIC_PARAKH_BACKEND`
(see `.env.example`). Free options: HuggingFace Spaces (Docker) or Render free tier.

![Parakh Banner](public/assets/long%20logo%20dark.png)

A high-performance deepfake face detection and synthetic media verification system engineered to distinguish between authentic and manipulated visual media across single images and video streams. Developed under the **Pixpect** brand by **MnM Developers**.

---

## 📌 Project Overview

Digital media manipulation and generative artificial intelligence tools have made creating hyper-realistic synthetic faces accessible, presenting critical threats to media authenticity, identity protection, and digital verification. 

**Parakh** is built as a specialized deep learning platform that detects manipulated visual media with high reliability. The platform utilizes a binary classification engine trained and benchmarked against standard datasets (including **FaceForensics++**) to isolate forged faces, examine temporal frame continuity, generate spatial attention heatmaps, and highlight suspicious segments.

### Official Project Domains
- `parakh.xyz`
- `pixpect.xyz`

---

## 🚀 Core Features

### 1. Image Detection
Allows users to upload still imagery and receive a prediction with an associated confidence score indicating whether the facial area is authentic or manipulated.

### 2. Video Analysis
Processes uploaded video streams frame by frame, runs aggregate scoring across sampled intervals, and flags temporal segments with high probabilities of manipulation.

### 3. Spatial Attention Heatmaps
Provides visual interpretability by highlighting regions within facial boundaries (such as blending seams, unnatural eye reflections, or mouth distortions) that heavily influenced the model's classification output.

### 4. Robustness & Resilience
Maintains high classification fidelity across real-world degradations, including lossy JPEG compression, motion blur, and video re-encoding.

---

## 🔬 Benchmark Datasets & Forgery Techniques

Parakh is benchmarked against the **FaceForensics++** benchmark across four manipulation methods:

| Manipulation Method | Description |
| :--- | :--- |
| **Deepfakes** | Autoencoder-based facial replacement neural pipelines. |
| **Face2Face** | Real-time facial expression transfer and reenactment. |
| **FaceSwap** | Classical computer-graphics based 3D face warping and boundary blending. |
| **NeuralTextures** | Neural texture rendering altering facial expressions and mouth movements. |

---

## 👥 Contributors & Engineering Team

Parakh is developed and maintained by the **MnM Developers** group:

| Contributor | Role & Domain |
| :--- | :--- |
| **Aditya Verma** | AI/ML & Backend |
| **Charvi Goyal** | Data Science & Database |
| **Agrima Tripathi** | Technical Writer |
| **Shivang Saxena** | AI/ML, Backend & Auth |
| **Tanu Thakur** | Backend, Database & Auth |
| **Yash Gupta** | Frontend Developer |

---

## 🛠️ Technology Stack

- **Frontend & UI Layer**: Next.js (App Router), React, Vanilla CSS Design System, WebGL
- **Core Modeling & AI Pipeline**: Python, PyTorch, DeepGuard (MS-EffGCViT), YOLOv8 (`ultralytics`), OpenCV
- **Authentication & Backend Services**: FastAPI, Argon2id (`argon2-cffi`), PyJWT, SQLAlchemy (SQLite/PostgreSQL)
- **Forensic Verification**: C2PA Content Credentials SDK, Exif/Metadata Parser, JPEG/Blur Robustness Evaluator
- **Deployment & Containers**: Docker, Docker Compose, Vercel

---

## 💻 Getting Started

### Prerequisites
- Node.js 18.x or later
- Python 3.10+ (Python 3.11 recommended)

### Quick Start (Fullstack)

1. **Clone and install frontend dependencies**:
   ```bash
   git clone https://github.com/MakersNeedMore/parakh.git
   cd parakh
   npm install
   ```

2. **Start the FastAPI Backend & AI/ML Service**:
   ```powershell
   # Windows PowerShell
   .\run_backend.ps1

   # Or using npm
   npm run dev:backend
   ```
   - Interactive Swagger API Documentation: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
   - Health Endpoint: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

3. **Start the Next.js Frontend**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Running Backend Tests**:
   ```bash
   npm run test:backend
   ```

---

## 🗺️ Project Roadmap

- [x] Phase 1: High-performance preview portal and design system architecture.
- [x] Phase 2: SEO crawler integration, OpenGraph protocols, and structured metadata schemas.
- [x] Phase 3: Core binary classifier inference pipeline integration (DeepGuard MS-EffGCViT + FaceForensics++).
- [x] Phase 4: Video frame ingestion, temporal aggregation, and cryptographic C2PA signature validation.
- [ ] Phase 5: Production cloud deployment on `parakh.xyz` and `pixpect.xyz`.

---

## 📄 License

Parakh is proprietary software developed by MnM Developers. All rights reserved.
