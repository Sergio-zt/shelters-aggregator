from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


class ReviewCreate(BaseModel):
    author_name: str = Field(min_length=1, max_length=100)
    rating: int = Field(ge=1, le=5, strict=True)
    text: str = Field(min_length=1, max_length=2000)

    model_config = ConfigDict(str_strip_whitespace=True)


class ReviewResponse(BaseModel):
    id: int

    place_id: int | None
    visitor_id: UUID

    author_name: str
    rating: int
    text: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
