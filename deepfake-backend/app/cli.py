"""Offline batch scanner: python -m app.cli ./media --recursive --video-frames 12"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from app.ml.pipeline import analyze_image_path, analyze_video_path

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}
VIDEO_EXTS = {".mp4"}


def discover(paths: list[Path], recursive: bool) -> list[Path]:
    found: list[Path] = []
    for path in paths:
        if path.is_file() and path.suffix.lower() in IMAGE_EXTS | VIDEO_EXTS:
            found.append(path)
        elif path.is_dir():
            iterator = path.rglob("*") if recursive else path.iterdir()
            found.extend(item for item in iterator if item.is_file() and item.suffix.lower() in IMAGE_EXTS | VIDEO_EXTS)
    return sorted(set(item.resolve() for item in found))


def main() -> int:
    parser = argparse.ArgumentParser(description="Scan image/video files using the configured pretrained model")
    parser.add_argument("paths", nargs="+", help="Media files or folders")
    parser.add_argument("--recursive", action="store_true", help="Recursively scan folders")
    parser.add_argument("--video-frames", type=int, default=12, help="Number of sampled frames per video")
    parser.add_argument("--output", type=Path, help="Optional JSON output path")
    args = parser.parse_args()

    files = discover([Path(p) for p in args.paths], args.recursive)
    if not files:
        parser.error("No supported .jpg/.jpeg/.png/.webp/.mp4 files were found")

    results = []
    failures = 0
    for path in files:
        try:
            result = analyze_video_path(path, args.video_frames) if path.suffix.lower() in VIDEO_EXTS else analyze_image_path(path)
            results.append({"file": str(path), "status": "completed", **result})
        except Exception as exc:
            failures += 1
            results.append({"file": str(path), "status": "failed", "error": f"{type(exc).__name__}: {exc}"})
            print(f"[failed] {path}: {exc}", file=sys.stderr)

    output = json.dumps({"results": results, "count": len(results), "failures": failures}, indent=2)
    if args.output:
        args.output.write_text(output + "\n", encoding="utf-8")
        print(f"Wrote {args.output}")
    else:
        print(output)
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
