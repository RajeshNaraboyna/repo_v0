"""Vector store service — Milvus-based vector storage for student results.

Uses pymilvus to connect to a Milvus instance for scalable vector search.
"""

import logging
from typing import Optional, List

from pymilvus import (
    connections,
    Collection,
    CollectionSchema,
    FieldSchema,
    DataType,
    utility,
)
from sentence_transformers import SentenceTransformer

from app.core import settings

logger = logging.getLogger(__name__)

# Module-level singletons
_collection: Optional[Collection] = None
_embedder: Optional[SentenceTransformer] = None
_connected: bool = False

# ── Schema constants ────────────────────────────────────────────
_MAX_DOC_LENGTH = 4096
_MAX_VARCHAR = 512


def _get_embedder() -> SentenceTransformer:
    """Lazy-load the sentence-transformer embedding model."""
    global _embedder
    if _embedder is None:
        logger.info(f"Loading embedding model: {settings.EMBEDDING_MODEL}")
        _embedder = SentenceTransformer(settings.EMBEDDING_MODEL)
    return _embedder


def _ensure_connection() -> None:
    """Ensure we have an active Milvus connection."""
    global _connected
    if not _connected:
        logger.info(
            f"Connecting to Milvus at {settings.MILVUS_HOST}:{settings.MILVUS_PORT}"
        )
        connections.connect(
            alias="default",
            host=settings.MILVUS_HOST,
            port=settings.MILVUS_PORT,
            db_name=settings.MILVUS_DB_NAME,
        )
        _connected = True


def _create_collection_schema() -> CollectionSchema:
    """Define the Milvus collection schema for student results."""
    fields = [
        FieldSchema(name="id", dtype=DataType.VARCHAR, is_primary=True, max_length=256),
        FieldSchema(name="document", dtype=DataType.VARCHAR, max_length=_MAX_DOC_LENGTH),
        FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=settings.EMBEDDING_DIMENSION),
        # Metadata fields for filtering
        FieldSchema(name="student_id", dtype=DataType.VARCHAR, max_length=128),
        FieldSchema(name="student_name", dtype=DataType.VARCHAR, max_length=256),
        FieldSchema(name="class_name", dtype=DataType.VARCHAR, max_length=128),
        FieldSchema(name="exam_id", dtype=DataType.INT64),
        FieldSchema(name="exam_name", dtype=DataType.VARCHAR, max_length=256),
        FieldSchema(name="exam_type", dtype=DataType.VARCHAR, max_length=128),
        FieldSchema(name="academic_year", dtype=DataType.VARCHAR, max_length=32),
        FieldSchema(name="subject", dtype=DataType.VARCHAR, max_length=256),
        FieldSchema(name="max_marks", dtype=DataType.FLOAT),
        FieldSchema(name="has_pdf", dtype=DataType.BOOL),
        FieldSchema(name="result_id", dtype=DataType.INT64),
    ]
    return CollectionSchema(fields=fields, description="Student exam results index")


def get_collection() -> Collection:
    """Get or create the student_results Milvus collection."""
    global _collection
    if _collection is None:
        _ensure_connection()
        col_name = settings.MILVUS_COLLECTION_NAME

        if utility.has_collection(col_name):
            _collection = Collection(name=col_name)
            logger.info(f"Using existing collection '{col_name}'")
        else:
            schema = _create_collection_schema()
            _collection = Collection(name=col_name, schema=schema)
            logger.info(f"Created new collection '{col_name}'")

        # Create index on embedding field if it doesn't already exist
        if not _collection.has_index():
            _collection.create_index(
                field_name="embedding",
                index_params={
                    "metric_type": "L2",
                    "index_type": "IVF_FLAT",
                    "params": {"nlist": 128},
                },
            )
            logger.info("Created IVF_FLAT index on embedding field")

        _collection.load()
    return _collection


def add_documents(
    documents: List[str],
    metadatas: List[dict],
    ids: List[str],
) -> int:
    """Add documents to the Milvus vector store.

    Args:
        documents: Text content for each document.
        metadatas: Metadata dicts for filtering/retrieval.
        ids: Unique document IDs.

    Returns:
        Number of documents added.
    """
    collection = get_collection()
    embedder = _get_embedder()

    # Generate embeddings
    embeddings = embedder.encode(documents).tolist()

    # Build insert data aligned with schema fields
    insert_data = [
        ids,                                                  # id
        documents,                                            # document
        embeddings,                                           # embedding
        [m["student_id"] for m in metadatas],                 # student_id
        [m["student_name"] for m in metadatas],               # student_name
        [m["class_name"] for m in metadatas],                 # class_name
        [m["exam_id"] for m in metadatas],                    # exam_id
        [m["exam_name"] for m in metadatas],                  # exam_name
        [m["exam_type"] for m in metadatas],                  # exam_type
        [m["academic_year"] for m in metadatas],              # academic_year
        [m["subject"] for m in metadatas],                    # subject
        [m["max_marks"] for m in metadatas],                  # max_marks
        [m["has_pdf"] for m in metadatas],                    # has_pdf
        [m["result_id"] for m in metadatas],                  # result_id
    ]

    # Delete existing docs with same IDs (upsert behaviour)
    try:
        expr = " || ".join([f'id == "{doc_id}"' for doc_id in ids])
        collection.delete(expr=expr)
    except Exception:
        pass  # first-time insert, nothing to delete

    collection.insert(insert_data)
    collection.flush()

    logger.info(f"Upserted {len(documents)} documents into Milvus collection")
    return len(documents)


def query_documents(
    query_text: str,
    n_results: int = 10,
    where: Optional[str] = None,
) -> dict:
    """Query the Milvus vector store with semantic search.

    Args:
        query_text: Natural language query.
        n_results: Max number of results.
        where: Optional Milvus boolean expression for filtering.

    Returns:
        Dict with documents, metadatas, distances.
    """
    collection = get_collection()
    embedder = _get_embedder()

    query_embedding = embedder.encode([query_text]).tolist()

    search_params = {"metric_type": "L2", "params": {"nprobe": 16}}

    output_fields = [
        "document", "student_id", "student_name", "class_name",
        "exam_id", "exam_name", "exam_type", "academic_year",
        "subject", "max_marks", "has_pdf", "result_id",
    ]

    results = collection.search(
        data=query_embedding,
        anns_field="embedding",
        param=search_params,
        limit=n_results,
        expr=where,
        output_fields=output_fields,
    )

    documents = []
    metadatas = []
    distances = []

    for hits in results:
        for hit in hits:
            entity = hit.entity
            documents.append(entity.get("document", ""))
            metadatas.append({
                "student_id": entity.get("student_id"),
                "student_name": entity.get("student_name"),
                "class_name": entity.get("class_name"),
                "exam_id": entity.get("exam_id"),
                "exam_name": entity.get("exam_name"),
                "exam_type": entity.get("exam_type"),
                "academic_year": entity.get("academic_year"),
                "subject": entity.get("subject"),
                "max_marks": entity.get("max_marks"),
                "has_pdf": entity.get("has_pdf"),
                "result_id": entity.get("result_id"),
            })
            distances.append(hit.distance)

    return {
        "documents": [documents],
        "metadatas": [metadatas],
        "distances": [distances],
    }


def delete_by_student(student_id: str) -> int:
    """Delete all documents for a given student.

    Returns:
        Number of documents deleted.
    """
    collection = get_collection()

    # Count matching docs before deletion
    expr = f'student_id == "{student_id}"'
    results = collection.query(expr=expr, output_fields=["id"])
    count = len(results)

    if count > 0:
        collection.delete(expr=expr)
        collection.flush()
        logger.info(f"Deleted {count} documents for student {student_id}")

    return count


def get_collection_count() -> int:
    """Return total number of documents in the collection."""
    collection = get_collection()
    return collection.num_entities


def query_all_documents(
    where: Optional[str] = None,
    limit: int = 16384,
) -> List[dict]:
    """Retrieve documents using scalar filtering (no vector search).

    Returns a flat list of metadata dicts (one per document).
    """
    collection = get_collection()

    output_fields = [
        "document", "student_id", "student_name", "class_name",
        "exam_id", "exam_name", "exam_type", "academic_year",
        "subject", "max_marks", "has_pdf", "result_id",
    ]

    results = collection.query(
        expr=where or "",
        output_fields=output_fields,
        limit=limit,
    )

    return results


def get_distinct_values(field: str) -> List[str]:
    """Get distinct values of a metadata field from the collection."""
    collection = get_collection()
    results = collection.query(
        expr="",
        output_fields=[field],
        limit=16384,
    )
    seen = set()
    values = []
    for r in results:
        v = r.get(field)
        if v is not None and v not in seen:
            seen.add(v)
            values.append(str(v))
    values.sort()
    return values
