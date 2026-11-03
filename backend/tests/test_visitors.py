import uuid

from starlette.testclient import TestClient

from backend.app.main import app

client = TestClient(app)


def test_visitor_generates_uuid_when_cookie_missing():
    # Clear cookies to ensure a clean state for this test
    client.cookies.clear()
    response = client.get("/visitor")

    assert response.status_code == 200

    visitor_id = response.json()["visitor_id"]
    assert str(uuid.UUID(visitor_id)) == visitor_id

    assert "visitor_id" in response.cookies


def test_visitor_reuses_existing_valid_cookie():
    existing_uuid = str(uuid.uuid4())

    # Set cookie directly on the client instance
    client.cookies = {"visitor_id": existing_uuid}
    response = client.get("/visitor")

    assert response.status_code == 200
    assert response.json()["visitor_id"] == existing_uuid


def test_visitor_generates_new_uuid_when_cookie_invalid():
    client.cookies.clear()
    client.cookies = {"visitor_id": "invalid-uuid"}
    
    response = client.get("/visitor")

    assert response.status_code == 200

    visitor_id = response.json()["visitor_id"]
    assert str(uuid.UUID(visitor_id)) == visitor_id
    assert visitor_id != "invalid-uuid"

    assert response.cookies.get("visitor_id") == visitor_id