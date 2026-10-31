from io import BytesIO

import pytest
from PIL import Image

from app.ml.media import InvalidMediaError, open_validated_image


def test_valid_image_is_loaded_as_rgb(tmp_path):
    path = tmp_path / "image.png"
    Image.new("RGBA", (20, 20), (10, 20, 30, 100)).save(path)
    loaded = open_validated_image(path)
    assert loaded.mode == "RGB"
    assert loaded.size == (20, 20)


def test_invalid_image_is_rejected(tmp_path):
    path = tmp_path / "invalid.png"
    path.write_bytes(b"not an image")
    with pytest.raises(InvalidMediaError):
        open_validated_image(path)
