## Backend Development

The backend uses Poetry for dependency management. Run Poetry commands from the `backend` directory:

```cmd
cd backend
```

Install the project dependencies:

```cmd
poetry install
```

To run other Poetry commands, make sure you are in the `backend` directory.

## Linters and Formatters

Before running linters or formatters, navigate to the backend directory:

```cmd
cd backend
```

Examples:

```cmd
poetry run black .
poetry run flake8 .
poetry run pytest
```

## Environment Setup

Create a local `.env` file from the example:

```bash
copy .env.example .env
```

Review the environment variables in `.env` and update them if necessary.

**Do not commit `.env` to the repository.** It contains local configuration and may contain secrets. The `.env.example` file provides example values for other developers.

## Run the Project

Build and start the services in the background:

```bash
docker compose up --build -d
```

Check the status of the services:

```bash
docker compose ps
```

The following services are configured:

- **backend** — FastAPI application
- **db** — PostgreSQL database
- **test_db** — PostgreSQL database for tests

## API Documentation

Once the backend is running, open:

- **Swagger UI:** http://localhost:8000/docs
- **Health check:** http://localhost:8000/health

The health endpoint should return:

```json
{
  "status": "ok"
}
```

## Database Connection

The PostgreSQL database can be accessed using different connection settings depending on where the client runs.

| Setting | Backend container | Local machine (DBeaver/DataGrip) |
|---|---|---|
| Host | `db` | `localhost` |
| Port | `5432` | `5433` |

Use the following environment variables from `.env` to configure the database:

- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`

The backend connects to PostgreSQL using the Compose service hostname `db` and port `5432`. From the host machine, use `localhost:5433`.

A separate test database is exposed on port `5434` on the host machine.

## Stop the Project

Stop the running services:

```bash
docker compose down
```

The PostgreSQL data is stored in a named Docker volume and persists when containers are stopped or recreated.

## Anonymous Visitor

GET /visitor identifies anonymous visitors using a UUID.

Generates a UUID if the visitor_id cookie is missing or invalid.

Reuses the existing cookie if it contains a valid UUID.

Returns the UUID in the JSON response and stores it in an HttpOnly session cookie.