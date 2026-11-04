import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Database URL comes from the .env file (passed by Docker Compose)
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# Initialize the SQLAlchemy engine
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Create a sessionmaker for database transactions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for declarative models
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
