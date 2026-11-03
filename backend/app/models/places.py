from sqlalchemy import Column, Integer, Float, Boolean, ForeignKey, Table
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from backend.app.db.database import Base

place_facilities_association = Table(
    "place_facilities",
    Base.metadata,
    Column("place_id", Integer, ForeignKey("places.id", ondelete="CASCADE"), primary_key=True),
    Column("facility_id", Integer, ForeignKey("facilities.id", ondelete="CASCADE"), primary_key=True)
)

class City(Base):
    __tablename__ = "cities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(JSONB, nullable=False)
    is_active = Column(Boolean, default=True)

    districts = relationship("District", back_populates="city", cascade="all, delete-orphan")

class District(Base):
    __tablename__ = "districts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(JSONB, nullable=False)
    city_id = Column(Integer, ForeignKey("cities.id", ondelete="CASCADE"), nullable=False)

    city = relationship("City", back_populates="districts")
    places = relationship("Place", back_populates="district")

class Facility(Base):
    __tablename__ = "facilities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(JSONB, nullable=False)
    
    places = relationship("Place", secondary=place_facilities_association, back_populates="facilities")

class Place(Base):
    __tablename__ = "places"

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
    district = relationship("District", back_populates="places")
    facilities = relationship("Facility", secondary=place_facilities_association, back_populates="places")