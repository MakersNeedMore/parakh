# Parakh (परख) • Deepfake Face Detection System

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
| **Anurag Verma** | Frontend Developer |
| **Nishu** | Frontend Developer |
| **Shivang Saxena** | Backend & Auth |
| **Tanu** | Backend, Database & Auth |
| **Yash Gupta** | Frontend Developer |

---

## 🛠️ Technology Stack

- **Frontend & Landing**: Next.js 14, React 18, Vanilla CSS Design System
- **Core Modeling & AI Pipeline**: Python, PyTorch, OpenCV, CNN Binary Classification
- **Data Engineering**: FaceForensics++, Pandas, NumPy
- **Backend & Auth Services**: Node.js, Fastify, JWT Authentication, Microservices
- **Deployment & Edge Infrastructure**: Vercel

---

## 💻 Getting Started

### Prerequisites
- Node.js 18.x or later
- npm or yarn

### Installation
```bash
git clone https://github.com/your-org/parakh.git
cd parakh
npm install
```

### Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to inspect the application.

### Building for Production
```bash
npm run build
npm run start
```

---

## 🗺️ Project Roadmap

- [x] Phase 1: High-performance parked preview portal and design system architecture.
- [x] Phase 2: SEO crawler integration, OpenGraph protocols, and structured metadata schemas.
- [ ] Phase 3: Core binary classifier inference pipeline integration.
- [ ] Phase 4: Video frame ingestion, sliding-window temporal aggregation, and attention heatmaps.
- [ ] Phase 5: Production cloud deployment on `parakh.xyz` and `pixpect.xyz`.

---

## 📄 License

Parakh is proprietary software developed by MnM Developers. All rights reserved.
