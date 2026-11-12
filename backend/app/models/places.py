from sqlalchemy import (
    Column,
    Integer,
    Float,
    String,
    Text,
    ForeignKey,
    CheckConstraint,
    Table,
    DateTime,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from backend.app.db.database import Base

place_facilities_association = Table(
    "place_facilities",
    Base.metadata,
    Column(
        "place_id",
        Integer,
        ForeignKey("places.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "facility_id",
        Integer,
        ForeignKey("facilities.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class City(Base):
    __tablename__ = "cities"

    id = Column(Integer, primary_key=True, index=True)
    # Multi-language name, e.g. {"uk": "Київ", "en": "Kyiv"}
    name = Column(JSONB, nullable=False)

    districts = relationship(
        "District", back_populates="city", cascade="all, delete-orphan"
    )


class District(Base):
    __tablename__ = "districts"

    id = Column(Integer, primary_key=True, index=True)
    city_id = Column(
        Integer, ForeignKey("cities.id", ondelete="CASCADE"), nullable=False
    )
    name = Column(JSONB, nullable=False)

    city = relationship("City", back_populates="districts")
    places = relationship("Place", back_populates="district")


class Facility(Base):
    __tablename__ = "facilities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(JSONB, nullable=False)
    icon_name = Column(String, nullable=True)

    places = relationship(
        "Place", secondary=place_facilities_association, back_populates="facilities"
    )


class Place(Base):
    __tablename__ = "places"

    id = Column(Integer, primary_key=True, index=True)
    # ID of the place in the source dataset (used by the import script)
    external_id = Column(String, unique=True, nullable=True)

    # Foreign Keys
    district_id = Column(
        Integer, ForeignKey("districts.id", ondelete="SET NULL"), nullable=True
    )

    # Multi-language fields
    # Shelter name, e.g. {"uk": "Станція метро Академмістечко"}
    name = Column(JSONB, nullable=True)
    address = Column(JSONB, nullable=True)
    type = Column(JSONB, nullable=True)
    # Capacity category from the analyst dataset,
    # e.g. {"uk": "Висока місткість (>1000 осіб)"}
    capacity_tier = Column(JSONB, nullable=True)
    # Free text from the analyst dataset, e.g. {"uk": "цілодобово"}
    operating_hours = Column(JSONB, nullable=True)

    # How many of the 7 facilities the place has ("6/7" in the dataset -> 6)
    comfort_index = Column(
        Integer,
        CheckConstraint(
            "comfort_index >= 0 AND comfort_index <= 7",
            name="places_comfort_index_check",
        ),
        nullable=True,
    )

    # Coordinates
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    # Reviews summary
    reviews_count = Column(Integer, nullable=False, default=0, server_default="0")
    # NULL means "no ratings yet", so the frontend doesn't show 0 stars
    average_rating = Column(Float, nullable=True)

    # Relationships
    district = relationship("District", back_populates="places")
    facilities = relationship(
        "Facility", secondary=place_facilities_association, back_populates="places"
    )


class PlaceView(Base):
    # One row = one opening of the place details page (for analytics)
    __tablename__ = "place_views"

    id = Column(Integer, primary_key=True, index=True)
    place_id = Column(
        Integer, ForeignKey("places.id", ondelete="CASCADE"), nullable=False
    )
    # Anonymous visitor from the "visitor_id" cookie.
    # Empty if the cookie is missing. There is no visitors table, so no ForeignKey
    visitor_id = Column(UUID(as_uuid=True), nullable=True)
    # The database sets the time itself when the row is created
    viewed_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class SuggestedPlace(Base):
    # A new shelter suggested by a user in the "Add a shelter" form.
    # It is not shown on the map until a moderator checks it
    __tablename__ = "suggested_places"

    id = Column(Integer, primary_key=True, index=True)

    # Fields from the form
    address = Column(String, nullable=False)
    # One code: basement, metro, underpass, semi_basement, parking or other
    type = Column(String, nullable=True)
    # List of facility codes, e.g. ["ramp", "wifi"]
    facilities = Column(JSONB, nullable=True)
    details = Column(Text, nullable=True)

    # Every new suggestion waits for moderation
    status = Column(String, nullable=False, default="pending", server_default="pending")

    # Who sent it and when, to limit how often one visitor can send suggestions
    visitor_id = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
