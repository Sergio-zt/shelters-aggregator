from backend.app.models.places import City, District, Place


def test_search_places_without_filters(client, db_session, test_district):
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
    db_session.commit()

    response = client.get("/places/search")

    assert response.status_code == 200
    assert len(response.json()) == 2


def test_search_places_by_address(client, db_session):
    db_session.add_all(
        [
            Place(address={"uk": "Площа Ринок, 1"}, latitude=49.84, longitude=24.03),
            Place(address={"uk": "вул. Зелена, 5"}, latitude=49.83, longitude=24.05),
        ]
    )
    db_session.commit()

    response = client.get("/places/search", params={"q": "ринок"})

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["address"]["uk"] == "Площа Ринок, 1"


def test_search_places_by_city_id(client, db_session, test_city, test_district):
    other_city = City(name={"uk": "Інше Місто"})
    other_district = District(name={"uk": "Інший Район"}, city=other_city)
    db_session.add_all(
        [
            Place(latitude=50.0, longitude=30.0, district_id=test_district.id),
            Place(latitude=49.0, longitude=24.0, district=other_district),
        ]
    )
    db_session.commit()

    response = client.get("/places/search", params={"city_id": test_city.id})

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["district_id"] == test_district.id


def test_search_places_by_district_id(client, db_session, test_district):
    db_session.add_all(
        [
            Place(latitude=50.0, longitude=30.0, district_id=test_district.id),
            Place(latitude=50.1, longitude=30.1),
        ]
    )
    db_session.commit()

    response = client.get("/places/search", params={"district_id": test_district.id})

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["district_id"] == test_district.id
