from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session

from backend.app.crud.places import search_places, get_place
from backend.app.db.database import get_db
from backend.app.schemas.places import PlaceResponse, PlaceRetrieveResponse

router = APIRouter()


@router.get(
    "/places/search",
    response_model=list[PlaceResponse],
    tags=["places"],
    summary="Search places",
    description=(
        "Returns a list of places (shelters, metro stations). "
        "Can be filtered by text (address or type in any language), "
        "city and district. "
        "Geo search: pass lat, lng and radius (in meters) together, "
        "then only places inside the radius are returned, the nearest first. "
        "All filters can be combined. "
        "Returns an empty list if nothing is found."
    ),
)
def search_places_endpoint(
    q: str | None = Query(default=None, description="Search by address or type"),
    city_id: int | None = None,
    district_id: int | None = None,
    lat: float | None = Query(default=None, ge=-90, le=90),
    lng: float | None = Query(default=None, ge=-180, le=180),
    radius: int | None = Query(
        default=None, gt=0, le=50000, description="Radius in meters (max 50 km)"
    ),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    # Geo search makes sense only when all three params are passed
    geo_params = [lat, lng, radius]
    if any(p is not None for p in geo_params) and None in geo_params:
        raise HTTPException(
            status_code=422,
            detail="lat, lng and radius must be passed together",
        )

    return search_places(
        db=db,
        q=q,
        city_id=city_id,
        district_id=district_id,
        lat=lat,
        lng=lng,
        radius=radius,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/places/{place_id}",
    response_model=PlaceRetrieveResponse,
    tags=["places"],
    summary="Get place details",
    description=(
        "Retrieves detailed information about a specific shelter or metro station "
        "by its ID. Returns its address, type, district, capacity information, "
        "available facilities, average rating and review count. "
        "Multilingual fields are returned as complete language-keyed objects. "
        "Returns 404 if the place does not exist."
    ),
)
async def retrieve_place(place_id: int, db: AsyncSession = Depends(get_db)):
    place = await get_place(db, place_id)

    if place is None:
        raise HTTPException(
            status_code=404,
            detail="Place not found",
        )

    return place
