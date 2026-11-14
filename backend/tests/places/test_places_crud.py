import uuid

from backend.app.crud.places import get_place, get_places, add_suggested_place
from backend.app.models.places import Place
from backend.app.schemas.places import SuggestedPlaceCreate


async def test_get_place(db_session):
    test_place = Place(
        address={"uk": "пл. Вокзальна, 1", "en": "Vokzalna Sq, 1"},
        latitude=50.44,
        longitude=30.49,
        type={"uk": "укриття", "en": "shelter"},
    )
    db_session.add(test_place)

    await db_session.commit()

    place = await get_place(db_session, test_place.id)

    assert place.id == test_place.id


async def test_get_place_wrong_id(db_session):
    place = await get_place(db_session, 999)

    assert place is None


async def test_get_places(db_session):
    test_place = Place(
        address={"uk": "пл. Вокзальна, 1", "en": "Vokzalna Sq, 1"},
        latitude=50.44,
        longitude=30.49,
        type={"uk": "укриття", "en": "shelter"},
    )
    test_place2 = Place(
        address={"uk": "вул. Терещенківська, 2", "en": "Tereshchenkivska St"},
        latitude=50.44,
        longitude=30.51,
        type={"uk": "укриття", "en": "shelter"},
    )
    db_session.add(test_place)
    db_session.add(test_place2)

    await db_session.commit()

    places = await get_places(db_session)

    assert len(places) == 2
    assert test_place in places
    assert test_place2 in places


async def test_get_places_empty(db_session):
    places = await get_places(db_session)

    assert places == []


async def test_add_suggested_place_visitor_id_is_none(db_session):
    data = SuggestedPlaceCreate(
        address="Kyiv, Khreshchatyk Street, 10",
        type="basement",
        facilities=["wifi", "wc"],
        details="Test suggestion",
    )

    suggested_place = await add_suggested_place(db_session, data, visitor_id=None)

    assert suggested_place.address == data.address
    assert suggested_place.type == data.type
    assert suggested_place.facilities == data.facilities
    assert suggested_place.details == data.details
    assert suggested_place.status == "pending"
    assert suggested_place.id is not None
    assert suggested_place.visitor_id is None


async def test_add_suggested_place_wrong_visitor_id(db_session):
    data = SuggestedPlaceCreate(
        address="Kyiv, Khreshchatyk Street, 10",
        type="basement",
        facilities=["wifi", "wc"],
        details="Test suggestion",
    )

    suggested_place = await add_suggested_place(db_session, data, visitor_id="ABC2141r")

    assert suggested_place.address == data.address
    assert suggested_place.type == data.type
    assert suggested_place.facilities == data.facilities
    assert suggested_place.details == data.details
    assert suggested_place.status == "pending"
    assert suggested_place.id is not None
    assert suggested_place.visitor_id is None


async def test_add_suggested_place_with_visitor_id(db_session):
    data = SuggestedPlaceCreate(
        address="Kyiv, Khreshchatyk Street, 10",
        type="basement",
        facilities=["wifi", "wc"],
        details="Test suggestion",
    )

    visitor_id = str(uuid.uuid4())

    suggested_place = await add_suggested_place(db_session, data, visitor_id)

    assert suggested_place.address == data.address
    assert suggested_place.type == data.type
    assert suggested_place.facilities == data.facilities
    assert suggested_place.details == data.details
    assert suggested_place.status == "pending"
    assert suggested_place.id is not None
    assert suggested_place.visitor_id == uuid.UUID(visitor_id)
