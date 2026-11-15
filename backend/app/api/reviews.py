import uuid
from fastapi import APIRouter, HTTPException
from fastapi.params import Depends, Cookie
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.crud.reviews import add_review
from backend.app.db.database import get_db
from backend.app.schemas.reviews import ReviewResponse, ReviewCreate

router = APIRouter()


@router.post(
    "/reviews",
    tags=["reviews"],
    status_code=201,
    response_model=ReviewResponse,
    summary="Add a website review",
    description="Create a review about the website. Requires a valid visitor ID cookie.",
)
async def create_website_review(
    data: ReviewCreate,
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

    try:
        return await add_review(db, data, visitor_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post(
    "/places/{place_id}/reviews",
    tags=["reviews"],
    status_code=201,
    response_model=ReviewResponse,
    summary="Add a place review",
    description="Create a review for a specific place. Requires a valid place ID and visitor ID cookie.",
)
async def create_place_review(
    place_id: int,
    data: ReviewCreate,
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

    try:
        return await add_review(db, data, visitor_id, place_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
