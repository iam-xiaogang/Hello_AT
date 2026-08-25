from pydantic import BaseModel


class ConvertOptions(BaseModel):
    """Conversion targets supported by the document converter.

    The router accepts the target as a form field; this model documents the
    available values and is reserved for future structured requests.
    """

    target: str
