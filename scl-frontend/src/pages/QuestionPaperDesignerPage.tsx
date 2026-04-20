import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import questionPaperService from '../services/questionPaperService'
import QuestionPaperDesigner from '../components/editor/QuestionPaperDesigner'
import type { ContentBlock } from '../types'
import {
  Box, Typography, Chip, Button, CircularProgress, Alert, Breadcrumbs,
} from '@mui/material'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import DownloadIcon from '@mui/icons-material/Download'
import SaveIcon from '@mui/icons-material/Save'

const STATUS_CHIP: Record<string, { color: 'default' | 'warning' | 'success' | 'info'; label: string }> = {
  draft: { color: 'default', label: 'Draft' },
  review: { color: 'warning', label: 'Under Review' },
  approved: { color: 'success', label: 'Approved' },
  published: { color: 'info', label: 'Published' },
}

export default function QuestionPaperDesignerPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const paperId = Number(id)

  const [blocks, setBlocks] = useState<ContentBlock[]>([])
  const [hasUnsaved, setHasUnsaved] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)

  const { data: paper, isLoading, error } = useQuery({
    queryKey: ['question-paper', id],
    queryFn: () => questionPaperService.getById(paperId),
    enabled: !!id && !isNaN(paperId),
  })

  // Initialise blocks from server data
  useEffect(() => {
    if (!paper) return

    if (paper.content_blocks && paper.content_blocks.length > 0) {
      setBlocks(paper.content_blocks as ContentBlock[])
    } else if (paper.questions.length > 0) {
      const initial: ContentBlock[] = []

      initial.push({
        id: `init-header-${Date.now()}`,
        type: 'header',
        position: 0,
        content: `<h2 style="text-align: center">${paper.title}</h2><p style="text-align: center"><strong>${paper.subject} — ${paper.exam_type.replace('_', ' ')}</strong></p><p style="text-align: center">Class: ${paper.class_name} &nbsp;|&nbsp; Time: ${paper.duration_minutes} min &nbsp;|&nbsp; Max Marks: ${paper.total_marks}</p>`,
      })

      if (paper.instructions) {
        initial.push({
          id: `init-instr-${Date.now()}`,
          type: 'instructions',
          position: 1,
          content: `<p><strong>General Instructions:</strong></p><p>${paper.instructions}</p>`,
        })
      }

      const sections = new Map<string, typeof paper.questions>()
      paper.questions.forEach((q) => {
        const sec = q.section || '_default'
        if (!sections.has(sec)) sections.set(sec, [])
        sections.get(sec)!.push(q)
      })

      let pos = initial.length
      sections.forEach((qs, sec) => {
        if (sec !== '_default') {
          initial.push({ id: `init-sec-${sec}-${Date.now()}`, type: 'section_title', position: pos++, content: `<h3>Section ${sec}</h3>` })
        }
        qs.forEach((q) => {
          initial.push({
            id: `init-q-${q.id}-${Date.now()}`,
            type: 'question',
            position: pos++,
            content: `<p>${q.question_text}</p>`,
            metadata: { questionNumber: q.question_number, marks: q.marks, questionType: q.question_type, section: q.section || '' },
          })
        })
      })

      setBlocks(initial)
    }
  }, [paper])

  const saveMutation = useMutation({
    mutationFn: () => questionPaperService.update(paperId, { content_blocks: blocks as unknown as Record<string, unknown>[] }),
    onSuccess: () => { setHasUnsaved(false); queryClient.invalidateQueries({ queryKey: ['question-paper', id] }) },
  })

  const handleBlocksChange = (newBlocks: ContentBlock[]) => { setBlocks(newBlocks); setHasUnsaved(true) }
  const isEditable = paper?.status === 'draft' || paper?.status === 'review'
  const chipInfo = paper ? STATUS_CHIP[paper.status] || { color: 'default' as const, label: paper.status } : null

  // Auto-save on Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (isEditable && hasUnsaved) saveMutation.mutate()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hasUnsaved, isEditable, saveMutation])

  if (isLoading) return <Box sx={{ textAlign: 'center', py: 12 }}><CircularProgress /></Box>
  if (error || !paper) return (
    <Box sx={{ textAlign: 'center', py: 12 }}>
      <Alert severity="error" sx={{ display: 'inline-flex', mb: 2 }}>Failed to load question paper</Alert>
      <br />
      <Button component={Link} to="/question-papers">Back to Question Papers</Button>
    </Box>
  )

  return (
    <Box className="fade-in" sx={{ maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
        <Typography component={Link} to="/question-papers" color="text.secondary" sx={{ textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>Question Papers</Typography>
        <Typography component={Link} to={`/question-papers/${paperId}`} color="text.secondary" sx={{ textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>Form Editor</Typography>
        <Typography color="text.primary" sx={{ fontWeight: 600 }}>Designer</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Designer: {paper.title}</Typography>
            {chipInfo && <Chip label={chipInfo.label} color={chipInfo.color} size="small" />}
          </Box>
          <Typography variant="body2" color="text.secondary">
            {paper.subject} · {paper.class_name} · {paper.exam_type.replace('_', ' ')} · {paper.academic_year}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {hasUnsaved && <Typography variant="caption" color="warning.main" sx={{ fontWeight: 600 }}>● Unsaved</Typography>}
          {saveMutation.isError && <Typography variant="caption" color="error.main">Save failed</Typography>}
          <Button
            variant="outlined" color="success" size="small" startIcon={<DownloadIcon />}
            disabled={pdfLoading}
            onClick={async () => {
              setPdfLoading(true)
              try { await questionPaperService.downloadPdf(paperId, `${paper.title.replace(/\s+/g, '_')}_${paper.class_name}_${paper.exam_type}.pdf`) }
              catch { alert('Failed to generate PDF') }
              finally { setPdfLoading(false) }
            }}
          >
            {pdfLoading ? 'Generating…' : 'PDF'}
          </Button>
          {isEditable && (
            <Button variant="contained" size="small" startIcon={<SaveIcon />}
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !hasUnsaved}
            >
              {saveMutation.isPending ? 'Saving…' : 'Save Design'}
            </Button>
          )}
        </Box>
      </Box>

      {/* Designer component (still uses its own internal styles) */}
      <QuestionPaperDesigner blocks={blocks} onChange={handleBlocksChange} editable={isEditable ?? false} />
    </Box>
  )
}
