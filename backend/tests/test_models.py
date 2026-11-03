from backend.app.models.places import Place

def test_create_place(db_session, test_district, test_facility):
    new_place = Place(
        latitude=50.4501,
        longitude=30.5234,
        address={"en": "123 Main St", "uk": "вул. Головна, 123"},
        description={"en": "Test Shelter", "uk": "Тестове укриття"},
        shelter_type={"en": "Basement", "uk": "Підвал"},
        capacity=100,
        district_id=test_district.id
    )
    new_place.facilities.append(test_facility)
    
    db_session.add(new_place)
    db_session.commit()
    db_session.refresh(new_place)

    assert new_place.id is not None
    assert new_place.latitude == 50.4501
    assert new_place.district_id == test_district.id
    assert len(new_place.facilities) == 1
    assert new_place.facilities[0].id == test_facility.id