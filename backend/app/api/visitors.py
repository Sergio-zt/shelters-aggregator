import uuid

from fastapi import APIRouter, Cookie, Response

router = APIRouter()


@router.get(
    "/visitor",
    tags=["visitor"],
    summary="Get anonymous visitor UUID",
    description=(
        "Returns the anonymous visitor UUID. "
        "If the visitor_id cookie is missing, a new UUID is generated "
        "and stored in a response cookie. "
        "If the cookie already exists, its value is reused."
    ),
)
async def visitor(response: Response, visitor_id: str | None = Cookie(default=None)):
    if visitor_id is not None:
        try:
            uuid.UUID(visitor_id)
        except ValueError:
            visitor_id = None

    if visitor_id is None:
        visitor_id = str(uuid.uuid4())
        response.set_cookie(
            key="visitor_id",
            value=visitor_id,
            httponly=True,
            samesite="lax",
        )

    return {"visitor_id": visitor_id}
