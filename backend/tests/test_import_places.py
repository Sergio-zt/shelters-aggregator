from sqlalchemy import select
from sqlalchemy.orm import selectinload

from backend.app.models.places import District, Facility, Place
from backend.scripts.import_places import (
    import_places,
    parse_comfort_index,
    read_csv,
)

# Header like in the analyst file: "сomfort index" and "сapacity Tier"
# start with the Ukrainian letter "с" (с)
HEADER = (
    "shelter_id,name,category_shelters,district,address,wifi,power,pets,"
    "availability,ramp,24/7 Access,WC,operating hours,сomfort index,"
    "сapacity Tier,latitude,longitude"
)


def make_row(**changes):
    row = {
        "shelter_id": "M01",
        "name": "Станція метро Академмістечко",
        "category_shelters": "метро",
        "district": "Святошинський",
        "address": "просп. Академіка Палладіна, 25",
        "wifi": "TRUE",
        "power": "TRUE",
        "pets": "FALSE",
        "availability": "FALSE",
        "ramp": "FALSE",
        "24/7 access": "FALSE",
        "wc": "TRUE",
        "operating hours": "05:30 - 23:20",
        "comfort index": "3/7",
        "capacity tier": "Висока місткість (>1000 осіб)",
        "latitude": "50,4672844",
        "longitude": "30,3541236",
    }
    row.update(changes)
    return row


async def get_places(db_session):
    result = await db_session.scalars(
        select(Place).options(selectinload(Place.facilities))
    )
    return result.all()


def test_parse_comfort_index():
    assert parse_comfort_index("6/7") == 6
    assert parse_comfort_index("Немає зручностей") == 0


def test_read_csv(tmp_path):
    file = tmp_path / "shelters.csv"
    line = (
        'M01,Метро,метро,Святошинський,"вул. Тестова, 1",TRUE,TRUE,TRUE,'
        'TRUE,FALSE,TRUE,TRUE,24/7,6/7,Висока,"50,46","30,35"'
    )
    file.write_text(HEADER + "\n" + line + "\n", encoding="utf-8")

    rows = read_csv(file)

    assert len(rows) == 1
    # Header names are cleaned: lower case and English "c"
    assert rows[0]["comfort index"] == "6/7"
    assert rows[0]["capacity tier"] == "Висока"
    assert rows[0]["address"] == "вул. Тестова, 1"


async def test_import_place(db_session):
    added, updated, skipped = await import_places(db_session, [make_row()])

    assert (added, updated, skipped) == (1, 0, 0)
    places = await get_places(db_session)
    assert len(places) == 1
    place = places[0]
    assert place.external_id == "M01"
    assert place.name == {"uk": "Станція метро Академмістечко"}
    assert place.type == {"uk": "метро"}
    assert place.address == {"uk": "просп. Академіка Палладіна, 25"}
    assert place.operating_hours == {"uk": "05:30 - 23:20"}
    assert place.comfort_index == 3
    assert place.capacity_tier == {"uk": "Висока місткість (>1000 осіб)"}
    assert place.latitude == 50.4672844
    assert place.longitude == 30.3541236
    icons = sorted(facility.icon_name for facility in place.facilities)
    assert icons == ["electricity", "toilet", "wifi"]


async def test_import_creates_district(db_session):
    await import_places(db_session, [make_row()])

    places = await get_places(db_session)
    district = await db_session.get(District, places[0].district_id)
    assert district.name == {"uk": "Святошинський"}


async def test_import_creates_all_facilities(db_session):
    await import_places(db_session, [make_row()])

    result = await db_session.scalars(select(Facility))
    assert len(result.all()) == 7


async def test_import_reuses_district(db_session):
    rows = [make_row(shelter_id="M01"), make_row(shelter_id="M02")]

    await import_places(db_session, rows)

    result = await db_session.scalars(select(District))
    assert len(result.all()) == 1


async def test_import_twice_updates_place(db_session):
    await import_places(db_session, [make_row()])
    # The analyst fixed the data: no wifi anymore
    new_row = make_row(wifi="FALSE")
    new_row["comfort index"] = "2/7"

    added, updated, skipped = await import_places(db_session, [new_row])

    assert (added, updated, skipped) == (0, 1, 0)
    places = await get_places(db_session)
    assert len(places) == 1
    assert places[0].comfort_index == 2
    icons = sorted(facility.icon_name for facility in places[0].facilities)
    assert icons == ["electricity", "toilet"]


async def test_import_skips_row_without_coordinates(db_session):
    rows = [
        make_row(shelter_id="M01"),
        make_row(
            shelter_id="M02",
            latitude="Інформація відсутня",
            longitude="Інформація відсутня",
        ),
    ]

    added, updated, skipped = await import_places(db_session, rows)

    assert (added, updated, skipped) == (1, 0, 1)
    places = await get_places(db_session)
    assert [place.external_id for place in places] == ["M01"]


async def test_import_skips_place_outside_kyiv(db_session):
    # This address was found in Bila Tserkva instead of Kyiv
    row = make_row(latitude="49,7983831", longitude="30,11")

    added, updated, skipped = await import_places(db_session, [row])

    assert (added, updated, skipped) == (0, 0, 1)
    assert await get_places(db_session) == []
