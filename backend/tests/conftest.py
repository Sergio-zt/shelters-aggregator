import os

import pytest
import pytest_asyncio
from dotenv import load_dotenv
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.pool import NullPool

from backend.app.db.database import Base, get_db
from backend.app.main import app
from backend.app.models.places import City, District, Facility

load_dotenv()

DATABASE_URL = os.getenv("TEST_DATABASE_URL")

# NullPool: every test opens its own new connection and closes it after.
# pytest-asyncio gives every test its own event loop,
# and a connection can't be shared between different loops
engine = create_async_engine(DATABASE_URL, poolclass=NullPool)


@pytest_asyncio.fixture(scope="session", loop_scope="session", autouse=True)
async def create_tables():
    # Recreate tables so the test DB always matches the current models.
    # create_all/drop_all are sync functions, run_sync runs them on async connection
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.drop_all)
        await connection.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def db_session():
    # Every test runs inside a transaction that is rolled back at the end,
    # so tests don't see data from each other.
    # session.commit() inside a test only releases a savepoint.
    async with engine.connect() as connection:
        transaction = await connection.begin()
        session = AsyncSession(
            bind=connection,
            join_transaction_mode="create_savepoint",
            expire_on_commit=False,
        )
        try:
            yield session
        finally:
            await session.close()
            await transaction.rollback()


@pytest.fixture
async def client(db_session):
    # Endpoints use the same test session instead of the real database
    app.dependency_overrides[get_db] = lambda: db_session
    # AsyncClient sends requests straight to the app, without a real server
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    app.dependency_overrides.clear()


@pytest.fixture
async def test_city(db_session):
    city = City(name={"en": "Test City", "uk": "Тестове Місто"})
    db_session.add(city)
    await db_session.commit()
    await db_session.refresh(city)
    return city


@pytest.fixture
async def test_district(db_session, test_city):
    district = District(
        name={"en": "Test District", "uk": "Тестовий Район"}, city_id=test_city.id
    )
    db_session.add(district)
    await db_session.commit()
    await db_session.refresh(district)
    return district


@pytest.fixture
async def test_facility(db_session):
    facility = Facility(name={"en": "Ramp", "uk": "Пандус"}, icon_name="ramp")
    db_session.add(facility)
    await db_session.commit()
    await db_session.refresh(facility)
    return facility
