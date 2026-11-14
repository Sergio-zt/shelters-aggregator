import uuid

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


async def test_create_suggestion_success(client, db_session):
    payload = {
        "address": "Kyiv, Khreshchatyk Street, 10",
        "type": "basement",
        "facilities": ["wifi", "wc"],
        "details": "Test suggestion",
    }

    client.cookies.set("visitor_id", str(uuid.uuid4()))

    response = await client.post("/suggestion", json=payload)

    assert response.status_code == 201

    data = response.json()

    assert data["id"] is not None
    assert data["address"] == payload["address"]
    assert data["type"] == payload["type"]
    assert data["facilities"] == payload["facilities"]
    assert data["details"] == payload["details"]
    assert data["status"] == "pending"
    assert "created_at" in data


async def test_create_suggestion_without_address(client, db_session):
    payload = {
        "type": "basement",
        "facilities": ["wifi", "wc"],
        "details": "Test suggestion",
    }

    client.cookies.set("visitor_id", str(uuid.uuid4()))

    response = await client.post("/suggestion", json=payload)

    assert response.status_code == 422


async def test_create_suggestion_empty_address(client, db_session):
    payload = {
        "address": "",
        "type": "basement",
        "facilities": ["wifi", "wc"],
        "details": "Test suggestion",
    }

    client.cookies.set("visitor_id", str(uuid.uuid4()))

    response = await client.post("/suggestion", json=payload)

    assert response.status_code == 422


async def test_create_suggestion_blank_address(client, db_session):
    payload = {
        "address": "  ",
        "type": "basement",
        "facilities": ["wifi", "wc"],
        "details": "Test suggestion",
    }

    client.cookies.set("visitor_id", str(uuid.uuid4()))

    response = await client.post("/suggestion", json=payload)

    assert response.status_code == 422


async def test_create_suggestion_address_too_long(client, db_session):
    payload = {
        "address": "a" * 256,
        "type": "basement",
        "facilities": ["wifi", "wc"],
        "details": "Test suggestion",
    }

    client.cookies.set("visitor_id", str(uuid.uuid4()))

    response = await client.post("/suggestion", json=payload)

    assert response.status_code == 422


async def test_create_suggestion_wrong_facilities_not_list(client, db_session):
    payload = {
        "address": "Kyiv, Khreshchatyk Street, 10",
        "type": "basement",
        "facilities": "wc",
        "details": "Test suggestion",
    }

    client.cookies.set("visitor_id", str(uuid.uuid4()))

    response = await client.post("/suggestion", json=payload)

    assert response.status_code == 422


async def test_create_suggestion_without_visitor_id(client, db_session):
    payload = {
        "address": "Kyiv, Khreshchatyk Street, 10",
        "type": "basement",
        "facilities": ["wifi", "wc"],
        "details": "Test suggestion",
    }

    response = await client.post("/suggestion", json=payload)

    assert response.status_code == 400
    assert response.json() == {"detail": "Visitor id not provided"}


async def test_create_suggestion_wrong_visitor_id(client, db_session):
    payload = {
        "address": "Kyiv, Khreshchatyk Street, 10",
        "type": "basement",
        "facilities": ["wifi", "wc"],
        "details": "Test suggestion",
    }

    client.cookies.set("visitor_id", "ABC123")

    response = await client.post("/suggestion", json=payload)

    assert response.status_code == 400
    assert response.json() == {"detail": "Invalid visitor id"}


async def test_create_suggestion_rate_limit(client, db_session):
    payload = {
        "address": "Kyiv, Khreshchatyk Street, 10",
        "type": "basement",
        "facilities": ["wifi", "wc"],
        "details": "Test suggestion",
    }

    client.cookies.set("visitor_id", str(uuid.uuid4()))

    for _ in range(5):
        response = await client.post("/suggestion", json=payload)
        assert response.status_code == 201

    response = await client.post("/suggestion", json=payload)

    assert response.status_code == 429
