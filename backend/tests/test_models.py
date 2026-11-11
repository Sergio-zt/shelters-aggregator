import pytest
from sqlalchemy.exc import IntegrityError

from backend.app.models.places import Place, SuggestedPlace


async def test_create_place(db_session, test_district, test_facility):
    new_place = Place(
        external_id="kyiv-001",
        latitude=50.4501,
        longitude=30.5234,
        address={"en": "123 Main St", "uk": "вул. Головна, 123"},
        type={"en": "Basement", "uk": "Підвал"},
        photo_url="https://example.com/photo.jpg",
        district_id=test_district.id,
    )
    new_place.facilities.append(test_facility)

    db_session.add(new_place)
    await db_session.commit()
    # In async, relationships are not loaded automatically when we read them,
    # so we ask to load "facilities" right here
    await db_session.refresh(new_place, ["facilities"])

    assert new_place.id is not None
    assert new_place.latitude == 50.4501
    assert new_place.type["uk"] == "Підвал"
    assert new_place.district_id == test_district.id
    assert len(new_place.facilities) == 1
    assert new_place.facilities[0].id == test_facility.id


async def test_place_capacity_tier(db_session):
    place = Place(
        latitude=50.45,
        longitude=30.52,
        capacity_tier={
            "uk": "Висока місткість (>1000 осіб)",
            "en": "High capacity (>1000 people)",
        },
    )
    db_session.add(place)
    await db_session.commit()
    await db_session.refresh(place)

    assert place.capacity_tier["uk"] == "Висока місткість (>1000 осіб)"


async def test_new_place_has_no_rating(db_session):
    place = Place(latitude=50.45, longitude=30.52)
    db_session.add(place)
    await db_session.commit()
    await db_session.refresh(place)

    # A new place has no reviews: rating is empty (not 0 stars)
    assert place.reviews_count == 0
    assert place.average_rating is None


async def test_new_suggested_place_is_pending(db_session):
    suggestion = SuggestedPlace(address="вул. Берестейський пр., 134")
    db_session.add(suggestion)
    await db_session.commit()
    await db_session.refresh(suggestion)

    # A new suggestion gets an id and waits for moderation
    assert suggestion.id is not None
    assert suggestion.status == "pending"
    assert suggestion.created_at is not None


async def test_suggested_place_saves_form_fields(db_session):
    suggestion = SuggestedPlace(
        address="вул. Берестейський пр., 134",
        type="basement",
        facilities=["ramp", "wifi"],
        details="Вхід з двору",
    )
    db_session.add(suggestion)
    await db_session.commit()
    await db_session.refresh(suggestion)

    assert suggestion.type == "basement"
    assert suggestion.facilities == ["ramp", "wifi"]
    assert suggestion.details == "Вхід з двору"


async def test_suggested_place_needs_address(db_session):
    db_session.add(SuggestedPlace(type="metro"))

    # Address is required in the form, so the database doesn't allow an empty one
    with pytest.raises(IntegrityError):
        await db_session.commit()
