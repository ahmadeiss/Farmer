"""
Custom exception handler for standardized API error responses.
All errors follow: {"error": str, "detail": any, "code": str}
"""
import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """Wrap DRF exceptions in a consistent envelope."""
    response = exception_handler(exc, context)

    if response is None:
        # Unhandled exception - log and return 500
        logger.exception("Unhandled exception in API view", exc_info=exc)
        return Response(
            {"error": "حدث خطأ داخلي في الخادم", "detail": str(exc), "code": "server_error"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # Restructure DRF's default error response
    data = response.data
    if isinstance(data, dict) and "detail" in data:
        error_msg = str(data["detail"])
        code = getattr(data["detail"], "code", "error")
    elif isinstance(data, list):
        error_msg = str(data[0]) if data else "حدث خطأ"
        code = "validation_error"
    else:
        error_msg = str(data)
        code = "error"

    response.data = {
        "error": error_msg,
        "detail": data,
        "code": code,
    }
    return response


class BusinessLogicError(Exception):
    """Raised when a business rule is violated (e.g. insufficient stock)."""

    def __init__(self, message: str, code: str = "business_error"):
        self.message = message
        self.code = code
        super().__init__(message)
