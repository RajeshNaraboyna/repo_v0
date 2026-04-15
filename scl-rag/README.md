# SCL RAG Service

A Retrieval-Augmented Generation (RAG) service for the School Management System. Indexes student results (marks, grades, exam data) into a vector store for semantic search and retrieval.

## Architecture

Built following the pattern of the `sample-knowledge` service:

- **FastAPI** backend on port `4003`
- **ChromaDB** (embedded) for vector storage — no external services needed
- **sentence-transformers** (`all-MiniLM-L6-v2`) for text embeddings

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/index/student-results` | Index a student's results into the vector store |
| POST | `/api/v1/query` | Query the indexed student results |
| GET | `/api/v1/index/stats` | Get collection statistics |
| DELETE | `/api/v1/index/student/{student_id}` | Remove a student's indexed data |
| GET | `/health` | Health check |

## Setup

```bash
cd scl-rag
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -e .
```

## Run

```bash
uvicorn app.main:app --host 0.0.0.0 --port 4003 --reload
```

## Data Indexed

Each student result is converted to a rich text document containing:
- Student ID, name, class
- Exam name, type, academic year
- Subject, marks obtained, max marks, grade
- PDF attachment status
- Timestamps
