# School Management System

A full-stack application for school admission management with user authentication and guest access.

## Architecture

This project follows a monorepo structure with separate backend and frontend modules:

```
scl-mgmt/
├── scl-api/         # FastAPI backend
└── scl-frontend/    # React frontend
```

## Features

### Authentication
- **User Login**: Admin and staff can log in with credentials
- **Guest Access**: Anyone can submit admission requests without registration
- JWT-based authentication with secure token management

### Student Admissions
- Multi-step admission request form
- Student information, contact details, and guardian information
- Application tracking with unique IDs
- Status checking without login

### Admin Dashboard
- View all admission requests
- Filter by status and grade
- Update application status

## Tech Stack

### Backend (scl-api)
- **Framework**: FastAPI (Python 3.11+)
- **Authentication**: JWT with python-jose
- **Validation**: Pydantic v2
- **Database**: SQLAlchemy (SQLite for dev, PostgreSQL for production)

### Frontend (scl-frontend)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query + React Context
- **Forms**: React Hook Form with Zod validation
- **Routing**: React Router v6

## Quick Start

### Using Task (Recommended)

Install [Task](https://taskfile.dev/installation/) and [uv](https://docs.astral.sh/uv/), then run:

```bash
# Start both services (syncs dependencies automatically)
task dev
```

### Manual Setup

#### Backend

```bash
cd scl-api

# Sync dependencies with uv
uv sync

# Run server
uv run uvicorn app.main:app --reload --port 4002
```

### Frontend

```bash
cd scl-frontend

# Install dependencies
npm install

# Copy environment file
copy .env.example .env

# Run development server
npm run dev
```

## Demo Credentials

- **Admin**: admin@school.local / admin123
- **Staff**: staff@school.local / staff123
- **Guest**: No login required

## Task Commands

| Command | Description |
|---------|-------------|
| `task dev` | Sync dependencies & start both services |
| `task dev:api` | Start API only (port 4002) |
| `task dev:ui` | Start UI only (port 4001) |
| `task sync` | Sync all dependencies (uv sync + npm install) |
| `task setup` | Initial setup for both API and UI |
| `task build` | Build for production |
| `task test` | Run all tests |
| `task lint` | Lint all code |
| `task clean` | Clean build artifacts |

## API Documentation

Once the backend is running:
- Swagger UI: http://localhost:4002/docs
- ReDoc: http://localhost:4002/redoc

## Project Structure Reference

This project structure is inspired by the aviator-studio-ai architecture, following similar patterns for:
- API versioning (v1)
- Service layer separation
- Pydantic schemas
- Component-based UI architecture
- Configuration management


Demo credentials: admin@school.local / admin123