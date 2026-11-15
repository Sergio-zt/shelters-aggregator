from sqlalchemy import (
    Column,
    Integer,
    ForeignKey,
    UUID,
    String,
    DateTime,
    func,
    CheckConstraint,
)
from sqlalchemy.orm import relationship

from backend.app.db.database import Base


class Review(Base):
    __tablename__ = "reviews"

    __table_args__ = (
        CheckConstraint("rating >= 1 AND rating <= 5", name="check_review_rating"),
    )

    id = Column(Integer, primary_key=True, index=True)

    place_id = Column(
        Integer,
        ForeignKey("places.id", ondelete="CASCADE"),
        nullable=True,
    )
    visitor_id = Column(UUID, nullable=False)

    author_name = Column(String, nullable=False)
    rating = Column(Integer, nullable=False)
    text = Column(String, nullable=False)
    created_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    place = relationship("Place", back_populates="reviews")
