FROM python:3.14-slim

WORKDIR /app

RUN pip install --no-cache-dir poetry

COPY pyproject.toml poetry.lock ./

# Set INSTALL_DEV=true to also install dev tools (pytest, black, flake8)
ARG INSTALL_DEV=false

RUN poetry config virtualenvs.create false \
    && if [ "$INSTALL_DEV" = "true" ]; then \
        poetry install --with dev --no-root --no-interaction --no-ansi; \
    else \
        poetry install --only main --no-root --no-interaction --no-ansi; \
    fi

COPY . /app/backend

EXPOSE 8000

CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
