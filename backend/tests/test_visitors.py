import uuid

from starlette.testclient import TestClient

from backend.app.main import app

client = TestClient(app)


def test_visitor_generates_uuid_when_cookie_missing():
    response = client.get("/visitor")

    assert response.status_code == 200

    visitor_id = response.json()["visitor_id"]
    assert str(uuid.UUID(visitor_id)) == visitor_id

    assert "visitor_id" in response.cookies


def test_visitor_reuses_existing_valid_cookie():
    existing_uuid = str(uuid.uuid4())

    response = client.get(
        "/visitor",
        cookies={"visitor_id": existing_uuid},
    )

    assert response.status_code == 200
    assert response.json()["visitor_id"] == existing_uuid


def test_visitor_generates_new_uuid_when_cookie_invalid():
    response = client.get(
        "/visitor",
        cookies={"visitor_id": "invalid-uuid"},
    )

    assert response.status_code == 200

    visitor_id = response.json()["visitor_id"]
    assert str(uuid.UUID(visitor_id)) == visitor_id
    assert visitor_id != "invalid-uuid"

    assert response.cookies["visitor_id"] == visitor_id
