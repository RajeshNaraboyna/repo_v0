"""Analytics service — structured querying and aggregation over indexed student results.

Supports both semantic search (Milvus vector similarity) and
structured filtering (scalar metadata queries) with aggregation.
"""

import logging
import math
import re
from typing import Optional, List

from app.schemas import (
    AnalyticsQueryRequest,
    AnalyticsQueryResponse,
    AnalyticsResultItem,
    AnalyticsSummary,
    AnalyticsFiltersResponse,
)
from app.services.vectordb import (
    query_documents,
    query_all_documents,
    get_distinct_values,
)

logger = logging.getLogger(__name__)


def _build_filter_expr(req: AnalyticsQueryRequest) -> Optional[str]:
    """Build a Milvus boolean expression from analytics filters."""
    conditions: List[str] = []

    if req.student_id:
        conditions.append(f'student_id == "{req.student_id}"')
    if req.student_name:
        # Milvus VARCHAR field supports `like` operator
        conditions.append(f'student_name like "%{req.student_name}%"')
    if req.class_name:
        conditions.append(f'class_name == "{req.class_name}"')
    if req.subject:
        conditions.append(f'subject like "%{req.subject}%"')
    if req.exam_id is not None:
        conditions.append(f"exam_id == {req.exam_id}")
    if req.exam_type:
        conditions.append(f'exam_type == "{req.exam_type}"')
    if req.academic_year:
        conditions.append(f'academic_year == "{req.academic_year}"')

    if not conditions:
        return None
    return " && ".join(conditions)


def _parse_marks_from_document(doc: str) -> Optional[float]:
    """Extract marks_obtained from the document text."""
    match = re.search(r"Marks:\s*([\d.]+)\s*out of", doc)
    if match:
        try:
            return float(match.group(1))
        except ValueError:
            return None
    return None


def _parse_grade_from_document(doc: str) -> Optional[str]:
    """Extract grade from the document text."""
    match = re.search(r"Grade:\s*([A-Za-z+\-]+)\.", doc)
    if match:
        val = match.group(1)
        if val.lower() != "not graded":
            return val
    return None


def _to_analytics_item(meta: dict, doc: str = "", distance: Optional[float] = None) -> AnalyticsResultItem:
    """Convert a Milvus result into an AnalyticsResultItem."""
    marks_obtained = _parse_marks_from_document(doc) if doc else None
    max_marks = meta.get("max_marks", 100)
    percentage = None
    if marks_obtained is not None and max_marks and max_marks > 0:
        percentage = round((marks_obtained / max_marks) * 100, 2)

    grade = _parse_grade_from_document(doc) if doc else None

    return AnalyticsResultItem(
        result_id=meta.get("result_id", 0),
        student_id=meta.get("student_id", ""),
        student_name=meta.get("student_name", ""),
        class_name=meta.get("class_name", ""),
        exam_id=meta.get("exam_id", 0),
        exam_name=meta.get("exam_name", ""),
        exam_type=meta.get("exam_type", ""),
        academic_year=meta.get("academic_year", ""),
        subject=meta.get("subject", ""),
        marks_obtained=marks_obtained,
        max_marks=max_marks,
        percentage=percentage,
        grade=grade,
        has_pdf=meta.get("has_pdf", False),
        relevance_score=round(1.0 / (1.0 + distance), 4) if distance is not None else None,
        document=doc if doc else None,
    )


def _compute_summary(items: List[AnalyticsResultItem]) -> AnalyticsSummary:
    """Compute aggregated statistics from result items."""
    if not items:
        return AnalyticsSummary(
            total_records=0,
            unique_students=0,
            unique_subjects=0,
            unique_exams=0,
        )

    students = set()
    subjects = set()
    exams = set()
    percentages = []
    grade_dist: dict = {}
    subject_marks: dict = {}
    class_marks: dict = {}

    for item in items:
        students.add(item.student_id)
        subjects.add(item.subject)
        exams.add(item.exam_id)

        if item.percentage is not None:
            percentages.append(item.percentage)

            # Subject averages
            subject_marks.setdefault(item.subject, []).append(item.percentage)
            # Class averages
            class_marks.setdefault(item.class_name, []).append(item.percentage)

        if item.grade:
            grade_dist[item.grade] = grade_dist.get(item.grade, 0) + 1

    subject_averages = {
        s: round(sum(vals) / len(vals), 2)
        for s, vals in subject_marks.items()
    }
    class_averages = {
        c: round(sum(vals) / len(vals), 2)
        for c, vals in class_marks.items()
    }

    return AnalyticsSummary(
        total_records=len(items),
        unique_students=len(students),
        unique_subjects=len(subjects),
        unique_exams=len(exams),
        average_percentage=round(sum(percentages) / len(percentages), 2) if percentages else None,
        highest_percentage=max(percentages) if percentages else None,
        lowest_percentage=min(percentages) if percentages else None,
        grade_distribution=grade_dist,
        subject_averages=subject_averages,
        class_averages=class_averages,
    )


def _apply_post_filters(items: List[AnalyticsResultItem], req: AnalyticsQueryRequest) -> List[AnalyticsResultItem]:
    """Apply filters that can't be expressed in Milvus (marks range, grade)."""
    filtered = items
    if req.min_marks is not None:
        filtered = [i for i in filtered if i.marks_obtained is not None and i.marks_obtained >= req.min_marks]
    if req.max_marks_filter is not None:
        filtered = [i for i in filtered if i.marks_obtained is not None and i.marks_obtained <= req.max_marks_filter]
    if req.grade:
        filtered = [i for i in filtered if i.grade and i.grade.lower() == req.grade.lower()]
    return filtered


def _sort_items(items: List[AnalyticsResultItem], sort_by: str) -> List[AnalyticsResultItem]:
    """Sort items by the requested field."""
    if sort_by == "marks_asc":
        return sorted(items, key=lambda i: (i.marks_obtained is None, i.marks_obtained or 0))
    elif sort_by == "marks_desc":
        return sorted(items, key=lambda i: (i.marks_obtained is None, -(i.marks_obtained or 0)))
    elif sort_by == "student_name":
        return sorted(items, key=lambda i: i.student_name.lower())
    elif sort_by == "subject":
        return sorted(items, key=lambda i: i.subject.lower())
    # "relevance" — keep original order (by distance for semantic, insertion order for scalar)
    return items


def run_analytics_query(req: AnalyticsQueryRequest) -> AnalyticsQueryResponse:
    """Execute an analytics query with combined semantic + structured filtering.

    If a free-text query is provided, we do a semantic (vector) search.
    Otherwise, we use scalar-only filtering for exact lookups.
    """
    filter_expr = _build_filter_expr(req)

    if req.query.strip():
        # Semantic search path
        raw = query_documents(
            query_text=req.query,
            n_results=min(req.page * req.page_size + 200, 1000),  # fetch extra for post-filter
            where=filter_expr,
        )
        docs = raw["documents"][0] if raw["documents"] and raw["documents"][0] else []
        metas = raw["metadatas"][0] if raw["metadatas"] else []
        dists = raw["distances"][0] if raw["distances"] else []

        items = [
            _to_analytics_item(meta, doc, dist)
            for doc, meta, dist in zip(docs, metas, dists)
        ]
    else:
        # Scalar-only path — no vector search
        rows = query_all_documents(where=filter_expr or "result_id > 0")
        items = [
            _to_analytics_item(
                meta=row,
                doc=row.get("document", ""),
            )
            for row in rows
        ]

    # Post-filters (marks range, grade)
    items = _apply_post_filters(items, req)

    # Compute summary before pagination
    summary = _compute_summary(items)

    # Sort
    items = _sort_items(items, req.sort_by)

    # Paginate
    total = len(items)
    total_pages = max(1, math.ceil(total / req.page_size))
    start = (req.page - 1) * req.page_size
    end = start + req.page_size
    page_items = items[start:end]

    # Collect KB document texts (top N unique, non-empty)
    kb_documents: list[str] = []
    seen_docs: set[str] = set()
    for item in items:
        if item.document and item.document not in seen_docs:
            kb_documents.append(item.document)
            seen_docs.add(item.document)
        if len(kb_documents) >= 10:
            break

    logger.info(
        f"Analytics query returned {total} results "
        f"(page {req.page}/{total_pages}, query='{req.query[:50]}')"
    )

    return AnalyticsQueryResponse(
        results=page_items,
        summary=summary,
        total_results=total,
        page=req.page,
        page_size=req.page_size,
        total_pages=total_pages,
        kb_documents=kb_documents,
    )


def get_analytics_filters() -> AnalyticsFiltersResponse:
    """Return available filter values for the analytics UI."""
    try:
        return AnalyticsFiltersResponse(
            classes=get_distinct_values("class_name"),
            subjects=get_distinct_values("subject"),
            exam_types=get_distinct_values("exam_type"),
            academic_years=get_distinct_values("academic_year"),
            grades=[],  # Grades are parsed from doc text, not a direct Milvus field
        )
    except Exception as e:
        logger.warning(f"Failed to fetch analytics filters: {e}")
        return AnalyticsFiltersResponse()
