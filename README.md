# Shelters Aggregator

Full-stack web application for aggregating shelters and safe spaces.

## Import shelters data

The analyst gives us a CSV file with shelters (it is not stored in git).
Put it in the `backend` folder and run (Docker must be running):

```bash
docker compose exec backend python -m backend.scripts.import_places backend/shelters_final_version.csv
```

The script can be run again with a new file: places are matched by
`shelter_id`, so they are updated, not duplicated.
Rows without coordinates or with coordinates outside Kyiv are skipped
and printed in the console.
