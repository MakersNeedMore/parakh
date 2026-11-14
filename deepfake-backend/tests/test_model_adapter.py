import pytest
from PIL import Image

from app.ml.model_service import ModelUnavailableError, NoFacePredictionError, classifier


def test_model_adapter_parses_real_fake_scores(monkeypatch):
    monkeypatch.setattr(classifier, "_pipeline", lambda image, **kwargs: [
        {"label": "fake", "score": 0.82},
        {"label": "real", "score": 0.18},
    ])
    image = Image.new("RGB", (32, 32), (120, 120, 120))
    result = classifier.predict_image(image)
    assert abs(result.fake_probability - 0.82) < 1e-6
    assert abs(result.real_probability - 0.18) < 1e-6
    assert result.model_id


def test_model_adapter_handles_no_face_detected(monkeypatch):
    monkeypatch.setattr(classifier, "_pipeline", lambda image, **kwargs: [
        {"label": "no_face_detected", "score": -1.0}
    ])
    image = Image.new("RGB", (32, 32), (120, 120, 120))
    with pytest.raises(NoFacePredictionError, match="No face detected"):
        classifier.predict_image(image)


def test_model_adapter_handles_binary_label_pair(monkeypatch):
    monkeypatch.setattr(classifier, "_pipeline", lambda image, **kwargs: [
        {"label": "label_1", "score": 0.75},
        {"label": "label_0", "score": 0.25},
    ])
    image = Image.new("RGB", (32, 32), (120, 120, 120))
    result = classifier.predict_image(image)
    assert abs(result.fake_probability - 0.75) < 1e-6
    assert abs(result.real_probability - 0.25) < 1e-6


def test_model_adapter_rejects_unknown_labels(monkeypatch):
    monkeypatch.setattr(classifier, "_pipeline", lambda image, **kwargs: [
        {"label": "cat", "score": 0.9},
        {"label": "dog", "score": 0.1},
    ])
    image = Image.new("RGB", (32, 32), (120, 120, 120))
    with pytest.raises(ModelUnavailableError, match="Unexpected model labels"):
        classifier.predict_image(image)


def test_model_adapter_multi_face_takes_maximum_fake_score(monkeypatch):
    # Pipeline returns two faces: first face is fake (0.85), second face is authentic (0.04)
    # The aggregated image score must reflect the manipulated face (0.85), not be overwritten.
    monkeypatch.setattr(classifier, "_pipeline", lambda image, **kwargs: [
        {"label": "fake", "score": 0.85},
        {"label": "real", "score": 0.15},
        {"label": "fake", "score": 0.04},
        {"label": "real", "score": 0.96},
    ])
    image = Image.new("RGB", (32, 32), (120, 120, 120))
    result = classifier.predict_image(image)
    assert abs(result.fake_probability - 0.85) < 1e-6
    assert result.verdict == "likely_manipulated"
