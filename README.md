<div align="center">

  <img src="public/assets/long%20logo%20dark.png" alt="Parakh Banner" width="600"/>

  # Parakh (परख)
  ### Deepfake Face Detection & Synthetic Media Forensic System

  [![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
  [![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
  [![PyTorch](https://img.shields.io/badge/PyTorch-2.0+-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)](https://pytorch.org/)
  [![Python](https://img.shields.io/badge/Python-3.10%20%7C%203.11-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org/)
  [![License](https://img.shields.io/badge/License-Proprietary-blue?style=for-the-badge)](LICENSE)

  <p align="center">
    <strong>A production-ready forensic verification engine distinguishing authentic media from AI-manipulated and synthetic deepfakes across still images and video streams.</strong>
  </p>

  <p align="center">
    <a href="#-project-overview">Overview</a> •
    <a href="#-core-features">Features</a> •
    <a href="#-system-architecture">Architecture</a> •
    <a href="#-tech-stack">Tech Stack</a> •
    <a href="#-getting-started">Getting Started</a> •
    <a href="#-api-documentation">API Docs</a> •
    <a href="#-benchmarks">Benchmarks</a> •
    <a href="#-engineering-team">Team</a>
  </p>

</div>

---

## 📌 Project Overview

Digital media manipulation and modern generative models have made high-fidelity facial forgery trivial to produce, posing severe threats to digital trust, information integrity, and identity security.

**Parakh (परख)** is a specialized, multi-stage digital forensics platform engineered to detect manipulated facial media with high confidence. Operating under the **Pixpect** brand by **MnM Developers**, Parakh combines cryptographic provenance verification (C2PA Content Credentials) with neural deepfake classifiers benchmarked against standard datasets (including **FaceForensics++**).

### Official Domains
- `parakh.xyz`
- `pixpect.xyz`

---

## 🚀 Core Features

- **Multi-Stage Forensic Pipeline**:
  - **Step 1 — Cryptographic Provenance**: Verifies C2PA signature manifests, digital watermarks, and EXIF camera metadata to trace the origin of the asset.
  - **Step 2 — Neural Deepfake Classification**: Employs deep convolutional and vision transformer models (DeepGuard MS-EffGCViT) to detect blending seams, pixel warping, and facial boundary artifacts.
- **Still Image Forensic Analysis**:
  - High-precision probability scoring with instant verdict (`likely_authentic` vs `likely_manipulated`).
  - Spatial localization ensuring detection focuses on cropped facial bounding boxes.
- **Temporal Video Stream Analysis**:
  - Sequential frame extraction and temporal verification.
  - Frame-by-frame confidence timelines flagging suspicious segments and blinking/inter-frame warping anomalies.
- **Enterprise Authentication & Session Management**:
  - User registration, login, and profile tracking.
  - Hardened Argon2id password hashing and short-lived JWT access tokens.
- **Hardened Upload Security**:
  - Binary magic byte validation (`\xFF\xD8\xFF` JPEG, `\x89PNG` PNG, `RIFF...WEBP` WebP, `ftyp`/`moov` MP4).
  - Directory containment checks preventing path traversal exploits.
- **Robustness Against Real-World Degradations**:
  - Resilient against lossy JPEG re-compression, motion blur, and video downsampling.

---

## 🏗️ System Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                      Next.js 15 Frontend                        │
│          (Interactive UI, Responsive Design, WebGL)             │
└────────────────┬───────────────────────────────┬────────────────┘
                 │                               │
                 │ Direct In-Browser (Step 1)    │ REST / JSON (Step 2)
                 ▼                               ▼
┌────────────────────────────────┐ ┌──────────────────────────────┐
│  Provenance & Metadata Engine  │ │     FastAPI Backend Core     │
│  - C2PA Content Credentials    │ │  - Argon2id Auth & JWT       │
│  - EXIF / Metadata Parser      │ │  - Upload Security & Storage │
│  - Generative Watermarks       │ │  - SQLite / PostgreSQL DB    │
└────────────────────────────────┘ └──────────────┬───────────────┘
                                                  │
                                                  ▼
                                   ┌──────────────────────────────┐
                                   │    PyTorch AI/ML Pipeline    │
                                   │  - YOLOv8 Face Detection     │
                                   │  - DeepGuard MS-EffGCViT     │
                                   │  - Temporal Video Aggregator │
                                   └──────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | [Next.js 15](https://nextjs.org/) (App Router), [React 19](https://react.dev/), Vanilla CSS Design System, WebGL Canvas |
| **Backend & APIs** | [FastAPI](https://fastapi.tiangolo.com/), [Pydantic v2](https://docs.pydantic.dev/), [SQLAlchemy](https://www.sqlalchemy.org/), [Uvicorn](https://www.uvicorn.org/) |
| **AI/ML & Inference** | [PyTorch](https://pytorch.org/), [DeepGuard](https://github.com/KoreaPeter) (MS-EffGCViT), [Ultralytics YOLOv8](https://github.com/ultralytics/ultralytics), OpenCV, Albumentations |
| **Auth & Cryptography** | [Argon2id](https://pypi.org/project/argon2-cffi/), PyJWT, [C2PA Content Credentials](https://c2pa.org/) |
| **Testing & Tooling** | `pytest`, `pytest-asyncio`, ESLint, Docker |

---

## 📂 Repository Structure

```text
Parakh-Backend-AI-Auth/
├── app/                        # Next.js 15 App Router pages & layouts
│   ├── about/                  # Project mission & MnM Developers team
│   ├── analyze/                # Interactive forensic analysis workbench
│   ├── login/                  # Authentication & registration interface
│   ├── layout.jsx              # Global metadata, SEO & navigation shell
│   └── page.jsx                # Landing page & feature showcase
├── deepfake-backend/           # FastAPI backend & DeepGuard AI/ML pipeline
│   ├── app/
│   │   ├── auth/               # Argon2id hashing, JWT tokens, user handlers
│   │   ├── db/                 # SQLAlchemy models & database session
│   │   ├── ml/                 # DeepGuard classifier, YOLO face detector, pipeline
│   │   ├── config.py           # Pydantic v2 application settings
│   │   └── main.py             # FastAPI entry point, routes & CORS policy
│   ├── tests/                  # Automated pytest suite (auth, media, models)
│   ├── requirements.txt        # Backend dependencies
│   ├── requirements-ml.txt     # DeepGuard and PyTorch ML dependencies
│   └── run_windows.ps1         # Windows backend launch script
├── lib/                        # Shared frontend utilities & forensic engines
│   ├── forensics/              # C2PA, EXIF, AI-generation client engines
│   ├── auth.js                 # Frontend session and token manager
│   └── parakh-api.js           # API client for backend communication
├── public/                     # Static assets, branding, and icons
├── run_backend.ps1             # Root one-click backend launcher (PowerShell)
├── package.json                # Frontend scripts and dependencies
└── README.md                   # Project documentation
```

---

## 💻 Getting Started

### Prerequisites
- **Node.js**: v18.17+ or v20+
- **Python**: 3.10 or 3.11 (with `pip` and `virtualenv`)
- **Git**

---

### Step-by-Step Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/MakersNeedMore/parakh.git
cd parakh
```

#### 2. Setup the Frontend
```bash
npm install
```

#### 3. Setup the AI/ML Backend

**On Windows (PowerShell):**
```powershell
# Run setup script (creates virtual environment and installs dependencies)
.\deepfake-backend\setup_windows.ps1

# Start the FastAPI server
.\run_backend.ps1
# Or: npm run dev:backend
```

**On Linux / macOS:**
```bash
cd deepfake-backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt -r requirements-ml.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- **Interactive Swagger Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc Documentation**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- **Health Check**: [http://127.0.0.1:8000/v1/health](http://127.0.0.1:8000/v1/health)

#### 4. Start the Frontend Development Server
In a new terminal window:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🧪 Testing & Verification

### Running Backend Tests
Execute the automated test suite covering authentication, CORS, media upload validation, video chunking, and ML adapter pipelines:
```bash
npm run test:backend
# Or:
cd deepfake-backend && python -m pytest -v
```

### Building Frontend Production Bundle
```bash
npm run build
```

---

## 📡 Key API Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/v1/health` | Health status and ML model readiness | No |
| `POST` | `/auth/register` | Register new user account with Argon2id hash | No |
| `POST` | `/auth/login` | Authenticate user and receive JWT access token | No |
| `GET` | `/auth/me` | Fetch currently authenticated user profile | **Yes (Bearer)** |
| `POST` | `/detections/image` | Upload image for binary deepfake classification | **Yes (Bearer)** |
| `POST` | `/detections/video` | Upload video for sampled temporal analysis | **Yes (Bearer)** |
| `POST` | `/v1/detect/ai-generated` | Forensic analysis endpoint for Next.js workbench | No |
| `GET` | `/detections` | Retrieve history of user detections | **Yes (Bearer)** |

---

## 🔬 Benchmark Datasets & Forgery Detection

Parakh is benchmarked against the **FaceForensics++ (FF++)** benchmark across four manipulation protocols:

| Forgery Technique | Mechanism & Characteristics | Detection Signal |
| :--- | :--- | :--- |
| **Deepfakes** | Autoencoder-based latent facial code swaps | Pixel-level blending seam artifacts |
| **Face2Face** | Real-time source-to-target facial expression transfer | Warping deformations around mouth/eyes |
| **FaceSwap** | 3D graphics model-based facial replacement | Color mismatches and boundary discontinuities |
| **NeuralTextures** | Neural radiance & texture rendering manipulation | High-frequency GAN anomalies and flicker |

---

## 👥 Contributors & Engineering Team

Parakh is built and maintained by the **MnM Developers** group:

| Contributor | Role & Domain |
| :--- | :--- |
| **Aditya Verma** | AI/ML & Backend |
| **Charvi Goyal** | Data Science & Database |
| **Agrima Tripathi** | Technical Writer |
| **Shivang Saxena** | AI/ML, Backend & Auth |
| **Tanu Thakur** | Backend, Database & Auth |
| **Yash Gupta** | Frontend Developer |

---

## 📄 License & Attribution

Parakh is proprietary software developed by **MnM Developers**. All rights reserved.  
Pretrained model weights provided via [DeepGuard](https://github.com/KoreaPeter) and [FaceForensics++](https://github.com/ondyari/FaceForensics).
