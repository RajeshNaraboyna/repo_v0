"""PDF generation service for question papers."""

import html
import re
from io import BytesIO
from typing import Optional

from xhtml2pdf import pisa


def _strip_tags(value: str) -> str:
    """Strip HTML tags for plain-text fallback."""
    return re.sub(r"<[^>]+>", "", value).strip()


def _build_question_paper_html(paper: dict) -> str:
    """
    Build a self-contained HTML document from the question paper data
    that can be rendered to PDF by WeasyPrint.

    This works with both:
    - content_blocks (visual designer)
    - questions (legacy structured data)
    """
    blocks = paper.get("content_blocks") or []
    questions = paper.get("questions") or []

    css = """
    @page {
        size: A4;
        margin: 20mm 18mm 20mm 18mm;
    }
    * { box-sizing: border-box; }
    body {
        font-family: Helvetica, Arial, sans-serif;
        font-size: 12px;
        line-height: 1.55;
        color: #222;
        margin: 0;
        padding: 0;
    }
    h1, h2, h3, h4 { margin: 4px 0; }
    h2 { font-size: 18px; text-align: center; margin-bottom: 2px; }
    h3 { font-size: 14px; margin-top: 16px; border-bottom: 1px solid #999; padding-bottom: 3px; }
    h4 { font-size: 13px; margin-top: 10px; }
    p { margin: 4px 0; }
    ol, ul { margin: 4px 0 4px 20px; padding: 0; }
    li { margin: 2px 0; }
    table { border-collapse: collapse; width: 100%; margin: 8px 0; }
    td, th { border: 1px solid #aaa; padding: 4px 8px; text-align: left; font-size: 11px; }
    th { background: #f0f0f0; }
    hr { border: none; border-top: 1px solid #aaa; margin: 12px 0; }
    .header-block { text-align: center; margin-bottom: 8px; }
    .instructions-block { background: #fafafa; border: 1px solid #ddd; padding: 10px 14px; margin: 10px 0; }
    .question-block { margin: 8px 0 2px 0; }
    .question-header { margin-bottom: 2px; }
    .question-number { font-weight: bold; }
    .question-marks { font-size: 11px; color: #555; float: right; }
    .question-content { margin-left: 4px; }
    .section-title { margin-top: 18px; }
    .divider { border-top: 1px solid #ccc; margin: 14px 0; }
    .meta-line { text-align: center; font-size: 12px; color: #444; margin: 2px 0 8px 0; }
    """

    body_parts: list[str] = []

    # Track which question numbers are already rendered via content blocks
    block_question_numbers: set = set()

    if blocks:
        # ── Render content blocks from the designer ──────────
        for block in sorted(blocks, key=lambda b: b.get("position", 0)):
            btype = block.get("type", "text")
            content = block.get("content", "")
            metadata = block.get("metadata") or {}

            if btype == "header":
                body_parts.append(f'<div class="header-block">{content}</div>')

            elif btype == "instructions":
                body_parts.append(f'<div class="instructions-block">{content}</div>')

            elif btype == "section_title":
                body_parts.append(f'<div class="section-title">{content}</div>')

            elif btype == "question":
                qnum = metadata.get("questionNumber", "")
                marks = metadata.get("marks", "")
                section = metadata.get("section", "")
                section_label = f" [Section {html.escape(str(section))}]" if section else ""
                body_parts.append(
                    f'<div class="question-block">'
                    f'  <div class="question-header">'
                    f'    <span class="question-marks">[{marks} marks]</span>'
                    f'    <span class="question-number">Q{qnum}.{section_label}</span>'
                    f'  </div>'
                    f'  <div class="question-content">{content}</div>'
                    f'</div>'
                )
                # Remember this question number so we don't duplicate it
                try:
                    block_question_numbers.add(int(qnum))
                except (ValueError, TypeError):
                    pass

            elif btype == "divider":
                body_parts.append('<div class="divider"></div>')

            elif btype == "image":
                body_parts.append(f'<div>{content}</div>')

            else:
                # text or any other block
                body_parts.append(f'<div>{content}</div>')

    if not blocks and questions:
        # ── No content blocks: render full structured layout ─
        body_parts.append(
            f'<div class="header-block">'
            f'<h2>{html.escape(paper.get("title", ""))}</h2>'
            f'<p><strong>{html.escape(paper.get("subject", ""))} — '
            f'{html.escape(paper.get("exam_type", "").replace("_", " "))}</strong></p>'
            f'<p class="meta-line">Class: {html.escape(paper.get("class_name", ""))} '
            f'&nbsp;|&nbsp; Time: {paper.get("duration_minutes", 180)} min '
            f'&nbsp;|&nbsp; Max Marks: {paper.get("total_marks", 100)}</p>'
            f'</div>'
        )

        if paper.get("instructions"):
            body_parts.append(
                f'<div class="instructions-block">'
                f'<strong>Instructions:</strong><br/>{html.escape(paper["instructions"])}'
                f'</div>'
            )

        body_parts.append("<hr/>")

    # ── Render structured questions not already in content blocks ─
    remaining_questions = [
        q for q in questions
        if q.get("question_number") not in block_question_numbers
    ]

    if remaining_questions:
        current_section: Optional[str] = None
        for q in sorted(remaining_questions, key=lambda x: x.get("question_number", 0)):
            sec = q.get("section", "")
            if sec and sec != current_section:
                current_section = sec
                body_parts.append(f'<h3>Section {html.escape(sec)}</h3>')

            body_parts.append(
                f'<div class="question-block">'
                f'  <div class="question-header">'
                f'    <span class="question-marks">[{q.get("marks", 0)} marks]</span>'
                f'    <span class="question-number">Q{q.get("question_number", "")}.</span>'
                f'  </div>'
                f'  <div class="question-content">{html.escape(q.get("question_text", ""))}</div>'
                f'</div>'
            )

            # MCQ options
            if q.get("question_type") == "mcq" and q.get("options"):
                opts = q["options"]
                for key in sorted(k for k in opts if k != "correct"):
                    body_parts.append(
                        f'<div style="margin-left:50px;">({key}) {html.escape(str(opts[key]))}</div>'
                    )

    if not blocks and not questions:
        body_parts.append("<p>No content available for this question paper.</p>")

    body_html = "\n".join(body_parts)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<style>{css}</style>
</head>
<body>
{body_html}
</body>
</html>"""


def generate_question_paper_pdf(paper: dict) -> bytes:
    """
    Generate a PDF byte-string from a question paper dict.

    The dict should contain keys like title, subject, class_name,
    content_blocks (list[dict]), questions (list[dict]) etc.
    """
    html_str = _build_question_paper_html(paper)
    pdf_buffer = BytesIO()
    pisa_status = pisa.CreatePDF(html_str, dest=pdf_buffer)
    if pisa_status.err:
        raise RuntimeError(f"PDF generation failed with {pisa_status.err} errors")
    return pdf_buffer.getvalue()
