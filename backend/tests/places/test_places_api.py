from backend.app.models.places import Place


async def test_get_place_success(client, db_session):
    test_place = Place(
        address={"uk": "пл. Вокзальна, 1", "en": "Vokzalna Sq, 1"},
        latitude=50.44,
        longitude=30.49,
        type={"uk": "укриття", "en": "shelter"},
    )
    db_session.add(test_place)

    await db_session.commit()

    response = await client.get(f"/places/{test_place.id}")

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == test_place.id
    assert data["address"] == test_place.address
    assert data["latitude"] == test_place.latitude
    assert data["longitude"] == test_place.longitude
    assert data["type"] == test_place.type


async def test_get_place_failure(client):
    response = await client.get("/places/999")

    assert response.status_code == 404
    assert response.json() == {"detail": "Place not found"}


async def test_get_places_success(client, db_session):
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

    response = await client.get("/places")

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 2
    assert {place["id"] for place in data} == {
        test_place.id,
        test_place2.id,
    }
