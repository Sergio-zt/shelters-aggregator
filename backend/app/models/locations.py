from sqlalchemy import Column, Integer, Float, String, Boolean
from sqlalchemy.dialects.postgresql import JSONB
from app.db.database import Base

class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    
    # Coordinates
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    
    # Multi-language fields using JSONB (e.g., {"uk": "вул. Хрещатик, 1", "en": "1 Khreshchatyk St"})
    address = Column(JSONB, nullable=True)
    description = Column(JSONB, nullable=True)
    shelter_type = Column(JSONB, nullable=True) # e.g., {"uk": "Підвал", "en": "Basement"}
    
    # Additional properties
    capacity = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)