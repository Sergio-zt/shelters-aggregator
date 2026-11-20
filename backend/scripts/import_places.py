"""Import shelters from the analyst CSV file into the database.

Put the file in the "backend" folder and run inside Docker:
    docker compose exec backend python -m backend.scripts.import_places
    backend/shelters_final_version.csv

The script can be run many times: places are found by "shelter_id",
so a second run updates them instead of creating duplicates.
"""

import asyncio
import csv
import sys

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from backend.app.db.database import SessionLocal
from backend.app.models.places import City, District, Facility, Place

CITY_NAME = {"uk": "Київ", "en": "Kyiv"}

# Kyiv borders (approximately). The analyst got coordinates by address,
# and some addresses were found in other cities with the same street name
MIN_LATITUDE, MAX_LATITUDE = 50.2, 50.6
MIN_LONGITUDE, MAX_LONGITUDE = 30.2, 30.9

# Facility columns in the file: column -> (icon_name, name)
FACILITY_COLUMNS = {
    "wifi": ("wifi", {"uk": "Wi-Fi", "en": "Wi-Fi"}),
    "power": ("electricity", {"uk": "Електрика", "en": "Electricity"}),
    "pets": ("pets", {"uk": "Можна з тваринами", "en": "Pets allowed"}),
    "availability": ("availability", {"uk": "Доступність", "en": "Availability"}),
    "ramp": ("ramp", {"uk": "Пандус", "en": "Ramp"}),
    "24/7 access": ("open_24_7", {"uk": "Цілодобово", "en": "Open 24/7"}),
    "wc": ("toilet", {"uk": "Туалет", "en": "Toilet"}),
}


def clean_header(header):
    """Make column names easy to compare.

    In the file some names start with the Ukrainian letter "с" instead of
    the English "c" ("сomfort index"). They look the same but are different
    letters, so we replace it ("с" is the Ukrainian "с").
    """
    return header.strip().lower().replace("с", "c")


def read_csv(path):
    """Read the CSV file and return a list of rows (dicts)."""
    with open(path, encoding="utf-8", newline="") as file:
        reader = csv.DictReader(file)
        rows = []
        for row in reader:
            rows.append({clean_header(key): value for key, value in row.items()})
        return rows


def parse_coordinate(value):
    """Turn "50,4672844" or "50.4672844" into a number.

    Raises ValueError if there is no number (e.g. "Інформація відсутня").
    """
    return float(value.strip().replace(",", "."))


def parse_comfort_index(value):
    """Turn "6/7" into 6. "Немає зручностей" means 0."""
    value = value.strip()
    if "/" not in value:
        return 0
    return int(value.split("/")[0])


def parse_row(row):
    """Check one row and return clean data, or raise ValueError."""
    shelter_id = row["shelter_id"].strip()
    if not shelter_id:
        raise ValueError("no shelter_id")

    try:
        latitude = parse_coordinate(row["latitude"])
        longitude = parse_coordinate(row["longitude"])
    except ValueError:
        raise ValueError("no coordinates")

    if not (MIN_LATITUDE <= latitude <= MAX_LATITUDE) or not (
        MIN_LONGITUDE <= longitude <= MAX_LONGITUDE
    ):
        raise ValueError(f"coordinates are not in Kyiv ({latitude}, {longitude})")

    # Columns with TRUE are the facilities this place has
    facilities = []
    for column in FACILITY_COLUMNS:
        if row[column].strip().upper() == "TRUE":
            facilities.append(column)

    return {
        "external_id": shelter_id,
        "name": {"uk": row["name"].strip()},
        "type": {"uk": row["category_shelters"].strip()},
        "district": row["district"].strip(),
        "address": {"uk": row["address"].strip()},
        "operating_hours": {"uk": row["operating hours"].strip()},
        "comfort_index": parse_comfort_index(row["comfort index"]),
        "capacity_tier": {"uk": row["capacity tier"].strip()},
        "latitude": latitude,
        "longitude": longitude,
        "facilities": facilities,
    }


async def get_or_create_city(db):
    result = await db.scalars(
        select(City).where(City.name["uk"].astext == CITY_NAME["uk"])
    )
    city = result.first()
    if city is None:
        city = City(name=CITY_NAME)
        db.add(city)
        await db.flush()
    return city


async def get_or_create_district(db, city, name):
    result = await db.scalars(
        select(District).where(
            District.city_id == city.id, District.name["uk"].astext == name
        )
    )
    district = result.first()
    if district is None:
        district = District(city_id=city.id, name={"uk": name})
        db.add(district)
        await db.flush()
    return district


async def get_or_create_facility(db, icon_name, name):
    result = await db.scalars(select(Facility).where(Facility.icon_name == icon_name))
    facility = result.first()
    if facility is None:
        facility = Facility(icon_name=icon_name, name=name)
        db.add(facility)
        await db.flush()
    return facility


async def import_places(db, rows):
    """Save rows to the database. Returns how many were added/updated/skipped."""
    city = await get_or_create_city(db)

    facilities = {}
    for column, (icon_name, name) in FACILITY_COLUMNS.items():
        facilities[column] = await get_or_create_facility(db, icon_name, name)

    # Load places that are already in the database, to update them.
    # selectinload loads facilities at once, otherwise async SQLAlchemy
    # can't load them later when we change the list
    result = await db.scalars(
        select(Place)
        .where(Place.external_id.is_not(None))
        .options(selectinload(Place.facilities))
    )
    places = {place.external_id: place for place in result}

    # Remember districts so we don't ask the database for every row
    districts = {}

    added = 0
    updated = 0
    skipped = 0

    for row in rows:
        try:
            data = parse_row(row)
        except (ValueError, KeyError) as error:
            print(f"Skipped {row.get('shelter_id', '?')}: {error}")
            skipped += 1
            continue

        district_name = data["district"]
        if district_name not in districts:
            districts[district_name] = await get_or_create_district(
                db, city, district_name
            )

        place = places.get(data["external_id"])
        if place is None:
            place = Place(external_id=data["external_id"], facilities=[])
            db.add(place)
            places[data["external_id"]] = place
            added += 1
        else:
            updated += 1

        place.district_id = districts[district_name].id
        place.name = data["name"]
        place.type = data["type"]
        place.address = data["address"]
        place.operating_hours = data["operating_hours"]
        place.comfort_index = data["comfort_index"]
        place.capacity_tier = data["capacity_tier"]
        place.latitude = data["latitude"]
        place.longitude = data["longitude"]
        place.facilities = [facilities[column] for column in data["facilities"]]

    # One commit at the end: if something breaks, nothing is half-saved
    await db.commit()
    return added, updated, skipped


async def main(path):
    rows = read_csv(path)
    async with SessionLocal() as db:
        added, updated, skipped = await import_places(db, rows)
    print(f"Done. Added: {added}, updated: {updated}, skipped: {skipped}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python -m backend.scripts.import_places <file.csv>")
        sys.exit(1)
    asyncio.run(main(sys.argv[1]))
