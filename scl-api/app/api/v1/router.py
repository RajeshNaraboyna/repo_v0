"""API v1 Router Configuration."""

from fastapi import APIRouter

from app.api.v1.endpoints import auth, admissions, students, question_papers, exams, results, config

api_router = APIRouter()

api_router.include_router(config.router, prefix="/config", tags=["Configuration"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(admissions.router, prefix="/admissions", tags=["Admissions"])
api_router.include_router(students.router, prefix="/students", tags=["Students"])
api_router.include_router(question_papers.router, prefix="/question-papers", tags=["Question Papers"])
api_router.include_router(exams.router, prefix="/exams", tags=["Exams"])
api_router.include_router(results.router, prefix="/results", tags=["Results"])
