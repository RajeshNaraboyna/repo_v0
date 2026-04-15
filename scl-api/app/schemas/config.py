"""Pydantic schemas for school configuration."""

from typing import List
from pydantic import BaseModel


class SchoolConfigResponse(BaseModel):
    """Canonical list of classes and sections used across the application."""
    grades: List[str]
    classes: List[str]
    sections: List[str]
