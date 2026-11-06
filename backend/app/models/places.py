from sqlalchemy import Column, Integer, Float, String, ForeignKey, Table
from sqlalchemy.dialects.postgresql import JSONB
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
    address = Column(JSONB, nullable=True)
    type = Column(JSONB, nullable=True)
    # Capacity category from the analyst dataset,
    # e.g. {"uk": "Висока місткість (>1000 осіб)"}
    capacity_tier = Column(JSONB, nullable=True)

    # Coordinates
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    photo_url = Column(String, nullable=True)

    # Reviews summary
    reviews_count = Column(Integer, nullable=False, default=0, server_default="0")
    # NULL means "no ratings yet", so the frontend doesn't show 0 stars
    average_rating = Column(Float, nullable=True)

    # Relationships
    district = relationship("District", back_populates="places")
    facilities = relationship(
        "Facility", secondary=place_facilities_association, back_populates="places"
    )
