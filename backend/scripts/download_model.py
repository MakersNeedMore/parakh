"""Download the CommunityForensics ONNX weights + configs into backend/models/.

Run once:  python scripts/download_model.py
Total: ~60 MB (q4f16 + int8 weights + config + preprocessor).

Source: onnx-community/CommunityForensics-DeepfakeDet-ViT-ONNX (MIT).
"""
import os
import shutil
from huggingface_hub import hf_hub_download

REPO = "onnx-community/CommunityForensics-DeepfakeDet-ViT-ONNX"
FILES = [
    "onnx/model_q4f16.onnx",   # 21 MB primary (quantized)
    "onnx/model_int8.onnx",    # 37 MB fallback
    "config.json",
    "preprocessor_config.json",
]
DEST = os.path.join(os.path.dirname(__file__), "..", "models")

os.makedirs(DEST, exist_ok=True)
for rel in FILES:
    target = os.path.join(DEST, os.path.basename(rel))
    if os.path.exists(target) and os.path.getsize(target) > 0:
        print(f"skip (exists): {target}")
        continue
    print(f"downloading {rel} ...")
    cached = hf_hub_download(repo_id=REPO, filename=rel)
    shutil.copyfile(cached, target)
    print(f"  -> {target} ({os.path.getsize(target) / 1e6:.1f} MB)")
print("done. Models live in backend/models/ (gitignored, never committed).")

