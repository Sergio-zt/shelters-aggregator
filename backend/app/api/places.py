from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.crud.places import search_places
from backend.app.db.database import get_db
from backend.app.schemas.places import PlaceResponse

router = APIRouter()


@router.get(
    "/places/search",
    response_model=list[PlaceResponse],
    tags=["places"],
    summary="Search places",
    description=(
        "Returns a list of places. "
        "Can be filtered by address text (Ukrainian), city and district. "
        "Supports pagination with skip and limit."
    ),
)
def search_places_endpoint(
    q: str | None = Query(default=None, description="Search by address"),
    city_id: int | None = None,
    district_id: int | None = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return search_places(
        db=db,
        q=q,
        city_id=city_id,
        district_id=district_id,
        skip=skip,
        limit=limit,
    )
