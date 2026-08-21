from fastapi import APIRouter, File, Form, UploadFile
from fastapi.responses import Response
from urllib.parse import quote

from .service import compress_image

# Every back-end tool owns its router. The central registry discovers this
# module automatically, so adding a tool does not require changing main.py.
router = APIRouter(prefix="/tools/image-compressor", tags=["image-compressor"])


def content_disposition(filename: str) -> str:
    """Create a header-safe download filename, including Chinese characters.

    Response headers must be Latin-1, so a raw Unicode filename cannot be put
    in ``filename=``. RFC 5987's ``filename*`` stores the UTF-8 percent-encoded
    version while the ASCII name remains a fallback for older clients.
    """
    extension = filename.rsplit(".", 1)[-1] if "." in filename else "bin"
    encoded_filename = quote(filename, safe="")
    return f"attachment; filename=compressed-image.{extension}; filename*=UTF-8''{encoded_filename}"


@router.post("/compress")
async def compress(file: UploadFile = File(...), quality: int = Form(80, ge=1, le=95)) -> Response:
    content, media_type, filename = await compress_image(file, quality)
    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": content_disposition(filename)},
    )
