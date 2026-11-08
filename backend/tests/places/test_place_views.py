import uuid

from sqlalchemy import select

from backend.app.models.places import Place, PlaceView


async def get_all_views(db_session):
    result = await db_session.scalars(select(PlaceView))
    return result.all()


async def test_save_place_view(client, db_session):
    place = Place(latitude=50.44, longitude=30.49)
    db_session.add(place)
    await db_session.commit()

    response = await client.post(f"/places/{place.id}/views")

    assert response.status_code == 201
    views = await get_all_views(db_session)
    assert len(views) == 1
    assert views[0].place_id == place.id
    assert views[0].viewed_at is not None
    # No cookie, so we don't know the visitor
    assert views[0].visitor_id is None


async def test_save_place_view_twice(client, db_session):
    place = Place(latitude=50.44, longitude=30.49)
    db_session.add(place)
    await db_session.commit()

    await client.post(f"/places/{place.id}/views")
    await client.post(f"/places/{place.id}/views")

    views = await get_all_views(db_session)
    assert len(views) == 2


async def test_place_view_saves_visitor_from_cookie(client, db_session):
    place = Place(latitude=50.44, longitude=30.49)
    db_session.add(place)
    await db_session.commit()
    visitor_id = uuid.uuid4()
    client.cookies.set("visitor_id", str(visitor_id))

    await client.post(f"/places/{place.id}/views")

    views = await get_all_views(db_session)
    assert views[0].visitor_id == visitor_id


async def test_place_view_ignores_bad_cookie(client, db_session):
    place = Place(latitude=50.44, longitude=30.49)
    db_session.add(place)
    await db_session.commit()
    client.cookies.set("visitor_id", "not-a-uuid")

    response = await client.post(f"/places/{place.id}/views")

    assert response.status_code == 201
    views = await get_all_views(db_session)
    assert views[0].visitor_id is None


async def test_place_view_for_missing_place(client, db_session):
    response = await client.post("/places/999/views")

    assert response.status_code == 404
    views = await get_all_views(db_session)
    assert len(views) == 0
