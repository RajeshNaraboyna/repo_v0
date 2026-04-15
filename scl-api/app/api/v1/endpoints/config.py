"""School configuration endpoint – serves canonical class & section lists."""

from fastapi import APIRouter

from app.schemas.config import SchoolConfigResponse

router = APIRouter()

# ── Canonical data ─────────────────────────────────────────────
# Single source of truth for class / grade / section names.
# In the future this could be read from a DB table; for now it's
# kept in code so every screen is guaranteed the same values.

GRADES = [
    "Nursery", "LKG", "UKG",
    "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
    "Class 6", "Class 7", "Class 8", "Class 9", "Class 10",
    "Class 11", "Class 12",
]

# "classes" is the subset typically used for admitted students
# (excludes pre-primary for pages like Add Student / Exams).
CLASSES = [g for g in GRADES if g.startswith("Class ")]

SECTIONS = ["A", "B", "C", "D", "E"]


@router.get("", response_model=SchoolConfigResponse)
async def get_school_config():
    """Return the canonical list of grades, classes and sections."""
    return SchoolConfigResponse(
        grades=GRADES,
        classes=CLASSES,
        sections=SECTIONS,
    )
