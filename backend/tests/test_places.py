from backend.app.models.places import City, District, Place


async def test_search_places_without_filters(client, db_session, test_district):
    db_session.add_all(
        [
            Place(
                address={"uk": "пл. Вокзальна, 1", "en": "Vokzalna Sq, 1"},
                latitude=50.44,
                longitude=30.49,
                district_id=test_district.id,
            ),
            Place(
                address={"uk": "вул. Терещенківська, 2", "en": "Tereshchenkivska St"},
                latitude=50.44,
                longitude=30.51,
            ),
        ]
    )
    await db_session.commit()

    response = await client.get("/places/search")

    assert response.status_code == 200
    assert len(response.json()) == 2


async def test_search_places_returns_rating_fields(client, db_session):
    db_session.add(
        Place(
            latitude=50.44,
            longitude=30.49,
            capacity_tier={"uk": "Висока місткість (>1000 осіб)"},
        )
    )
    await db_session.commit()

    response = await client.get("/places/search")

    assert response.status_code == 200
    place = response.json()[0]
    assert place["capacity_tier"]["uk"] == "Висока місткість (>1000 осіб)"
    assert place["reviews_count"] == 0
    # null tells the frontend to show "no reviews yet" instead of 0 stars
    assert place["average_rating"] is None


async def test_search_places_by_address(client, db_session):
    db_session.add_all(
        [
            Place(address={"uk": "Площа Ринок, 1"}, latitude=49.84, longitude=24.03),
            Place(address={"uk": "вул. Зелена, 5"}, latitude=49.83, longitude=24.05),
        ]
    )
    await db_session.commit()

    response = await client.get("/places/search", params={"q": "ринок"})

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["address"]["uk"] == "Площа Ринок, 1"


async def test_search_places_by_city_id(client, db_session, test_city, test_district):
    other_city = City(name={"uk": "Інше Місто"})
    other_district = District(name={"uk": "Інший Район"}, city=other_city)
    db_session.add_all(
        [
            Place(latitude=50.0, longitude=30.0, district_id=test_district.id),
            Place(latitude=49.0, longitude=24.0, district=other_district),
        ]
    )
    await db_session.commit()

    response = await client.get("/places/search", params={"city_id": test_city.id})

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["district_id"] == test_district.id


async def test_search_places_by_district_id(client, db_session, test_district):
    db_session.add_all(
        [
            Place(latitude=50.0, longitude=30.0, district_id=test_district.id),
            Place(latitude=50.1, longitude=30.1),
        ]
    )
    await db_session.commit()

    response = await client.get(
        "/places/search", params={"district_id": test_district.id}
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["district_id"] == test_district.id


async def test_search_places_by_type(client, db_session):
    db_session.add_all(
        [
            Place(type={"uk": "Станція метро"}, latitude=50.44, longitude=30.52),
            Place(type={"uk": "Укриття"}, latitude=50.45, longitude=30.53),
        ]
    )
    await db_session.commit()

    response = await client.get("/places/search", params={"q": "метро"})

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["type"]["uk"] == "Станція метро"


async def test_search_places_in_english(client, db_session):
    db_session.add_all(
        [
            Place(
                type={"uk": "Станція метро", "en": "Metro station"},
                latitude=50.44,
                longitude=30.52,
            ),
            Place(
                type={"uk": "Укриття", "en": "Shelter"},
                latitude=50.45,
                longitude=30.53,
            ),
        ]
    )
    await db_session.commit()

    response = await client.get("/places/search", params={"q": "metro"})

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["type"]["en"] == "Metro station"


# Kyiv, Maidan Nezalezhnosti
KYIV_LAT = 50.4501
KYIV_LNG = 30.5234


async def test_search_places_by_radius(client, db_session):
    # 0.009 degrees of latitude is about 1 km
    near = Place(latitude=KYIV_LAT + 0.009, longitude=KYIV_LNG)
    nearest = Place(latitude=KYIV_LAT + 0.001, longitude=KYIV_LNG)
    far = Place(latitude=49.8397, longitude=24.0297)  # Lviv, ~470 km
    db_session.add_all([near, nearest, far])
    await db_session.commit()

    response = await client.get(
        "/places/search",
        params={"lat": KYIV_LAT, "lng": KYIV_LNG, "radius": 2000},
    )

    assert response.status_code == 200
    data = response.json()
    # Lviv is not in the radius, the nearest place goes first
    assert [p["id"] for p in data] == [nearest.id, near.id]


async def test_search_places_by_radius_and_text(client, db_session):
    db_session.add_all(
        [
            Place(type={"uk": "Станція метро"}, latitude=KYIV_LAT, longitude=KYIV_LNG),
            Place(type={"uk": "Укриття"}, latitude=KYIV_LAT, longitude=KYIV_LNG),
            Place(type={"uk": "Станція метро"}, latitude=49.8397, longitude=24.0297),
        ]
    )
    await db_session.commit()

    response = await client.get(
        "/places/search",
        params={"q": "метро", "lat": KYIV_LAT, "lng": KYIV_LNG, "radius": 1000},
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["type"]["uk"] == "Станція метро"
    assert data[0]["latitude"] == KYIV_LAT


async def test_search_places_returns_empty_list(client, db_session):
    db_session.add(
        Place(address={"uk": "вул. Хрещатик, 1"}, latitude=50.0, longitude=30.0)
    )
    await db_session.commit()

    response = await client.get("/places/search", params={"q": "неіснуюча адреса"})

    assert response.status_code == 200
    assert response.json() == []


async def test_search_places_geo_params_must_be_together(client):
    response = await client.get(
        "/places/search", params={"lat": KYIV_LAT, "lng": KYIV_LNG}
    )

    assert response.status_code == 422
    assert response.json()["detail"] == "lat, lng and radius must be passed together"


async def test_search_places_invalid_params(client):
    invalid_params = [
        {"lat": 100, "lng": 30, "radius": 1000},  # latitude can't be more than 90
        {"lat": 50, "lng": 30, "radius": -5},  # radius must be positive
        {"limit": 1000},  # limit max is 100
        {"city_id": "abc"},  # city_id must be a number
    ]

    for params in invalid_params:
        response = await client.get("/places/search", params=params)
        assert response.status_code == 422, params


async def test_search_places_returns_name_hours_and_comfort_index(client, db_session):
    db_session.add(
        Place(
            latitude=50.44,
            longitude=30.49,
            name={"uk": "Станція метро Житомирська"},
            operating_hours={"uk": "05:30–23:20"},
            comfort_index=4,
        )
    )
    await db_session.commit()

    response = await client.get("/places/search")

    assert response.status_code == 200
    place = response.json()[0]
    assert place["name"]["uk"] == "Станція метро Житомирська"
    assert place["operating_hours"]["uk"] == "05:30–23:20"
    assert place["comfort_index"] == 4
