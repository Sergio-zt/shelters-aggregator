from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.places import District, Facility, Place


async def get_districts(db: AsyncSession) -> list[District]:
    """Retrieve all available districts from the database."""

    result = await db.execute(select(District).order_by(District.id))
    return list(result.scalars().all())


async def get_facilities(db: AsyncSession) -> list[Facility]:
    """Retrieve all available facilities from the database."""

    result = await db.execute(select(Facility).order_by(Facility.id))
    return list(result.scalars().all())


async def get_place_types(db: AsyncSession) -> list[dict]:
    """Retrieve unique shelter types from the database."""

    result = await db.execute(
        select(Place.type).distinct().where(Place.type.is_not(None))
    )
    return list(result.scalars().all())
