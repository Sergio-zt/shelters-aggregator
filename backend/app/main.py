from fastapi import FastAPI
from fastapi.middleware.gzip import GZipMiddleware

from backend.app.api.filters import router as filters_router
from backend.app.api.places import router as places_router
from backend.app.api.visitors import router as visitor_router
from backend.app.api.reviews import router as review_router

app = FastAPI(
    title="Shelters Aggregator API",
    version="0.1.0",
)

app.add_middleware(GZipMiddleware, minimum_size=1000, compresslevel=5)

app.include_router(visitor_router)
app.include_router(places_router)
app.include_router(filters_router)
app.include_router(review_router)


@app.get("/health")
async def health_check():
    return {"status": "ok"}
