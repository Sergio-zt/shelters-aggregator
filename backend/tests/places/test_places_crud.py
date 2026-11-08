from backend.app.crud.places import get_place
from backend.app.models.places import Place


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
