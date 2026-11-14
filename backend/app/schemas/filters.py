from pydantic import BaseModel, ConfigDict


class MultiLanguage(BaseModel):
    uk: str
    en: str | None = None


class DistrictResponse(BaseModel):
    id: int
    name: MultiLanguage

    model_config = ConfigDict(from_attributes=True)


class FacilityResponse(BaseModel):
    id: int
    name: MultiLanguage

    model_config = ConfigDict(from_attributes=True)


class FiltersResponse(BaseModel):
    districts: list[DistrictResponse]
    facilities: list[FacilityResponse]
    place_types: list[MultiLanguage]
