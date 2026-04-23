import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import questionPaperService from '../services/questionPaperService'
import QuestionPaperDesigner from '../components/editor/QuestionPaperDesigner'
import type { ContentBlock } from '../types'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  review: 'Under Review',
  approved: 'Approved',
  published: 'Published',
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  review: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  published: 'bg-blue-100 text-blue-800',
}

export default function QuestionPaperDesignerPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const paperId = Number(id)

  const [blocks, setBlocks] = useState<ContentBlock[]>([])
  const [hasUnsaved, setHasUnsaved] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)

  // ── Fetch the paper ───────────────────────────────────────
  const {
    data: paper,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['question-paper', id],
    queryFn: () => questionPaperService.getById(paperId),
    enabled: !!id && !isNaN(paperId),
  })

  // Initialise blocks from server data
  useEffect(() => {
    if (!paper) return

    if (paper.content_blocks && paper.content_blocks.length > 0) {
      // Load existing design
      setBlocks(paper.content_blocks as ContentBlock[])
    } else if (paper.questions.length > 0) {
      // Auto-convert existing structured questions into content blocks
      const initial: ContentBlock[] = []

      // Header block
      initial.push({
        id: `init-header-${Date.now()}`,
        type: 'header',
        position: 0,
        content: `<h2 style="text-align: center">${paper.title}</h2><p style="text-align: center"><strong>${paper.subject} — ${paper.exam_type.replace('_', ' ')}</strong></p><p style="text-align: center">Class: ${paper.class_name} &nbsp;|&nbsp; Time: ${paper.duration_minutes} min &nbsp;|&nbsp; Max Marks: ${paper.total_marks}</p>`,
      })

      // Instructions
      if (paper.instructions) {
        initial.push({
          id: `init-instr-${Date.now()}`,
          type: 'instructions',
          position: 1,
          content: `<p><strong>General Instructions:</strong></p><p>${paper.instructions}</p>`,
        })
      }

      // Group questions by section
      const sections = new Map<string, typeof paper.questions>()
      paper.questions.forEach((q) => {
        const sec = q.section || '_default'
        if (!sections.has(sec)) sections.set(sec, [])
        sections.get(sec)!.push(q)
      })

      let pos = initial.length
      sections.forEach((qs, sec) => {
        if (sec !== '_default') {
          initial.push({
            id: `init-sec-${sec}-${Date.now()}`,
            type: 'section_title',
            position: pos++,
            content: `<h3>Section ${sec}</h3>`,
          })
        }

        qs.forEach((q) => {
          initial.push({
            id: `init-q-${q.id}-${Date.now()}`,
            type: 'question',
            position: pos++,
            content: `<p>${q.question_text}</p>`,
            metadata: {
              questionNumber: q.question_number,
              marks: q.marks,
              questionType: q.question_type,
              section: q.section || '',
            },
          })
        })
      })

      setBlocks(initial)
    }
  }, [paper])

  // ── Save mutation ─────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: () =>
      questionPaperService.update(paperId, {
        content_blocks: blocks as unknown as Record<string, unknown>[],
      }),
    onSuccess: () => {
      setHasUnsaved(false)
      queryClient.invalidateQueries({ queryKey: ['question-paper', id] })
    },
  })

  const handleBlocksChange = (newBlocks: ContentBlock[]) => {
    setBlocks(newBlocks)
    setHasUnsaved(true)
  }

  const isEditable =
    paper?.status === 'draft' || paper?.status === 'review'
  const statusLabel = paper ? STATUS_LABELS[paper.status] || paper.status : ''
  const statusColor = paper ? STATUS_COLORS[paper.status] || '' : ''

  // ── Auto-save on Ctrl+S ───────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (isEditable && hasUnsaved) saveMutation.mutate()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hasUnsaved, isEditable, saveMutation]) // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Loading question paper…</div>
  }

  if (error || !paper) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-3">Failed to load question paper.</p>
        <button
          onClick={() => navigate('/question-papers')}
          className="text-primary-600 hover:text-primary-800"
        >
          ← Back to Question Papers
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* Top navigation / status bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <button
              onClick={() => navigate(`/question-papers/${paperId}`)}
              className="text-sm text-primary-600 hover:text-primary-800"
            >
              ← Back to Form Editor
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={() => navigate('/question-papers')}
              className="text-sm text-primary-600 hover:text-primary-800"
            >
              All Papers
            </button>
          </div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-3">
            🎨 Designer: {paper.title}
            <span
              className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColor}`}
            >
              {statusLabel}
            </span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {paper.subject} &middot; {paper.class_name} &middot;{' '}
            {paper.exam_type.replace('_', ' ')} &middot; {paper.academic_year}
          </p>
        </div>

        {/* Save button */}
        <div className="flex items-center gap-3">
          {hasUnsaved && (
            <span className="text-xs text-amber-600 font-medium">● Unsaved changes</span>
          )}
          {saveMutation.isError && (
            <span className="text-xs text-red-600">Save failed</span>
          )}
          <button
            onClick={async () => {
              setPdfLoading(true)
              try {
                const filename = `${paper.title.replace(/\s+/g, '_')}_${paper.class_name}_${paper.exam_type}.pdf`
                await questionPaperService.downloadPdf(paperId, filename)
              } catch {
                alert('Failed to generate PDF')
              } finally {
                setPdfLoading(false)
              }
            }}
            disabled={pdfLoading}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium disabled:opacity-50 transition-colors inline-flex items-center gap-1.5"
          >
            {pdfLoading ? (
              'Generating…'
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PDF
              </>
            )}
          </button>
          {isEditable && (
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !hasUnsaved}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {saveMutation.isPending ? 'Saving…' : 'Save Design'}
            </button>
          )}
        </div>
      </div>

      {/* Designer */}
      <QuestionPaperDesigner
        blocks={blocks}
        onChange={handleBlocksChange}
        editable={isEditable ?? false}
      />
    </div>
  )
}
