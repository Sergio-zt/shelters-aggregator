from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class PlaceResponse(BaseModel):
    # Allows Pydantic to read data directly from SQLAlchemy objects
    model_config = ConfigDict(from_attributes=True)

    id: int
    external_id: str | None = None
    district_id: int | None = None

    # Multi-language fields (JSONB in the database)
    name: dict[str, str] | None = None
    address: dict[str, str] | None = None
    type: dict[str, str] | None = None
    capacity_tier: dict[str, str] | None = None
    operating_hours: dict[str, str] | None = None

    comfort_index: int | None = None

    latitude: float
    longitude: float

    reviews_count: int = 0
    # null = no ratings yet (not 0 stars)
    average_rating: float | None = None


class MultiLanguage(BaseModel):
    uk: str
    en: str | None = None


class DistrictResponse(BaseModel):
    id: int
    city_id: int
    name: MultiLanguage

    model_config = ConfigDict(from_attributes=True)


class FacilityResponse(BaseModel):
    id: int
    name: MultiLanguage

    model_config = ConfigDict(from_attributes=True)


class PlaceCatalogResponse(BaseModel):
    id: int
    external_id: str | None = None
    district_id: int | None = None
    address: MultiLanguage | None = None
    type: MultiLanguage | None = None
    capacity_tier: MultiLanguage | None = None
    operating_hours: MultiLanguage | None = None

    comfort_index: int | None = None

    latitude: float
    longitude: float

    reviews_count: int
    average_rating: float | None = None

    facilities: list[FacilityResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class PlaceRetrieveResponse(BaseModel):
    id: int
    external_id: str | None = None
    district: DistrictResponse | None = None
    address: MultiLanguage | None = None
    type: MultiLanguage | None = None
    capacity_tier: MultiLanguage | None = None
    operating_hours: MultiLanguage | None = None

    comfort_index: int | None = None

    latitude: float
    longitude: float

    reviews_count: int
    average_rating: float | None = None

    facilities: list[FacilityResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class SuggestedPlaceCreate(BaseModel):
    address: str = Field(min_length=1, max_length=255)
    type: str | None = None
    facilities: list[str] | None = None
    details: str | None = None

    @field_validator("address")
    @classmethod
    def validate_address(cls, value) -> str:
        if not value.strip():
            raise ValueError("Address cannot be empty.")

        return value.strip()


class SuggestedPlaceResponse(BaseModel):
    id: int
    address: str
    type: str | None = None
    facilities: list[str] | None = None
    details: str | None = None

    status: str

    visitor_id: UUID | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
