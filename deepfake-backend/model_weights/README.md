---
license: mit
datasets:
- ILSVRC/imagenet-1k
metrics:
- accuracy
- roc_auc
base_model:
- timm/tf_efficientnet_b0.ns_jft_in1k
pipeline_tag: video-classification
library_name: transformers
tags:
- PyTorch
- vision
- DeepFake-Detection
- DeepGuard
- tf-efficientnet
- global-context-vision-transformer
---

# 🚀 Multi Scale Efficient Global Context Vision Transformer

![Task](https://img.shields.io/badge/Task-Deepfake_Detection-FF1744?style=flat-square)
![Image Classification](https://img.shields.io/badge/Task-Image_Classification-7C4DFF?style=flat-square)
![Video Classification](https://img.shields.io/badge/Task-Video_Classification-00B8D4?style=flat-square)

![FaceForensics++](https://img.shields.io/badge/Dataset-FaceForensics%2B%2B-2962FF?style=flat-square)
![Celeb-DF(v2)](https://img.shields.io/badge/Dataset-Celeb--DF(v2)-00C853?style=flat-square)
![KODF](https://img.shields.io/badge/Dataset-KODF-FF6D00?style=flat-square)


<img src="./ms_eff_gcvit.JPG" width="900">

> 🔗 **GitHub Repository:** [HanMoonSub/DeepGuard](https://github.com/HanMoonSub/DeepGuard)
 
> 🤗 **Live demo:** [DeepFake Video Detection](https://huggingface.co/spaces/KoreaPeter/DeepFake-Vidoe-Detection)

> 🤗 **Live demo:** [DeepFake Image Detection](https://huggingface.co/spaces/KoreaPeter/DeepFake-Image-Detection)

> 🤗 **Live demo:** [DeepFake Detection XAI](https://huggingface.co/spaces/KoreaPeter/DeepFake-Detection-XAI)

Multi-Scale Efficient Global Context Vision Transformer (MS-EffGCViT) is a hybrid CNN-ViT
architecture for **deepfake detection**. It fuses CNN-driven spatial inductive bias with
hierarchical global-context attention to catch both *local* artifacts (textures, blending seams)
and *global* artifacts (lighting, structural inconsistency).
 
A single architecture ships in two sizes and three domain-tuned checkpoints, working on both
**static images** and **video** at the **frame level**.
 
## ✨ Core Features

- **🎞️ Frame-level** — one model handles both **images and videos** (frame-level inference + aggregation).
- **🌍 Cross-domain** — robust on both **East-Asian** (KoDF) and **Western** (Celeb-DF-v2, FaceForensics++) faces.
- **⚡🔥 Two variants** — **Fast (b0)** for real-time/edge, **Pro (b5)** for enterprise accuracy.
- **🧩 timm-compatible** — load via the `timm` interface or the `deepguard` package.


## ⚙️ Model Specifications
 
| Spec | Detail |
|---|---|
| **Task** | Binary deepfake detection (real / fake) |
| **Domain** | Frame-level, spatial-domain |
| **Input** | Image or video (face-cropped) |
| **Output** | Sigmoid probability in `[0, 1]` — higher = more likely fake |
| **Backbone** | EfficientNet (ImageNet-1K pretrained) |
| **Framework** | PyTorch / timm |


## 🧬 Model Zoo

⚡ **ms_eff_gcvit_b0** is Optimized for real-time inference and mobile deployment.

🔥 **ms_eff_gcvit_b5** is Engineered for high-fidelity analysis and enterprise-grade accuracy.

| Config | ⚡ Fast (b0) | 🔥 Pro (b5) |
|---|---|---|
| **Model name** | `ms_eff_gcvit_b0` | `ms_eff_gcvit_b5` |
| **Backbone** | `tf_efficientnet_b0.ns_jft_in1k` | `tf_efficientnet_b5.ns_jft_in1k` |
| **Resolution** | 224×224 | 384×384 |
| **Params (M)** | 8.7 | 50.3 |
| **FLOPs (G)** | 0.87 | 13.64 |


## 📚 Dataset: FaceForensics++

Learning to detect manipulated facial images [[Paper]](https://arxiv.org/abs/1901.08971) [[Download]](https://github.com/ondyari/FaceForensics),
featuring **1,000 original YouTube videos** manipulated by 5 face forgery methods.

- [x] **Source**: 1,000 original videos (from 977 YouTube videos)
- [x] **Manipulation Methods**: 5 types (Deepfakes, Face2Face, FaceSwap, FaceShifter, NeuralTextures)
- [x] **Faces**: Trackable, mostly frontal, no occlusion

| Source | Real/Fake | Videos | Description |
| ------ | --------- | ------ | ----------- |
| `Deepfakes` | ![Fake](https://img.shields.io/badge/Fake-red?style=flat-square) | 1,000 | Autoencoder-based face replacement |
| `Face2Face` | ![Fake](https://img.shields.io/badge/Fake-red?style=flat-square) | 1,000 | Expression transfer (reenactment) |
| `FaceSwap` | ![Fake](https://img.shields.io/badge/Fake-red?style=flat-square) | 1,000 | Graphics-based face replacement |
| `FaceShifter` | ![Fake](https://img.shields.io/badge/Fake-red?style=flat-square) | 1,000 | High-fidelity swap with occlusion handling |
| `NeuralTextures` | ![Fake](https://img.shields.io/badge/Fake-red?style=flat-square) | 1,000 | Neural-texture-based reenactment |
| `Original` | ![Real](https://img.shields.io/badge/Real-blue?style=flat-square) | 1,000 | Unaltered authentic YouTube videos |

> 📎 Available at [GitHub](https://github.com/ondyari/FaceForensics) or [Kaggle](https://www.kaggle.com/datasets/xdxd003/ff-c23)

## 📈 Test Evaluation

Trained and tested on the same dataset.

| Dataset | Variant | Accuracy | AUC | Log Loss |
|---|---|---|---|---|
| **FaceForensics++** | ⚡ Fast | 0.9808 | 0.9969 | 0.0637 |
| **FaceForensics++** | 🔥 Pro | **0.9850** | **0.9974** | **0.0492** |


## 📈 Cross-Dataset Evaluation (Trained on FaceForensics++)

Generalization to unseen domains — trained on FaceForensics++

| Tested on | Variant | Accuracy | AUC | Log Loss |
|---|---|---|---|---|
| Celeb-DF-v2 | ⚡ Fast | 0.7259 | 0.6999 | 0.6794 |
| Celeb-DF-v2 | 🔥 Pro | **0.7722** | **0.7309** | **0.6657** |
| KoDF | ⚡ Fast | 0.7544 | 0.8620 | 0.8829 |
| KoDF | 🔥 Pro | **0.7695** | **0.8821** | **0.7635** |

 
 
## 🚀 Model Usage

```python
pip install deepguard
from transformers import pipeline
```

### 🖼️ Image Classification

```python
clf = pipeline(
    "image-classification",
    model="KoreaPeter/ms-eff-gcvit-deepfake-b0-ff-plus-plus", 
    trust_remote_code=True,
)

# ── Basic Inference ───────────────────────────────────────────────
result = clf("face.jpg")
# [{'label': 'fake', 'score': 0.9712}, {'label': 'real', 'score': 0.0288}]

# ── Custom Parameters ─────────────────────────────────────────────
result = clf(
    "face.jpg",
    margin_ratio=0.2,      # Margin ratio around the detected face bbox (default: 0.2)
    conf_thres=0.5,        # Confidence threshold for YOLO face detection (default: 0.5)
    min_face_ratio=0.01,   # Minimum face-to-frame area ratio to process (default: 0.01)
    tta_hflip=0.0,         # Probability of horizontal flip for TTA (default: 0.0)
    top_k=1,               # Number of top labels to return (default: all)
)
# [{'label': 'fake', 'score': 0.9712}]
```
### 🎬 Video Classification

```python
clf = pipeline(
    "video-classification",
    model="KoreaPeter/ms-eff-gcvit-deepfake-b0-ff-plus-plus", 
    trust_remote_code=True,
)

# ── Basic Inference ───────────────────────────────────────────────
result = clf("video.mp4")
# [{'label': 'fake', 'score': 0.9634}, {'label': 'real', 'score': 0.0366}]

# ── Custom Parameters ─────────────────────────────────────────────
result = clf(
    "video.mp4",
    num_frames=20,              # Number of frames to sample (default: 20)
    margin_ratio=0.2,           # Margin ratio around the detected face bbox (default: 0.2)
    conf_thres=0.5,             # Confidence threshold for YOLO face detection (default: 0.5)
    min_face_ratio=0.01,        # Minimum face-to-frame area ratio to process (default: 0.01)
    tta_hflip=0.0,              # Probability of horizontal flip for TTA (default: 0.0)
    agg_mode="conf",            # Aggregation mode: 'conf' | 'mean' | 'vote' (default: 'conf')
    return_frame_scores=True,   # Return per-frame scores (default: False)
)
# [{'label': 'fake', 'score': 0.9634},
#  {'label': 'real', 'score': 0.0366},
#  {'frame_scores': [0.97, 0.95, 0.98, ...], 'agg_mode': 'conf'}]
```
  
## Deep Dive into Model
 
### Part 1: CNN-based Patch Embedding for Spatial Inductive Bias

While traditional Vision Transformers (ViTs) utilize a Linear Projection for patch embedding, our proposed model adopts a CNN-based Patch Embedding module incorporating MBConvBlocks.

- **Injecting Inductive Bias** : Standard ViTs often suffer from a lack of inherent spatial inductive bias, typically necessitating massive datasets to learn fundamental visual structures from scratch. In contrast, our CNN-based module leverages overlapping receptive fields to facilitate information sharing between neighboring patches. By explicitly injecting this spatial bias into the architecture, the model achieves more stable and accelerated convergence during the training process.


### Part 2: Long-Short Range Spatial Interaction

We utilizes two distinct types of self-attention to capture both long-range and short-range information across feature maps.

<img src="./window_attention.JPG" width="900">

- **Local Window Attention**: this model efficiently captures local textures and precise spatial details while maintaining linear computational complexity relative to the image size.

- **Global Window Attention**: Unlike Swin Transformer, this module utilizes global-queries that interact with local window keys and values. This allows each local region to incorporate global context, effectively capturing long-range dependencies and providing a comprehensive understanding of the entire spatial structure

### Part 3: Computational Efficiency

- **Efficient Backbone**
While both **Xception** and **EfficientNet** show great results on DeepFake benchmarks, **EfficientNet** is chosen for its superior computational efficiency. By utilizing **MBconv (Inverted Residual Blocks)** and depthwise convolutions, it achieves significantly lower FLOPS compared to Xception.

- **Window-based Attention**: Instead of applying self-attention on raw images, this model operates on feature maps extracted from backbone blocks. By partitioning these maps into windows, the $O(N^2)$ complexity is restricted to the window size, siginificantly lowering the computational footprint.


### Part 4: Multi-Scale Feature Map Fusion

<img src="./dual_branch.gif" width="900">  

Modern DeepFakes can leave very localized forgery region. To Capture this, we adopts a **multi-scale strategy** by extracting features from different levels of the backbone.

- **![](https://img.shields.io/badge/Low_level_Branch-blue?style=flat-square) (_Subtle Artifacts_)**: High-Resolution feature maps are extracted from early backbone blocks(`l_block_idx`) to capture like skin texture or boundary artifacts

- **![](https://img.shields.io/badge/High_level_Branch-red?style=flat-square) (_Global Features_)**: Low-Resolution feature maps are extracted from deeper blocks(`h_block_idx`) to analyze overall lighting, shadows, and structural consistency.

- **Feature Fusion**: The Outputs from both branches (`L-GCViT and H-GCViT`) are fused to make a comprehensive decision based on both local and global context.


  
## 🤝 Citation
 
```bibtex
@misc{deepguard2026,
  title  = {DeepGuard: Multi-Scale Efficient Global Context Vision Transformer for Deepfake Detection},
  author = {seoyunje},
  year   = {2026},
  url    = {https://github.com/HanMoonSub/DeepGuard}
}
```