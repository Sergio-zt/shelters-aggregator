import uuid
from fastapi import APIRouter, Cookie, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.rate_limiter import check_rate_limit
from backend.app.crud.places import (
    search_places,
    get_place,
    get_places,
    add_place_view,
    add_suggested_place,
)
from backend.app.db.database import get_db
from backend.app.schemas.places import (
    PlaceResponse,
    PlaceRetrieveResponse,
    PlaceCatalogResponse,
    SuggestedPlaceCreate,
    SuggestedPlaceResponse,
)

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
async def search_places_endpoint(
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
    db: AsyncSession = Depends(get_db),
):
    # Geo search makes sense only when all three params are passed
    geo_params = [lat, lng, radius]
    if any(p is not None for p in geo_params) and None in geo_params:
        raise HTTPException(
            status_code=422,
            detail="lat, lng and radius must be passed together",
        )

    return await search_places(
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
    "/places",
    response_model=list[PlaceCatalogResponse],
    tags=["places"],
    summary="Get places catalog",
    description=(
        "Retrieves a list of all available places, including shelters "
        "and metro stations. "
        "Each place contains its identifier, geographic coordinates, "
        "address, type, capacity information, rating, review count "
        "and available facilities. "
        "Multilingual fields are returned as language-keyed objects."
    ),
)
async def places_catalog(db: AsyncSession = Depends(get_db)):
    return await get_places(db)


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


@router.post(
    "/places/{place_id}/views",
    status_code=201,
    tags=["places"],
    summary="Save place view",
    description=(
        "Saves one view of the place details page (for analytics). "
        "The frontend calls it every time the details page is opened. "
        "The visitor is taken from the visitor_id cookie, if it exists. "
        "Returns 404 if the place does not exist."
    ),
)
async def save_place_view(
    place_id: int,
    visitor_id: str | None = Cookie(default=None),
    db: AsyncSession = Depends(get_db),
):
    place = await get_place(db, place_id)

    if place is None:
        raise HTTPException(
            status_code=404,
            detail="Place not found",
        )

    await add_place_view(db, place.id, visitor_id)

    return {"detail": "View saved"}


@router.post(
    "/suggestion",
    response_model=SuggestedPlaceResponse,
    status_code=201,
    tags=["suggestions"],
    summary="Suggest a new place",
    description=(
        "Submit a suggestion for a new shelter location. "
        "The suggestion is saved with a pending status and a unique ID is returned."
    ),
)
async def create_suggestion(
    data: SuggestedPlaceCreate,
    db: AsyncSession = Depends(get_db),
    visitor_id: str | None = Cookie(default=None),
):
    if visitor_id is None:
        raise HTTPException(
            status_code=400,
            detail="Visitor id not provided",
        )

    try:
        visitor_id = uuid.UUID(visitor_id)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid visitor id",
        )

    check_rate_limit(str(visitor_id))

    return await add_suggested_place(db, data, visitor_id)
