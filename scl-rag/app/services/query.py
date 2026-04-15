"""Query service — semantic search over indexed student results.

Uses Milvus for scalable vector similarity search.
"""

import logging
from typing import Optional, List

from app.schemas import QueryRequest, QueryResponse, QueryResultItem
from app.services.vectordb import query_documents

logger = logging.getLogger(__name__)


def query_student_results(req: QueryRequest) -> QueryResponse:
    """Query the indexed student results with semantic search.

    Supports optional filtering by student_id, class_name, or exam_id.
    """
    # Build Milvus boolean expression filter
    where_expr = _build_milvus_expr(
        student_id=req.student_id,
        class_name=req.class_name,
        exam_id=req.exam_id,
    )

    results = query_documents(
        query_text=req.query,
        n_results=req.n_results,
        where=where_expr,
    )

    # Transform Milvus results into response
    items: List[QueryResultItem] = []
    if results["documents"] and results["documents"][0]:
        docs = results["documents"][0]
        metas = results["metadatas"][0] if results["metadatas"] else [{}] * len(docs)
        dists = results["distances"][0] if results["distances"] else [None] * len(docs)

        for doc, meta, dist in zip(docs, metas, dists):
            items.append(
                QueryResultItem(
                    document=doc,
                    metadata=meta or {},
                    distance=dist,
                )
            )

    logger.info(f"Query '{req.query}' returned {len(items)} results")

    return QueryResponse(
        query=req.query,
        results=items,
        total_results=len(items),
    )


def _build_milvus_expr(
    student_id: Optional[str] = None,
    class_name: Optional[str] = None,
    exam_id: Optional[int] = None,
) -> Optional[str]:
    """Build a Milvus boolean filter expression from optional parameters."""
    conditions: List[str] = []

    if student_id:
        conditions.append(f'student_id == "{student_id}"')
    if class_name:
        conditions.append(f'class_name == "{class_name}"')
    if exam_id:
        conditions.append(f'exam_id == {exam_id}')

    if not conditions:
        return None
    return " && ".join(conditions)
