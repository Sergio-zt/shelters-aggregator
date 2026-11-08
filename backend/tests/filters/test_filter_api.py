from backend.app.models.places import Place


async def test_get_filters(client, db_session, test_district, test_facility):
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

    response = await client.get("/filters")

    assert response.status_code == 200
    assert response.json() == {
        "districts": [
            {
                "id": test_district.id,
                "name": {"en": "Test District", "uk": "Тестовий Район"},
            }
        ],
        "facilities": [
            {"id": test_facility.id, "name": {"en": "Ramp", "uk": "Пандус"}}
        ],
        "place_types": [{"uk": "укриття", "en": "shelter"}],
    }


async def test_get_filters_empty(client, db_session):
    response = await client.get("/filters")

    assert response.status_code == 200
    assert response.json() == {"districts": [], "facilities": [], "place_types": []}
