from pydantic import BaseModel, ConfigDict, Field


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
    photo_url: str | None = None

    reviews_count: int = 0
    # null = no ratings yet (not 0 stars)
    average_rating: float | None = None


class MultiLanguage(BaseModel):
    uk: str
    en: str


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

    latitude: float
    longitude: float

    reviews_count: int
    average_rating: float | None = None

    facilities: list[FacilityResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
