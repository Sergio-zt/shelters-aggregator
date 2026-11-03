import os
import pytest
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.db.database import Base
from backend.app.models.places import City, District, Facility, Place

load_dotenv()

DATABASE_URL = os.getenv("TEST_DATABASE_URL")

engine = create_engine(DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()

@pytest.fixture
def test_city(db_session):
    city = City(name={"en": "Test City", "uk": "Тестове Місто"})
    db_session.add(city)
    db_session.commit()
    db_session.refresh(city)
    return city

@pytest.fixture
def test_district(db_session, test_city):
    district = District(name={"en": "Test District", "uk": "Тестовий Район"}, city_id=test_city.id)
    db_session.add(district)
    db_session.commit()
    db_session.refresh(district)
    return district

@pytest.fixture
def test_facility(db_session):
    facility = Facility(name={"en": "Ramp", "uk": "Пандус"})
    db_session.add(facility)
    db_session.commit()
    db_session.refresh(facility)
    return facility