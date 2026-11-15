import uuid

import pytest
from sqlalchemy.exc import IntegrityError

from backend.app.models.reviews import Review


async def test_review_rating_constraint_valid(db_session):
    review = Review(
        visitor_id=uuid.uuid4(),
        author_name="Artem",
        rating=5,
        text="Great shelter",
    )

    db_session.add(review)
    await db_session.commit()

    assert review.id is not None


@pytest.mark.parametrize("rating", [0, -1, 6, 10])
async def test_review_rating_constraint_invalid(db_session, rating):
    review = Review(
        visitor_id=uuid.uuid4(),
        author_name="Artem",
        rating=rating,
        text="Great shelter",
    )

    db_session.add(review)

    with pytest.raises(IntegrityError):
        await db_session.commit()

    await db_session.rollback()
