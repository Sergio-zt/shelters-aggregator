import uuid

import pytest

from backend.app.crud.reviews import get_reviews, add_review
from backend.app.models.places import Place
from backend.app.models.reviews import Review
from backend.app.schemas.reviews import ReviewCreate


async def test_get_website_reviews(db_session):
    website_review = Review(
        visitor_id=uuid.uuid4(),
        author_name="Artem",
        text="Great website",
        place_id=None,
    )
    db_session.add(website_review)
    await db_session.commit()

    result = await get_reviews(db_session)

    assert len(result) == 1
    assert result[0].id == website_review.id
    assert result[0].place_id is None
    assert result[0].author_name == "Artem"


async def test_get_place_reviews(db_session):
    place = Place(
        address={"uk": "пл. Вокзальна, 1", "en": "Vokzalna Sq, 1"},
        latitude=50.44,
        longitude=30.49,
        type={"uk": "укриття", "en": "shelter"},
    )
    db_session.add(place)
    await db_session.flush()

    place_review = Review(
        visitor_id=uuid.uuid4(),
        author_name="Artem",
        text="Good shelter",
        place_id=place.id,
    )
    db_session.add(place_review)
    await db_session.commit()

    result = await get_reviews(db_session, place.id)

    assert len(result) == 1
    assert result[0].id == place_review.id
    assert result[0].place_id == place.id


async def test_get_website_reviews_empty(db_session):
    result = await get_reviews(db_session)

    assert result == []


async def test_get_place_reviews_empty(db_session):
    place = Place(
        address={"uk": "пл. Вокзальна, 1", "en": "Vokzalna Sq, 1"},
        latitude=50.44,
        longitude=30.49,
        type={"uk": "укриття", "en": "shelter"},
    )
    db_session.add(place)
    await db_session.commit()

    result = await get_reviews(db_session, place.id)

    assert result == []


async def test_get_place_reviews_wrong_id(db_session):
    with pytest.raises(ValueError, match="Place not found"):
        await get_reviews(db_session, 999999)


async def test_add_website_review(db_session):
    data = ReviewCreate(
        author_name="Artem",
        text="Great website",
    )
    visitor_id = uuid.uuid4()

    result = await add_review(db_session, data, visitor_id)

    assert result.id is not None
    assert result.place_id is None
    assert result.visitor_id == visitor_id
    assert result.author_name == "Artem"
    assert result.text == "Great website"


async def test_add_place_review(db_session):
    place = Place(
        address={"uk": "пл. Вокзальна, 1", "en": "Vokzalna Sq, 1"},
        latitude=50.44,
        longitude=30.49,
        type={"uk": "укриття", "en": "shelter"},
    )
    db_session.add(place)
    await db_session.commit()

    data = ReviewCreate(
        author_name="Artem",
        text="Good shelter",
    )
    visitor_id = uuid.uuid4()

    result = await add_review(db_session, data, visitor_id, place.id)

    assert result.id is not None
    assert result.place_id == place.id
    assert result.visitor_id == visitor_id


async def test_add_place_review_updates_statistics(db_session):
    place = Place(
        address={"uk": "пл. Вокзальна, 1", "en": "Vokzalna Sq, 1"},
        latitude=50.44,
        longitude=30.49,
        type={"uk": "укриття", "en": "shelter"},
    )
    db_session.add(place)
    await db_session.commit()

    first_review = ReviewCreate(
        author_name="User 1",
        text="Excellent",
    )
    second_review = ReviewCreate(
        author_name="User 2",
        text="Average",
    )

    await add_review(db_session, first_review, uuid.uuid4(), place.id)
    await add_review(db_session, second_review, uuid.uuid4(), place.id)

    await db_session.refresh(place)

    assert place.reviews_count == 2


async def test_add_review_wrong_place_id(db_session):
    data = ReviewCreate(
        author_name="Artem",
        text="Great shelter",
    )

    with pytest.raises(ValueError, match="Place not found"):
        await add_review(db_session, data, uuid.uuid4(), 999999)
