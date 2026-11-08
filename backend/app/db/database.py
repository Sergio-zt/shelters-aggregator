import os

from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base

load_dotenv()

# Database URL comes from the .env file (passed by Docker Compose)
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# Create an asynchronous database engine
engine = create_async_engine(SQLALCHEMY_DATABASE_URL, pool_pre_ping=True)

# Create a factory for asynchronous database sessions
SessionLocal = async_sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False,
    class_=AsyncSession,
)

# Base class for declarative models
Base = declarative_base()


# Provide a database session for each request
async def get_db():
    async with SessionLocal() as db:
        yield db
