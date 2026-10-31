import logging
from datetime import datetime, timezone
from pathlib import Path

from app.config import settings
from app.database import SessionLocal
from app.ml.model_service import ModelUnavailableError, NoFacePredictionError
from app.ml.pipeline import analyze_video_path
from app.models import Detection

logger = logging.getLogger(__name__)


def process_video_job(detection_id: str, file_path: str, requested_samples: int) -> None:
    """MVP in-process background worker. Use Celery/RQ for durable multi-instance jobs."""
    path = Path(file_path)
    db = SessionLocal()
    try:
        detection = db.get(Detection, detection_id)
        if detection is None:
            return
        detection.status = "processing"
        db.commit()

        result = analyze_video_path(path, requested_samples=requested_samples)
        detection.status = "completed"
        detection.verdict = result["verdict"]
        detection.fake_probability = result["fake_probability"]
        detection.model_id = result["model_id"]
        detection.total_frames = result["total_frames"]
        detection.scored_frames = result["scored_frames"]
        detection.duration_seconds = result["duration_seconds"]
        detection.frame_results = result["frame_results"]
        detection.suspicious_segments = result["suspicious_segments"]
        detection.error_message = None
        detection.completed_at = datetime.now(timezone.utc)
        db.commit()
    except ModelUnavailableError:
        logger.exception("Model unavailable for video detection %s", detection_id)
        detection = db.get(Detection, detection_id)
        if detection:
            detection.status = "failed"
            detection.error_message = "Inference model unavailable. Check ML dependencies, model access, and server logs."
            detection.completed_at = datetime.now(timezone.utc)
            db.commit()
    except NoFacePredictionError as exc:
        detection = db.get(Detection, detection_id)
        if detection:
            detection.status = "failed"
            detection.error_message = str(exc)
            detection.completed_at = datetime.now(timezone.utc)
            db.commit()
    except Exception:
        logger.exception("Video analysis failed for detection %s", detection_id)
        detection = db.get(Detection, detection_id)
        if detection:
            detection.status = "failed"
            detection.error_message = "Video processing failed. Verify that the media is decodable and check server logs."
            detection.completed_at = datetime.now(timezone.utc)
            db.commit()
    finally:
        db.close()
        try:
            path.unlink(missing_ok=True)
        except OSError:
            logger.warning("Could not delete temporary upload %s", path)
