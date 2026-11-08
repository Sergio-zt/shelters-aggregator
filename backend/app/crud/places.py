from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.app.models.places import District, Place

EARTH_RADIUS_METERS = 6371000

# Languages stored in JSONB fields. To support a new language, just add it here
SUPPORTED_LANGUAGES = ["uk", "en"]


def distance_in_meters(lat: float, lng: float):
    # Haversine formula: distance between two points on a sphere.
    # It is built as an SQL expression, so PostgreSQL calculates it for every row.
    lat1 = func.radians(lat)
    lat2 = func.radians(Place.latitude)
    delta_lat = func.radians(Place.latitude - lat)
    delta_lng = func.radians(Place.longitude - lng)

    a = func.power(func.sin(delta_lat / 2), 2) + func.cos(lat1) * func.cos(
        lat2
    ) * func.power(func.sin(delta_lng / 2), 2)

    return 2 * EARTH_RADIUS_METERS * func.asin(func.sqrt(a))


async def search_places(
    db: AsyncSession,
    q: str | None = None,
    city_id: int | None = None,
    district_id: int | None = None,
    lat: float | None = None,
    lng: float | None = None,
    radius: int | None = None,
    skip: int = 0,
    limit: int = 20,
) -> list[Place]:
    stmt = select(Place)

    if q:
        # Search in address and type in every language,
        # so "метро" and "metro" both find a metro station
        search_term = f"%{q}%"
        conditions = []
        for lang in SUPPORTED_LANGUAGES:
            conditions.append(Place.address[lang].astext.ilike(search_term))
            conditions.append(Place.type[lang].astext.ilike(search_term))
        stmt = stmt.where(or_(*conditions))

    if city_id:
        # Place has no city_id, the city is known through the district
        stmt = stmt.join(Place.district).where(District.city_id == city_id)

    if district_id:
        stmt = stmt.where(Place.district_id == district_id)

    if lat is not None and lng is not None and radius is not None:
        # Geo search: only places inside the circle, the nearest go first
        distance = distance_in_meters(lat, lng)
        stmt = stmt.where(distance <= radius).order_by(distance)
    else:
        stmt = stmt.order_by(Place.id)

    stmt = stmt.offset(skip).limit(limit)

    # await: wait for the DB answer without blocking other requests
    result = await db.scalars(stmt)
    return list(result.all())


async def get_places(db: AsyncSession) -> list[Place]:
    """Retrieve places from the database."""

    result = await db.execute(
        select(Place).options(
            selectinload(Place.district).selectinload(District.city),
            selectinload(Place.facilities),
        )
    )

    return list(result.scalars().all())
