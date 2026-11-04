from fastapi import FastAPI

from backend.app.api.places import router as places_router
from backend.app.api.visitors import router as visitor_router

app = FastAPI(
    title="Shelters Aggregator API",
    version="0.1.0",
)

app.include_router(visitor_router)
app.include_router(places_router)


@app.get("/health")
async def health_check():
    return {"status": "ok"}
