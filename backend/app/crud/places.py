from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.models.places import District, Place


def search_places(
    db: Session,
    q: str | None = None,
    city_id: int | None = None,
    district_id: int | None = None,
    skip: int = 0,
    limit: int = 20,
) -> list[Place]:
    stmt = select(Place)

    if q:
        # Search only by Ukrainian address for now
        stmt = stmt.where(Place.address["uk"].astext.ilike(f"%{q}%"))

    if city_id:
        # Place has no city_id, the city is known through the district
        stmt = stmt.join(Place.district).where(District.city_id == city_id)

    if district_id:
        stmt = stmt.where(Place.district_id == district_id)

    stmt = stmt.order_by(Place.id).offset(skip).limit(limit)

    return list(db.scalars(stmt).all())
