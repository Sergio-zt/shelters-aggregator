from app.models.locations import City, Facility, Location

def test_jsonb_multilanguage_and_relationships(db_session):
    # 1. Test JSONB translation storage in City model
    city = City(name={"uk": "Київ", "en": "Kyiv"})
    db_session.add(city)
    db_session.commit()
    db_session.refresh(city)

    assert city.name["uk"] == "Київ"
    assert city.name["en"] == "Kyiv"

    # 2. Test Many-to-Many relationship and JSONB in Location model
    facility = Facility(name={"uk": "Пандус", "en": "Ramp"})
    
    location = Location(
        latitude=50.4501,
        longitude=30.5234,
        address={"uk": "вул. Хрещатик, 1", "en": "1 Khreshchatyk St"},
        shelter_type={"uk": "Підвал", "en": "Basement"}
    )
    location.facilities.append(facility)
    
    db_session.add(facility)
    db_session.add(location)
    db_session.commit()
    db_session.refresh(location)

    # 3. Assert relations and JSONB fields are correctly retrieved
    assert location.address["en"] == "1 Khreshchatyk St"
    assert location.shelter_type["uk"] == "Підвал"
    assert len(location.facilities) == 1
    assert location.facilities[0].name["uk"] == "Пандус"