from fastapi import APIRouter
from fastapi.params import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.crud.filters import get_districts, get_facilities, get_place_types
from backend.app.db.database import get_db
from backend.app.schemas.filters import FiltersResponse

router = APIRouter()


@router.get(
    "/filters",
    response_model=FiltersResponse,
    tags=["Filters"],
    summary="Get available districts and shelter filters",
    description="Returns a list of available districts, facilities,"
    " and shelter types for filtering shelters."
    " Names are provided in Ukrainian and English."
    " The frontend selects the language.",
)
async def get_filters(db: AsyncSession = Depends(get_db)):
    districts = await get_districts(db)
    facilities = await get_facilities(db)
    place_types = await get_place_types(db)

    return FiltersResponse(
        districts=districts, facilities=facilities, place_types=place_types
    )
