import uuid

from backend.app.models.places import Place
from backend.app.models.reviews import Review


async def test_get_website_reviews_success(client, db_session):
    website_review = Review(
        visitor_id=uuid.uuid4(),
        author_name="Artem",
        text="Great website",
        place_id=None,
    )

    second_website_review = Review(
        visitor_id=uuid.uuid4(),
        author_name="User",
        text="Good website",
        place_id=None,
    )

    db_session.add_all([website_review, second_website_review])
    await db_session.commit()

    response = await client.get("/reviews")

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 2
    assert all(review["place_id"] is None for review in data)
    assert {review["id"] for review in data} == {
        website_review.id,
        second_website_review.id,
    }


async def test_get_place_reviews_success(client, db_session):
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

    response = await client.get(f"/places/{place.id}/reviews")

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 1
    assert data[0]["id"] == place_review.id
    assert data[0]["place_id"] == place.id


async def test_get_place_reviews_failure(client):
    response = await client.get("/places/999999/reviews")

    assert response.status_code == 404


async def test_get_place_reviews_empty(client, db_session):
    place = Place(
        address={"uk": "пл. Вокзальна, 1", "en": "Vokzalna Sq, 1"},
        latitude=50.44,
        longitude=30.49,
        type={"uk": "укриття", "en": "shelter"},
    )
    db_session.add(place)
    await db_session.commit()

    response = await client.get(f"/places/{place.id}/reviews")

    assert response.status_code == 200
    assert response.json() == []


async def test_create_website_review_success(client, db_session):
    visitor_id = uuid.uuid4()
    client.cookies.set("visitor_id", str(visitor_id))

    payload = {
        "author_name": "Artem",
        "text": "Great website",
    }

    response = await client.post("/reviews", json=payload)

    assert response.status_code == 201

    data = response.json()
    assert data["place_id"] is None
    assert data["visitor_id"] == str(visitor_id)
    assert data["author_name"] == "Artem"
    assert data["text"] == "Great website"


async def test_create_place_review_success(client, db_session):
    place = Place(
        address={"uk": "пл. Вокзальна, 1", "en": "Vokzalna Sq, 1"},
        latitude=50.44,
        longitude=30.49,
        type={"uk": "укриття", "en": "shelter"},
    )
    db_session.add(place)
    await db_session.commit()

    visitor_id = uuid.uuid4()
    client.cookies.set("visitor_id", str(visitor_id))

    payload = {
        "author_name": "Artem",
        "text": "Good shelter",
    }

    response = await client.post(
        f"/places/{place.id}/reviews",
        json=payload,
    )

    assert response.status_code == 201

    data = response.json()
    assert data["place_id"] == place.id
    assert data["visitor_id"] == str(visitor_id)


async def test_create_review_without_visitor_id(client):
    response = await client.post(
        "/reviews",
        json={
            "author_name": "Artem",
            "text": "Great website",
        },
    )

    assert response.status_code == 400


async def test_create_review_invalid_visitor_id(client):
    client.cookies.set("visitor_id", "invalid-uuid")

    response = await client.post(
        "/reviews",
        json={
            "author_name": "Artem",
            "text": "Great website",
        },
    )

    assert response.status_code == 400


async def test_create_review_missing_fields(client):
    client.cookies.set("visitor_id", str(uuid.uuid4()))

    response = await client.post(
        "/reviews",
        json={},
    )

    assert response.status_code == 422


async def test_create_place_review_nonexistent_place(client):
    client.cookies.set("visitor_id", str(uuid.uuid4()))

    response = await client.post(
        "/places/999999/reviews",
        json={
            "author_name": "Artem",
            "text": "Great shelter",
        },
    )

    assert response.status_code == 404


async def test_create_website_review_rate_limit(client, db_session):
    visitor_id = uuid.uuid4()
    client.cookies.set("visitor_id", str(visitor_id))

    payload = {
        "author_name": "Artem",
        "text": "Great website",
    }

    for _ in range(5):
        response = await client.post("/reviews", json=payload)
        assert response.status_code == 201

    response = await client.post("/reviews", json=payload)

    assert response.status_code == 429


async def test_create_place_review_rate_limit(client, db_session):
    place = Place(
        address={"uk": "пл. Вокзальна, 1", "en": "Vokzalna Sq, 1"},
        latitude=50.44,
        longitude=30.49,
        type={"uk": "укриття", "en": "shelter"},
    )
    db_session.add(place)
    await db_session.commit()

    visitor_id = uuid.uuid4()
    client.cookies.set("visitor_id", str(visitor_id))

    payload = {
        "author_name": "Artem",
        "text": "Great website",
    }

    for _ in range(5):
        response = await client.post(
            f"/places/{place.id}/reviews",
            json=payload,
        )
        assert response.status_code == 201

    response = await client.post(
        f"/places/{place.id}/reviews",
        json=payload,
    )

    assert response.status_code == 429
