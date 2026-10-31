"""Evaluate an existing pretrained detector on a held-out CSV manifest.

CSV columns: path,label ; optional method column for FaceSwap/Face2Face/etc.
Labels may be 'real'/'fake' or 0/1, where 1=fake. No training is performed.
"""
from __future__ import annotations

import argparse
import csv
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from sklearn.metrics import (
    accuracy_score, confusion_matrix, f1_score, precision_score, recall_score,
    roc_auc_score, roc_curve,
)

from app.ml.media import open_validated_image
from app.ml.model_service import classifier


def label_to_int(value: str) -> int:
    normalized = value.strip().lower()
    if normalized in {"fake", "manipulated", "1", "true"}:
        return 1
    if normalized in {"real", "authentic", "0", "false"}:
        return 0
    raise ValueError(f"Unknown label {value!r}; use real/fake or 0/1 (1=fake)")


def metrics(y_true: list[int], probabilities: list[float], threshold: float) -> dict:
    predictions = [int(score >= threshold) for score in probabilities]
    result = {
        "count": len(y_true),
        "threshold": threshold,
        "accuracy": float(accuracy_score(y_true, predictions)),
        "precision_fake": float(precision_score(y_true, predictions, zero_division=0)),
        "recall_fake": float(recall_score(y_true, predictions, zero_division=0)),
        "f1_fake": float(f1_score(y_true, predictions, zero_division=0)),
        "confusion_matrix_labels_real_fake": confusion_matrix(y_true, predictions, labels=[0, 1]).tolist(),
    }
    result["roc_auc"] = float(roc_auc_score(y_true, probabilities)) if len(set(y_true)) == 2 else None
    return result


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("manifest", type=Path, help="CSV with path,label and optional method")
    parser.add_argument("--threshold", type=float, default=0.5)
    parser.add_argument("--output-dir", type=Path, default=Path("evaluation-output"))
    args = parser.parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)

    y_true: list[int] = []
    scores: list[float] = []
    methods: list[str] = []
    failures: list[dict] = []
    with args.manifest.open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        if not reader.fieldnames or not {"path", "label"}.issubset(reader.fieldnames):
            parser.error("Manifest needs 'path' and 'label' columns")
        for row_num, row in enumerate(reader, start=2):
            source_path = Path(row["path"])
            if not source_path.is_absolute():
                source_path = (args.manifest.parent / source_path).resolve()
            try:
                image = open_validated_image(source_path)
                prediction = classifier.predict_image(image)
                y_true.append(label_to_int(row["label"]))
                scores.append(prediction.fake_probability)
                methods.append((row.get("method") or "unspecified").strip() or "unspecified")
            except Exception as exc:
                failures.append({"row": row_num, "path": str(source_path), "error": f"{type(exc).__name__}: {exc}"})
                print(f"Skipping row {row_num}: {source_path}: {exc}")

    if not y_true:
        raise SystemExit("No manifest rows were evaluated successfully.")

    report = {
        "model_id": classifier.status()["configured_model_id"],
        "overall": metrics(y_true, scores, args.threshold),
        "failures": failures,
        "warning": "Metrics are meaningful only for a held-out, non-leaking evaluation set. Frame samples from the same source video must not cross splits.",
    }
    if "method" in (reader.fieldnames or []):
        by_method = {}
        for method in sorted(set(methods)):
            idx = [i for i, item in enumerate(methods) if item == method]
            by_method[method] = metrics([y_true[i] for i in idx], [scores[i] for i in idx], args.threshold)
        report["by_method"] = by_method

    report_path = args.output_dir / "metrics.json"
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    if len(set(y_true)) == 2:
        fpr, tpr, _ = roc_curve(y_true, scores)
        fig, ax = plt.subplots(figsize=(6, 5))
        ax.plot(fpr, tpr, label=f"AUC = {report['overall']['roc_auc']:.4f}")
        ax.plot([0, 1], [0, 1], linestyle="--", label="Chance")
        ax.set(xlabel="False Positive Rate", ylabel="True Positive Rate", title="Deepfake detector ROC curve")
        ax.legend(loc="lower right")
        fig.tight_layout()
        fig.savefig(args.output_dir / "roc_curve.png", dpi=160)
        plt.close(fig)
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
