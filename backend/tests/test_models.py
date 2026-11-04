from backend.app.models.places import Place


def test_create_place(db_session, test_district, test_facility):
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
    db_session.commit()
    db_session.refresh(new_place)

    assert new_place.id is not None
    assert new_place.latitude == 50.4501
    assert new_place.type["uk"] == "Підвал"
    assert new_place.district_id == test_district.id
    assert len(new_place.facilities) == 1
    assert new_place.facilities[0].id == test_facility.id
