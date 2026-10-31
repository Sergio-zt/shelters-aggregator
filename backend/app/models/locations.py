from sqlalchemy import Column, Integer, Float, String
from app.db.database import Base

class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    
    # Coordinates for the map
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    
    # Optional fields based on your previous tasks
    address = Column(String, nullable=True)
    description = Column(String, nullable=True)