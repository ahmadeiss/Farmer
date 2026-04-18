"""
Catalog Celery tasks.
Audio transcription is scaffolded for future Whisper integration.
"""
import logging
from celery import shared_task
from django.conf import settings

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, queue="transcription")
def process_audio_transcription(self, product_id: int):
    """
    Process audio file transcription for a product listing.

    Current implementation: STUB
    - In production: integrate OpenAI Whisper API or local Whisper model
    - The service abstraction is in apps/catalog/services/transcription.py

    TODO v2: Replace stub with actual Whisper integration.
    """
    from apps.catalog.models import Product

    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        logger.error(f"Product {product_id} not found for transcription")
        return

    if not product.audio_file:
        return

    # Set status to processing
    product.transcription_status = Product.TranscriptionStatus.PROCESSING
    product.save(update_fields=["transcription_status"])

    try:
        transcription_service = settings.TRANSCRIPTION_SERVICE

        if transcription_service == "stub":
            # Stub: simulate processing
            text = f"[وصف صوتي - في انتظار تفعيل خدمة Whisper] الملف: {product.audio_file.name}"
            product.transcription_text = text
            product.transcription_status = Product.TranscriptionStatus.DONE
            product.save(update_fields=["transcription_text", "transcription_status"])
            logger.info(f"[STUB] Transcription complete for product {product_id}")

        elif transcription_service == "whisper_local":
            # TODO: Implement local Whisper integration
            # import whisper
            # model = whisper.load_model(settings.WHISPER_MODEL_SIZE)
            # result = model.transcribe(product.audio_file.path)
            # product.transcription_text = result["text"]
            raise NotImplementedError("Whisper local integration not yet activated")

        elif transcription_service == "whisper_api":
            # TODO: Implement OpenAI Whisper API integration
            raise NotImplementedError("OpenAI Whisper API integration not yet activated")

    except Exception as exc:
        product.transcription_status = Product.TranscriptionStatus.FAILED
        product.save(update_fields=["transcription_status"])
        logger.exception(f"Transcription failed for product {product_id}: {exc}")
        raise self.retry(exc=exc, countdown=60)
