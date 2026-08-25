import asyncio
from urllib.parse import quote

from fastapi import APIRouter, File, Form, UploadFile
from fastapi.responses import Response

from .service import MAX_UPLOAD_BYTES, convert_document

# Every back-end tool owns its router. The central registry discovers this
# module automatically, so adding a tool does not require changing main.py.
router = APIRouter(prefix="/tools/doc-converter", tags=["doc-converter"])


def content_disposition(filename: str) -> str:
    """Create a header-safe download filename, including Chinese characters.

    Response headers must be Latin-1, so a raw Unicode filename cannot be put
    in ``filename=``. RFC 5987's ``filename*`` stores the UTF-8 percent-encoded
    version while the ASCII name remains a fallback for older clients.
    """
    extension = filename.rsplit(".", 1)[-1] if "." in filename else "bin"
    encoded_filename = quote(filename, safe="")
    return f"attachment; filename=converted.{extension}; filename*=UTF-8''{encoded_filename}"


@router.post("/convert")
async def convert(file: UploadFile = File(...), target: str = Form(...)) -> Response:
    raw = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(raw) > MAX_UPLOAD_BYTES:
        from fastapi import HTTPException

        raise HTTPException(status_code=413, detail="文件不能超过 50 MB。")
    # pdf2docx / PyMuPDF work is CPU-bound; keep it off the event loop.
    content, media_type, filename = await asyncio.to_thread(convert_document, raw, file.filename, target)
    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": content_disposition(filename)},
    )
