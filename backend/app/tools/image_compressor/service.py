from io import BytesIO

from fastapi import HTTPException, UploadFile, status
from PIL import Image, UnidentifiedImageError

MAX_UPLOAD_BYTES = 12 * 1024 * 1024
SUPPORTED_TYPES = {"image/jpeg": "JPEG", "image/png": "PNG", "image/webp": "WEBP"}


async def compress_image(file: UploadFile, quality: int) -> tuple[bytes, str, str]:
    """Validate, recompress and return (content, mime_type, suggested_name)."""
    if file.content_type not in SUPPORTED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="仅支持 JPEG、PNG 或 WebP 图片。",
        )

    raw = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(raw) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="文件不能超过 12 MB。")
    if not raw:
        raise HTTPException(status_code=400, detail="上传的文件为空。")

    try:
        with Image.open(BytesIO(raw)) as source:
            source.load()
            image = source.copy()
    except (UnidentifiedImageError, OSError) as exc:
        raise HTTPException(status_code=400, detail="无法读取该图片文件。") from exc

    output_format = SUPPORTED_TYPES[file.content_type]
    if output_format == "JPEG" and image.mode in {"RGBA", "LA", "P"}:
        background = Image.new("RGB", image.size, "white")
        if image.mode == "P":
            image = image.convert("RGBA")
        background.paste(image, mask=image.getchannel("A"))
        image = background

    result = BytesIO()
    save_options: dict[str, object] = {"format": output_format, "optimize": True}
    if output_format in {"JPEG", "WEBP"}:
        save_options["quality"] = quality
    image.save(result, **save_options)

    stem = (file.filename or "image").rsplit(".", 1)[0]
    extension = {"JPEG": "jpg", "PNG": "png", "WEBP": "webp"}[output_format]
    return result.getvalue(), file.content_type, f"{stem}-compressed.{extension}"
