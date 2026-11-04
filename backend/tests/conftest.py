import os

import pytest
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from starlette.testclient import TestClient

from backend.app.db.database import Base, get_db
from backend.app.main import app
from backend.app.models.places import City, District, Facility

load_dotenv()

DATABASE_URL = os.getenv("TEST_DATABASE_URL")

engine = create_engine(DATABASE_URL)


@pytest.fixture(scope="session", autouse=True)
def create_tables():
    # Recreate tables so the test DB always matches the current models
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session():
    # Every test runs inside a transaction that is rolled back at the end,
    # so tests don't see data from each other.
    # session.commit() inside a test only releases a savepoint.
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection, join_transaction_mode="create_savepoint")
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture
def client(db_session):
    # Endpoints use the same test session instead of the real database
    app.dependency_overrides[get_db] = lambda: db_session
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def test_city(db_session):
    city = City(name={"en": "Test City", "uk": "Тестове Місто"})
    db_session.add(city)
    db_session.commit()
    db_session.refresh(city)
    return city


@pytest.fixture
def test_district(db_session, test_city):
    district = District(
        name={"en": "Test District", "uk": "Тестовий Район"}, city_id=test_city.id
    )
    db_session.add(district)
    db_session.commit()
    db_session.refresh(district)
    return district


@pytest.fixture
def test_facility(db_session):
    facility = Facility(name={"en": "Ramp", "uk": "Пандус"}, icon_name="ramp")
    db_session.add(facility)
    db_session.commit()
    db_session.refresh(facility)
    return facility
