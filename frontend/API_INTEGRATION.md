# Frontend / backend integration

Current state: 2026-11-23. The HTTP transport connects to the repository FastAPI
backend. Mock remains the default for a fresh checkout; select HTTP locally.
The three records used for local verification are synthetic, not verified shelters.

## Start with the project Docker environment

From the repository root, create `.env` from `.env.example` if it does not exist,
then configure local values. Never commit credentials or overwrite an existing env.

```sh
docker compose up --build -d
docker compose exec backend sh -c "cd backend && alembic upgrade head"
```

Import the analyst CSV using the root README instructions. If the CSV was added
after building the image, copy it into the container first:

```sh
docker compose cp backend/shelters_final_version.csv backend:/app/backend/shelters_final_version.csv
docker compose exec backend python -m backend.scripts.import_places backend/shelters_final_version.csv
```

Check `/health`, `/places` and `/filters` at `http://127.0.0.1:8000`.
Health alone does not confirm database readiness. Swagger is at `/docs`.
An empty database legitimately returns no shelters.

In `frontend/.env.local`:

```dotenv
VITE_API_MODE=http
VITE_API_BASE_URL=/api
```

From `frontend`, use Node 22.12+:

```sh
npm ci
npm run dev -- --port 4173 --strictPort
```

Vite proxies `/api/*` to `http://127.0.0.1:8000/*`, removing the prefix and preserving
query parameters and cookies. Restart Vite after changing env. This proxy is for
development; production needs equivalent reverse-proxy routing or configured
cross-origin cookies/CORS. VITE variables are public and must contain no secrets.

## Current API contract

| Operation              | Route / behavior                                       |
| ---------------------- | ------------------------------------------------------ |
| Catalog and map points | GET /places                                            |
| Districts              | GET /filters → districts                               |
| Search                 | GET /places/search?q=...&limit=100&skip=...            |
| Detail panel           | GET /places/{id}                                       |
| Visitor cookie         | GET /visitor before form submissions                   |
| Website feedback       | POST /reviews                                          |
| Shelter feedback       | POST /places/{id}/reviews                              |
| Suggest shelter        | POST /suggestion                                       |
| Language               | Temporary localStorage preference; no backend endpoint |

Reviews send `{author_name, text}`, with limits 100/2000 characters. The shelter ID
is in the route. Suggestions send address, normalized type code, facilities and
details. Requests include credentials. Pending forms prevent duplicate clicks;
errors retain drafts. Failed requests, including 429, use the existing error/retry UI.
A client abort does not guarantee that a server-side write was cancelled.

Search follows pages until a partial page; cancellation stops further requests and
page errors reject partial results. Results are presented after the complete query.
For very large datasets, incremental UI pagination remains a possible improvement.
Search covers shelter addresses/types, not arbitrary street geocoding.

## Architecture and data

Components → cancellable hooks → AppApi → mock/http transport → DTO adapters.
`useShelterCatalog` loads catalog/districts; `usePlaceSearch` debounces and aborts old
queries; `useShelterDetails` fetches by ID with loading/error/retry; `useApiSubmit`
handles forms. Details reject mismatched IDs; filters reject malformed envelopes.

Adapters handle multilingual type, capacity_tier and operating_hours; district_id
with lookup or embedded district; facility objects with ID/name. Current facility
icon/filter mapping uses known Ukrainian/English aliases pending stable icon codes.
Unknown access remains unknown. Missing names use a neutral ID-based label.
Invalid coordinates and duplicate/missing IDs are rejected, with existing UI warnings.
GeoJSON uses [longitude, latitude]. MapLibre/OpenFreeMap and original pins remain.
Changing locale adapts cached records without refetching details or resetting camera.

Local UI dictionaries are `src/i18n/uk.json` and `en.json`. HTTP mode stores language
under `safeplace.language`; this is explicitly local, not a server preference.
Mock mode separately uses `safeplace.mock.preferences.v1`. Do not reintroduce requests
to placeholder /preferences, /districts, /shelters or /feedback routes.

## Verified and remaining work

Frontend checks cover transport, DTO normalization, translations and existing UI
logic. Run `npm run check` from frontend. Live local smoke checks verified catalog,
filters, search, details, missing IDs, visitor cookies, review and suggestion
persistence; the actual frontend transport also passed through Vite to PostgreSQL.
Multi-page search failure/cancellation is covered with controlled responses.

The live setup used host Python 3.13 and PostgreSQL 14 because Docker installation
was blocked by network failures. This differs from the declared Python 3.14 and
PostgreSQL 17 container environment, which still needs verification. Local env,
virtualenv, synthetic CSV and personal handoff files are not committed.
No new visual/motion/Lighthouse audit was performed for this integration.

Await backend clarification on access semantics, facility icon_name exposure,
missing catalog/detail names, language preferences and real analyst data.
The frontend currently filters facilities/area locally; /filters facility/type
options are not yet wired as a complete dynamic UI vocabulary. View analytics
POST /places/{id}/views is not connected yet. Production deployment is pending.
