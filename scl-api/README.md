# School Management System API

Backend API for the School Management System.

## Features

- User Authentication (Login/Guest Access)
- Student Admission Requests
- Admin Dashboard APIs

## Setup

### Prerequisites

- Python 3.11+
- [uv](https://docs.astral.sh/uv/) (recommended) or pip
- PostgreSQL (or SQLite for development)

### Installation

```bash
# Using uv (recommended)
uv sync

# Or using pip
pip install -e ".[dev]"
```

### Running the Application

```bash
# Using uv
uv run uvicorn app.main:app --reload --port 4002

# Or if using pip/venv
uvicorn app.main:app --reload --port 4002
```

### API Documentation

Once running, visit:
- Swagger UI: http://localhost:4002/docs
- ReDoc: http://localhost:4002/redoc

## Project Structure

```
scl-api/
├── app/
│   ├── api/v1/endpoints/    # API route handlers
│   ├── auth/                # Authentication logic
│   ├── core/                # Core configurations
│   ├── db/                  # Database models and sessions
│   ├── schemas/             # Pydantic schemas
│   └── services/            # Business logic
├── alembic/                 # Database migrations
├── tests/                   # Test files
└── pyproject.toml           # Project configuration
```
