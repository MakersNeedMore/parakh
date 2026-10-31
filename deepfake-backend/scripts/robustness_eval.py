"""Quick single-image JPEG/blur perturbation probe. Not a substitute for dataset-level evaluation."""
from __future__ import annotations

import argparse
import csv
import sys
from io import BytesIO
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from PIL import Image, ImageFilter

from app.config import settings
from app.ml.media import open_validated_image
from app.ml.model_service import classifier


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("image", type=Path)
    parser.add_argument("--output", type=Path, default=Path("robustness-results.csv"))
    parser.add_argument("--jpeg-qualities", default="95,75,50", help="Comma-separated JPEG quality values")
    parser.add_argument("--blur-radii", default="0.5,1.0,2.0", help="Comma-separated Gaussian blur radii")
    args = parser.parse_args()

    image = open_validated_image(args.image)
    variants: list[tuple[str, str, Image.Image]] = [("original", "none", image)]
    for quality in (int(v.strip()) for v in args.jpeg_qualities.split(",") if v.strip()):
        if not 1 <= quality <= 100:
            parser.error("JPEG qualities must be between 1 and 100")
        buffer = BytesIO()
        image.save(buffer, format="JPEG", quality=quality)
        buffer.seek(0)
        with Image.open(buffer) as compressed:
            variants.append(("jpeg", str(quality), compressed.convert("RGB")))
    for radius in (float(v.strip()) for v in args.blur_radii.split(",") if v.strip()):
        if radius < 0:
            parser.error("Blur radii must be >= 0")
        variants.append(("gaussian_blur", str(radius), image.filter(ImageFilter.GaussianBlur(radius=radius))))

    rows = []
    for transform, parameter, variant in variants:
        prediction = classifier.predict_image(variant)
        rows.append({"transform": transform, "parameter": parameter,
                     "fake_probability": round(prediction.fake_probability, 6),
                     "verdict_at_threshold": "likely_manipulated" if prediction.fake_probability >= settings.fake_threshold else "likely_authentic"})
    with args.output.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=["transform", "parameter", "fake_probability", "verdict_at_threshold"])
        writer.writeheader()
        writer.writerows(rows)
    print(f"Wrote {args.output}; these are sensitivity checks on one image, not accuracy metrics.")
    for row in rows:
        print(row)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
