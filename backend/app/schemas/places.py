from pydantic import BaseModel, ConfigDict


class PlaceResponse(BaseModel):
    # Allows Pydantic to read data directly from SQLAlchemy objects
    model_config = ConfigDict(from_attributes=True)

    id: int
    external_id: str | None = None
    district_id: int | None = None

    # Multi-language fields (JSONB in the database)
    address: dict[str, str] | None = None
    type: dict[str, str] | None = None

    latitude: float
    longitude: float
    photo_url: str | None = None
