from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.places import Place
from backend.app.models.reviews import Review
from backend.app.schemas.reviews import ReviewCreate


async def add_review(
    db: AsyncSession,
    data: ReviewCreate,
    visitor_id: UUID,
    place_id: int | None = None,
) -> Review:
    """Create a new review."""

    review = Review(**data.model_dump(), visitor_id=visitor_id, place_id=place_id)
    place = None

    try:
        if review.place_id is not None:
            result = await db.execute(
                select(Place).where(Place.id == review.place_id).with_for_update()
            )

            place = result.scalar_one_or_none()

            if place is None:
                raise ValueError("Place not found")

        db.add(review)
        await db.flush()

        if place is not None:
            result = await db.execute(
                select(func.count(Review.id)).where(Review.place_id == review.place_id)
            )

            review_count = result.scalar_one()

            place.reviews_count = review_count

        await db.commit()
        await db.refresh(review)

        return review

    except Exception:
        await db.rollback()
        raise


async def get_reviews(
    db: AsyncSession,
    place_id: int | None = None,
) -> list[Review]:
    """Get all reviews for a place or website."""

    if place_id is not None:
        # Return reviews for place
        result = await db.execute(select(Place).where(Place.id == place_id))

        place = result.scalar_one_or_none()

        if place is None:
            raise ValueError("Place not found")

        result = await db.execute(
            select(Review)
            .where(Review.place_id == place_id)
            .order_by(Review.created_at.desc())
        )

    else:
        # Return reviews for website
        result = await db.execute(
            select(Review)
            .where(Review.place_id.is_(None))
            .order_by(Review.created_at.desc())
        )

    reviews = result.scalars().all()

    return list(reviews)
