from backend.app.crud.filters import get_districts, get_facilities, get_place_types
from backend.app.models.places import Place


async def test_get_districts(db_session, test_district):
    districts = await get_districts(db_session)

    assert districts == [test_district]


async def test_get_districts_empty(db_session):
    districts = await get_districts(db_session)

    assert districts == []


async def test_get_facilities(db_session, test_facility):
    facilities = await get_facilities(db_session)

    assert facilities == [test_facility]


async def test_get_facilities_empty(db_session):
    facilities = await get_facilities(db_session)

    assert facilities == []


async def test_get_place_types(db_session):
    db_session.add_all(
        [
            Place(
                address={"uk": "пл. Вокзальна, 1", "en": "Vokzalna Sq, 1"},
                latitude=50.44,
                longitude=30.49,
                type={"uk": "укриття", "en": "shelter"},
            ),
        ]
    )

    await db_session.commit()

    place_types = await get_place_types(db_session)

    assert place_types == [{"uk": "укриття", "en": "shelter"}]


async def test_get_two_same_shelter_types(db_session):
    db_session.add_all(
        [
            Place(
                address={"uk": "пл. Вокзальна, 1", "en": "Vokzalna Sq, 1"},
                latitude=50.44,
                longitude=30.49,
                type={"uk": "укриття", "en": "shelter"},
            ),
            Place(
                address={"uk": "вул. Терещенківська, 2", "en": "Tereshchenkivska St"},
                latitude=50.44,
                longitude=30.51,
                type={"uk": "укриття", "en": "shelter"},
            ),
        ]
    )

    await db_session.commit()

    place_types = await get_place_types(db_session)

    assert place_types == [{"uk": "укриття", "en": "shelter"}]


async def test_get_place_types_multiple_types(db_session):
    db_session.add_all(
        [
            Place(
                address={"uk": "пл. Вокзальна, 1", "en": "Vokzalna Sq, 1"},
                latitude=50.44,
                longitude=30.49,
                type={"uk": "укриття", "en": "shelter"},
            ),
            Place(
                address={"uk": "вул. Терещенківська, 2", "en": "Tereshchenkivska St"},
                latitude=50.44,
                longitude=30.51,
                type={"uk": "метро", "en": "metro"},
            ),
        ]
    )

    await db_session.commit()

    place_types = await get_place_types(db_session)

    assert place_types == [
        {"uk": "метро", "en": "metro"},
        {"uk": "укриття", "en": "shelter"},
    ]


async def test_get_shelter_types_empty(db_session):
    place_types = await get_place_types(db_session)

    assert place_types == []
