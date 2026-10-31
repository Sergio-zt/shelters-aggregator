from sqlalchemy import Column, Integer, Float, Boolean, ForeignKey, Table
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.db.database import Base

# Association table for Location <-> Facility (Many-to-Many)
location_facility_association = Table(
    "location_facility",
    Base.metadata,
    Column("location_id", Integer, ForeignKey("locations.id", ondelete="CASCADE"), primary_key=True),
    Column("facility_id", Integer, ForeignKey("facilities.id", ondelete="CASCADE"), primary_key=True)
)

class City(Base):
    __tablename__ = "cities"

    id = Column(Integer, primary_key=True, index=True)
    # e.g., {"uk": "Київ", "en": "Kyiv"}
    name = Column(JSONB, nullable=False)
    is_active = Column(Boolean, default=True)

    districts = relationship("District", back_populates="city", cascade="all, delete-orphan")

class District(Base):
    __tablename__ = "districts"

    id = Column(Integer, primary_key=True, index=True)
    # e.g., {"uk": "Шевченківський", "en": "Shevchenkivskyi"}
    name = Column(JSONB, nullable=False)
    city_id = Column(Integer, ForeignKey("cities.id", ondelete="CASCADE"), nullable=False)

    city = relationship("City", back_populates="districts")
    locations = relationship("Location", back_populates="district")

class Facility(Base):
    __tablename__ = "facilities"

    id = Column(Integer, primary_key=True, index=True)
    # e.g., {"uk": "Пандус", "en": "Ramp"}
    name = Column(JSONB, nullable=False)
    
    locations = relationship("Location", secondary=location_facility_association, back_populates="facilities")

class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    
    # Coordinates
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    
    # Multi-language fields
    address = Column(JSONB, nullable=True)
    description = Column(JSONB, nullable=True)
    shelter_type = Column(JSONB, nullable=True)
    
    # Additional properties
    capacity = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Foreign Keys
    district_id = Column(Integer, ForeignKey("districts.id", ondelete="SET NULL"), nullable=True)
    
    # Relationships
    district = relationship("District", back_populates="locations")
    facilities = relationship("Facility", secondary=location_facility_association, back_populates="locations")