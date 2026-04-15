import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import questionPaperService from '../services/questionPaperService'
import type { QuestionResponse, QuestionForm } from '../types'
import {
  Box, Typography, Card, CardContent, CircularProgress, Alert, Button, TextField, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, Breadcrumbs, Divider,
} from '@mui/material'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import DownloadIcon from '@mui/icons-material/Download'
import BrushIcon from '@mui/icons-material/Brush'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'

const STATUS_CHIP: Record<string, { color: 'default' | 'warning' | 'success' | 'info'; label: string }> = {
  draft: { color: 'default', label: 'Draft' },
  review: { color: 'warning', label: 'Under Review' },
  approved: { color: 'success', label: 'Approved' },
  published: { color: 'info', label: 'Published' },
}

const QUESTION_TYPES = ['mcq', 'short_answer', 'long_answer', 'true_false', 'fill_blank']
const EXAM_TYPES = ['unit_test', 'mid_term', 'final', 'quarterly', 'half_yearly', 'annual']
const STATUS_TRANSITIONS: Record<string, { label: string; next: string }[]> = {
  draft: [{ label: 'Submit for Review', next: 'review' }],
  review: [{ label: 'Approve', next: 'approved' }, { label: 'Back to Draft', next: 'draft' }],
  approved: [{ label: 'Publish', next: 'published' }, { label: 'Back to Review', next: 'review' }],
  published: [{ label: 'Revert to Approved', next: 'approved' }],
}

export default function QuestionPaperEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const paperId = Number(id)
  const isNew = id === 'new'

  // Form state for paper metadata
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [className, setClassName] = useState('')
  const [academicYear, setAcademicYear] = useState('')
  const [examType, setExamType] = useState('')
  const [totalMarks, setTotalMarks] = useState('100')
  const [duration, setDuration] = useState('180')
  const [instructions, setInstructions] = useState('')
  const [metaInited, setMetaInited] = useState(false)

  // Question form dialog
  const [showQDialog, setShowQDialog] = useState(false)
  const [editingQ, setEditingQ] = useState<QuestionResponse | null>(null)
  const [qNumber, setQNumber] = useState('')
  const [qText, setQText] = useState('')
  const [qType, setQType] = useState('short_answer')
  const [qMarks, setQMarks] = useState('5')
  const [qSection, setQSection] = useState('')
  const [qAnswer, setQAnswer] = useState('')
  const [pdfLoading, setPdfLoading] = useState(false)

  const { data: paper, isLoading, error } = useQuery({
    queryKey: ['question-paper', id],
    queryFn: () => questionPaperService.getById(paperId),
    enabled: !isNew && !!id && !isNaN(paperId),
  })

  // Init metadata from paper
  if (paper && !metaInited) {
    setTitle(paper.title); setSubject(paper.subject); setClassName(paper.class_name)
    setAcademicYear(paper.academic_year); setExamType(paper.exam_type)
    setTotalMarks(String(paper.total_marks)); setDuration(String(paper.duration_minutes))
    setInstructions(paper.instructions || ''); setMetaInited(true)
  }

  const createMutation = useMutation({
    mutationFn: () => questionPaperService.create({ title, subject, class_name: className, academic_year: academicYear, exam_type: examType as any, total_marks: Number(totalMarks), duration_minutes: Number(duration), instructions: instructions || undefined }),
    onSuccess: (created) => { navigate(`/question-papers/${created.id}`, { replace: true }) },
  })

  const updateMutation = useMutation({
    mutationFn: () => questionPaperService.update(paperId, { title, subject, class_name: className, academic_year: academicYear, exam_type: examType as any, total_marks: Number(totalMarks), duration_minutes: Number(duration), instructions: instructions || undefined }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['question-paper', id] }),
  })

  const statusMutation = useMutation({
    mutationFn: (status: string) => questionPaperService.update(paperId, { status: status as any }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['question-paper', id] }),
  })

  const addQMutation = useMutation({
    mutationFn: (data: QuestionForm) => questionPaperService.addQuestion(paperId, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['question-paper', id] }); resetQForm() },
  })

  const updateQMutation = useMutation({
    mutationFn: ({ qId, data }: { qId: number; data: Partial<QuestionForm> }) => questionPaperService.updateQuestion(paperId, qId, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['question-paper', id] }); resetQForm() },
  })

  const deleteQMutation = useMutation({
    mutationFn: (qId: number) => questionPaperService.removeQuestion(paperId, qId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['question-paper', id] }),
  })

  const resetQForm = () => { setShowQDialog(false); setEditingQ(null); setQNumber(''); setQText(''); setQType('short_answer'); setQMarks('5'); setQSection(''); setQAnswer('') }

  const openEditQ = (q: QuestionResponse) => {
    setEditingQ(q); setQNumber(String(q.question_number)); setQText(q.question_text)
    setQType(q.question_type); setQMarks(String(q.marks)); setQSection(q.section || ''); setQAnswer(q.expected_answer || '')
    setShowQDialog(true)
  }

  const handleSaveQ = () => {
    const data: QuestionForm = { question_number: Number(qNumber), question_text: qText, question_type: qType as any, marks: Number(qMarks), section: qSection || undefined, expected_answer: qAnswer || undefined }
    if (editingQ) updateQMutation.mutate({ qId: editingQ.id, data })
    else addQMutation.mutate(data)
  }

  const isEditable = isNew || paper?.status === 'draft' || paper?.status === 'review'
  const chipInfo = paper ? STATUS_CHIP[paper.status] || { color: 'default' as const, label: paper.status } : null
  const transitions = paper ? STATUS_TRANSITIONS[paper.status] || [] : []

  if (!isNew && isLoading) return <Box sx={{ textAlign: 'center', py: 12 }}><CircularProgress /></Box>
  if (!isNew && error) return <Alert severity="error">Failed to load question paper</Alert>

  return (
    <Box className="fade-in">
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
        <Typography component={Link} to="/question-papers" color="text.secondary" sx={{ textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>Question Papers</Typography>
        <Typography color="text.primary" sx={{ fontWeight: 600 }}>{isNew ? 'Create New' : paper?.title}</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Typography variant="h1">{isNew ? 'Create Question Paper' : 'Edit Question Paper'}</Typography>
            {chipInfo && <Chip label={chipInfo.label} color={chipInfo.color} size="small" />}
          </Box>
        </Box>
        {!isNew && (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {transitions.map((t) => (
              <Button key={t.next} variant="outlined" size="small" onClick={() => statusMutation.mutate(t.next)} disabled={statusMutation.isPending}
                startIcon={<ArrowForwardIcon />}
              >
                {t.label}
              </Button>
            ))}
            <Button variant="outlined" color="success" size="small" startIcon={<DownloadIcon />}
              onClick={async () => { setPdfLoading(true); try { await questionPaperService.downloadPdf(paperId, `${title.replace(/\s+/g, '_')}.pdf`) } catch { alert('Failed') } finally { setPdfLoading(false) } }}
              disabled={pdfLoading}
            >
              {pdfLoading ? 'Generating…' : 'Download PDF'}
            </Button>
            <Button variant="contained" size="small" startIcon={<BrushIcon />} component={Link} to={`/question-papers/${paperId}/design`}>
              Open Designer
            </Button>
          </Box>
        )}
      </Box>

      {/* Metadata Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography sx={{ fontWeight: 600, mb: 2 }}>Paper Details</Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField label="Title *" fullWidth value={title} onChange={(e) => setTitle(e.target.value)} disabled={!isEditable} />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField label="Subject *" fullWidth value={subject} onChange={(e) => setSubject(e.target.value)} disabled={!isEditable} />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField label="Class *" fullWidth value={className} onChange={(e) => setClassName(e.target.value)} disabled={!isEditable} />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField label="Academic Year *" fullWidth value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} placeholder="2025-2026" disabled={!isEditable} />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField label="Exam Type *" fullWidth select value={examType} onChange={(e) => setExamType(e.target.value)} disabled={!isEditable}>
                <MenuItem value="">Select</MenuItem>
                {EXAM_TYPES.map((t) => <MenuItem key={t} value={t}>{t.replace('_', ' ')}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField label="Total Marks" type="number" fullWidth value={totalMarks} onChange={(e) => setTotalMarks(e.target.value)} disabled={!isEditable} />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField label="Duration (min)" type="number" fullWidth value={duration} onChange={(e) => setDuration(e.target.value)} disabled={!isEditable} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField label="Instructions" fullWidth multiline rows={3} value={instructions} onChange={(e) => setInstructions(e.target.value)} disabled={!isEditable} />
            </Grid>
          </Grid>

          {isEditable && (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained" onClick={() => isNew ? createMutation.mutate() : updateMutation.mutate()}
                disabled={createMutation.isPending || updateMutation.isPending || !title || !subject || !className || !academicYear || !examType}>
                {createMutation.isPending || updateMutation.isPending ? 'Saving…' : isNew ? 'Create Paper' : 'Save Changes'}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Questions Section (only for existing papers) */}
      {!isNew && paper && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography sx={{ fontWeight: 600 }}>Questions ({paper.questions.length})</Typography>
              {isEditable && (
                <Button size="small" startIcon={<AddIcon />} onClick={() => { resetQForm(); setQNumber(String((paper.questions.length || 0) + 1)); setShowQDialog(true) }}>
                  Add Question
                </Button>
              )}
            </Box>
            <Divider sx={{ mb: 1 }} />
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width={60}>#</TableCell><TableCell>Question</TableCell>
                    <TableCell width={100}>Type</TableCell><TableCell width={80}>Marks</TableCell>
                    <TableCell width={80}>Section</TableCell>
                    {isEditable && <TableCell width={100} align="right">Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paper.questions.length === 0 ? (
                    <TableRow><TableCell colSpan={isEditable ? 6 : 5} sx={{ textAlign: 'center', py: 4 }}><Typography color="text.secondary">No questions yet</Typography></TableCell></TableRow>
                  ) : paper.questions.map((q: QuestionResponse) => (
                    <TableRow key={q.id}>
                      <TableCell>{q.question_number}</TableCell>
                      <TableCell sx={{ maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.question_text}</TableCell>
                      <TableCell><Chip label={q.question_type.replace('_', ' ')} size="small" variant="outlined" /></TableCell>
                      <TableCell>{q.marks}</TableCell>
                      <TableCell>{q.section || '—'}</TableCell>
                      {isEditable && (
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => openEditQ(q)}><EditIcon fontSize="small" /></IconButton>
                          <IconButton size="small" color="error" onClick={() => { if (confirm('Delete this question?')) deleteQMutation.mutate(q.id) }}><DeleteIcon fontSize="small" /></IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Question Dialog */}
      <Dialog open={showQDialog} onClose={resetQForm} maxWidth="sm" fullWidth>
        <DialogTitle>{editingQ ? `Edit Question #${editingQ.question_number}` : 'Add Question'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Q #" type="number" value={qNumber} onChange={(e) => setQNumber(e.target.value)} sx={{ width: 100 }} />
              <TextField label="Section" value={qSection} onChange={(e) => setQSection(e.target.value)} sx={{ width: 120 }} />
              <TextField label="Type" select fullWidth value={qType} onChange={(e) => setQType(e.target.value)}>
                {QUESTION_TYPES.map((t) => <MenuItem key={t} value={t}>{t.replace('_', ' ')}</MenuItem>)}
              </TextField>
              <TextField label="Marks" type="number" value={qMarks} onChange={(e) => setQMarks(e.target.value)} sx={{ width: 100 }} />
            </Box>
            <TextField label="Question Text *" fullWidth multiline rows={3} value={qText} onChange={(e) => setQText(e.target.value)} />
            <TextField label="Expected Answer" fullWidth multiline rows={2} value={qAnswer} onChange={(e) => setQAnswer(e.target.value)} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={resetQForm}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveQ} disabled={addQMutation.isPending || updateQMutation.isPending || !qText || !qNumber}>
            {addQMutation.isPending || updateQMutation.isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
