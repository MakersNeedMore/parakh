<div align="center">

  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/assets/parakh-banner-dark.png">
    <source media="(prefers-color-scheme: light)" srcset="public/assets/parakh-banner-light.png">
    <img alt="Parakh Banner" src="public/assets/parakh-banner-light.png" width="550">
  </picture>

  # Parakh (परख)
  ### Deepfake Face Detection & Synthetic Media Forensic System

  [![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
  [![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
  [![PyTorch](https://img.shields.io/badge/PyTorch-2.0+-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)](https://pytorch.org/)
  [![Python](https://img.shields.io/badge/Python-3.10%20%7C%203.11-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org/)
  [![License](https://img.shields.io/badge/License-Proprietary-blue?style=for-the-badge)](LICENSE)

  <p align="center">
    <strong>Telling real images from fake ones. A production-ready forensic verification engine distinguishing authentic media from AI-manipulated and synthetic deepfakes across still images and video streams.</strong>
  </p>

  <p align="center">
    <a href="#-project-overview">Overview</a> •
    <a href="#-the-problem">The Problem</a> •
    <a href="#-what-we-are-solving">Our Solution</a> •
    <a href="#-how-it-works">How It Works</a> •
    <a href="#-core-features">Features</a> •
    <a href="#-system-architecture">Architecture</a> •
    <a href="#-benchmarks">Benchmarks</a> •
    <a href="#-contributions--team">Team</a>
  </p>

</div>

---

## 📌 Project Overview

Digital media manipulation and modern generative artificial intelligence tools have made creating hyper-realistic synthetic faces accessible to anyone, presenting severe threats to visual authenticity, personal reputation, and digital verification. 

**Parakh (परख)** is an advanced artificial intelligence platform developed under the **Pixpect** brand by **MnM Developers**. Engineered to detect manipulated facial media, forged pictures, and synthetic video streams, Parakh combines cryptographic provenance verification (C2PA Content Credentials) with neural deep learning models trained and benchmarked against standard datasets (including **FaceForensics++**).

### Official Project Domains
- `parakh.xyz`
- `pixpect.xyz`

---

## ⚠️ The Problem

Deepfake technology is accelerating at an unprecedented pace. High-quality autoencoders, diffusion models, and facial reenactment algorithms can generate synthetic faces that are virtually indistinguishable from authentic media to the human eye.

- **Spread of Misinformation**: Manipulated images and synthetic media are used to forge news events, distort political discourse, and undermine public confidence.
- **Identity Theft & Impersonation**: Malicious actors create forged portraits and impersonate individuals for fraud, blackmail, and credential theft.
- **Erosion of Digital Trust**: When visual proof can no longer be trusted intuitively, media organizations, legal institutions, and everyday users need robust, automated computational tools to verify authenticity.

---

## 🛡️ What We Are Solving

**Parakh** provides automated, evidence-grounded neural verification to restore trust in digital media:

- **Automated AI/ML Analysis**: Users can upload any suspicious still image or video clip; the models inspect low-level pixel distributions, blending seams, and facial structure to deliver an instant verdict with an exact confidence score.
- **Multi-Modal Inspection**: Rather than relying on a single heuristic, Parakh checks both cryptographic provenance (whether the asset contains signed C2PA credentials or altered EXIF metadata) and deep learning pixel-level classification.
- **Comprehensive Diagnostic Reports**: The system generates actionable forensic reports detailing real vs. fake probabilities, suspicious temporal segments, and media integrity indicators.

---

## ⚙️ How It Works

Parakh processes visual media through a structured three-step verification pipeline:

```text
 01. Upload Media          02. Forensic Neural Analysis         03. Certified Audit Report
┌─────────────────┐       ┌─────────────────────────────┐      ┌─────────────────────────┐
│ • JPEG, PNG     │ ───►  │ • C2PA Provenance & EXIF    │ ───► │ • Clear Authenticity    │
│ • WebP Images   │       │ • YOLO Face Localization    │      │   Confidence Scores     │
│ • MP4 Streams   │       │ • DeepGuard MS-EffGCViT     │      │ • Temporal Timeline     │
└─────────────────┘       │ • Frame-by-Frame Aggregator │      │ • Downloadable Report   │
                          └─────────────────────────────┘      └─────────────────────────┘
```

1. **Step 1 — Upload Media**: The user drops in a still photo (JPEG, PNG, WebP) or video stream into the forensic workbench.
2. **Step 2 — Dual-Phase Neural Analysis**:
   - *Provenance Engine*: Reads metadata manifests, EXIF tags, and C2PA cryptographic signatures to verify whether the image was captured by genuine hardware or generated/altered by an AI tool.
   - *Deep Learning Classification*: A YOLOv8 detector localizes and crops the facial region, feeding the normalized facial bounding box into the **DeepGuard MS-EffGCViT** neural network to identify GAN artifacts, warping boundaries, and frequency-domain anomalies.
3. **Step 3 — Forensic Scorecard & Audit Report**: Parakh presents an intuitive verdict (`likely_authentic` vs `likely_manipulated`), a percentage-based confidence score, layer analysis details, and exportable documentation.

---

## 🚀 Core Features & Forensic Capabilities

### 1. Still Image Binary Classification
Evaluates individual portraits and facial pictures with high precision. Isolates subtle pixel blending boundaries, unnatural skin smoothing, irregular eye reflections, and digital artifacts that escape human visual inspection.

### 2. Video Temporal Verification
Analyzes MP4 video streams across uniformly sampled frames. By tracking facial features sequentially across time, Parakh detects temporal flicker, inconsistent blinking patterns, and frame-to-frame warping common in video deepfakes.

### 3. Cryptographic Provenance & C2PA Validation
Validates Coalition for Content Provenance and Authenticity (C2PA) signature manifests. Detects whether cryptographic hashes match or if claims indicate AI creation tools (e.g., Midjourney, DALL-E, Stable Diffusion).

### 4. Enterprise Authentication & Analysis History
Features an integrated authentication module powered by Argon2id password hashing and short-lived JWT session tokens, allowing authenticated users to review past forensic scans and manage audit history.

### 5. Multi-Layer Upload Protections
Enforces strict binary magic-byte inspection (`\xFF\xD8\xFF` JPEG, `\x89PNG` PNG, `RIFF...WEBP` WebP, `ftyp`/`moov` MP4) and directory containment sanitization to prevent spoofed payloads and path traversal attempts.

### 6. Robustness Under Degradation
Maintains reliable classification accuracy even when media has undergone lossy JPEG re-compression, social media transcoding, or motion blur.

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

## 🛠️ Technology Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend & UI Layer** | [Next.js 15](https://nextjs.org/) (App Router), [React 19](https://react.dev/), Vanilla CSS Design System, WebGL Canvas |
| **Backend & Services** | [FastAPI](https://fastapi.tiangolo.com/), [Pydantic v2](https://docs.pydantic.dev/), [SQLAlchemy](https://www.sqlalchemy.org/), [Uvicorn](https://www.uvicorn.org/) |
| **AI/ML & Vision Models** | [PyTorch](https://pytorch.org/), [DeepGuard](https://github.com/KoreaPeter) (MS-EffGCViT), [Ultralytics YOLOv8](https://github.com/ultralytics/ultralytics), OpenCV, Albumentations |
| **Authentication & Security** | [Argon2id](https://pypi.org/project/argon2-cffi/), PyJWT, [C2PA Content Credentials](https://c2pa.org/) |
| **Architecture & Storage** | SQLite / PostgreSQL, Docker, RESTful JSON APIs |

---

## 🔬 Benchmark Datasets & Forgery Detection

Parakh is evaluated and benchmarked against the standard **FaceForensics++ (FF++)** dataset across four primary manipulation categories:

| Forgery Technique | Manipulation Mechanism | Forensic Detection Signal |
| :--- | :--- | :--- |
| **Deepfakes** | Autoencoder-based latent facial code swaps | Pixel-level blending seam artifacts and boundary warping |
| **Face2Face** | Real-time facial reenactment and expression transfer | Deformations around the mouth, jawline, and eye regions |
| **FaceSwap** | Classical computer-graphics 3D face replacement | Color distribution mismatches and boundary discontinuities |
| **NeuralTextures** | Neural radiance & texture rendering manipulation | High-frequency GAN anomalies and inter-frame facial flicker |

---

## 📡 API Architecture Overview

The Parakh backend provides a modular RESTful API architecture structured for integration:

- **System Health & Readiness**: `/v1/health` verifies backend availability, database connectivity, and neural model readiness.
- **Authentication Services**: `/auth/register`, `/auth/login`, and `/auth/me` manage secure user onboarding and credential issuance using Argon2id and JWT bearer tokens.
- **Forensic Detection Services**:
  - `/detections/image`: Authenticated image classification with user history logging.
  - `/detections/video`: Asynchronous temporal video processing with progress tracking.
  - `/v1/detect/ai-generated`: Direct inference endpoint for frontend workbench integration.
- **History & Audit Queries**: `/detections` and `/detections/{id}` allow retrieval of inspection logs, frame scores, and timestamps.

---

## 👥 Contributions & Team

### Engineering Contributions

- **Yash Gupta**: Built the landing page, about page and login page, and handled model testing.
- **Shivang Saxena**: Researched open-source models, developed the backend, and integrated AI/ML capabilities.
- **Charvi Goyal**: Working on the data analytics part and handling the database.
- **Aditya Verma**: AI/ML model training.
- **Tanu Thakur**: Testing the project and backend quality assurance.
- **Agrima Tripathi**: Technical writer: documentation and project write-ups.

### MnM Developers

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
Pretrained model architectures and benchmark datasets provided via [DeepGuard](https://github.com/KoreaPeter) and [FaceForensics++](https://github.com/ondyari/FaceForensics).
