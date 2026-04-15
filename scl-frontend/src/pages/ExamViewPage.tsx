import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import examService from '../services/examService'
import questionPaperService from '../services/questionPaperService'
import { useSchoolConfig } from '../hooks/useSchoolConfig'
import type { ExamClassPaperResponse, ExamClassPaperForm, ExamEventStatus } from '../types'
import {
  Box, Typography, Card, CardContent, Button, Chip, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Grid,
  IconButton,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import CasinoIcon from '@mui/icons-material/Casino'

const STATUS_CHIP: Record<ExamEventStatus, 'default' | 'warning' | 'success' | 'info'> = {
  draft: 'default', papers_attached: 'warning', paper_selected: 'success', conducted: 'info',
}
const STATUS_LABELS: Record<ExamEventStatus, string> = {
  draft: 'Draft', papers_attached: 'Papers Attached', paper_selected: 'Paper Selected', conducted: 'Conducted',
}
const EXAM_TYPE_LABELS: Record<string, string> = {
  unit_test: 'Unit Test', quarterly: 'Quarterly', half_yearly: 'Half Yearly', midterm: 'Midterm', final: 'Final',
}

function ClassPaperDialog({ examId, examType, existing, onClose }: {
  examId: number; examType: string; existing: ExamClassPaperResponse | null; onClose: () => void
}) {
  const queryClient = useQueryClient()
  const { classes } = useSchoolConfig()
  const [className, setClassName] = useState(existing?.class_name || '')
  const [subject, setSubject] = useState(existing?.subject || '')
  const [setA, setSetA] = useState<number | null>(existing?.paper_set_a_id ?? null)
  const [setB, setSetB] = useState<number | null>(existing?.paper_set_b_id ?? null)
  const [setC, setSetC] = useState<number | null>(existing?.paper_set_c_id ?? null)
  const [error, setError] = useState('')

  const { data: allPapers = [] } = useQuery({ queryKey: ['question-papers-approved'], queryFn: () => questionPaperService.getAll({ status: 'approved' }) })
  const { data: publishedPapers = [] } = useQuery({ queryKey: ['question-papers-published'], queryFn: () => questionPaperService.getAll({ status: 'published' }) })
  const seenIds = new Set<number>()
  const availablePapers = [...allPapers, ...publishedPapers].filter((p) => { if (seenIds.has(p.id)) return false; seenIds.add(p.id); return true })
  const sortedPapers = [...availablePapers].sort((a, b) => {
    const score = (p: typeof a) => { let s = 0; if (className && p.class_name.toLowerCase() === className.toLowerCase()) s += 4; if (subject && p.subject.toLowerCase() === subject.toLowerCase()) s += 2; if (p.exam_type === examType) s += 1; return s }
    return score(b) - score(a)
  })

  const addMutation = useMutation({ mutationFn: (data: ExamClassPaperForm) => examService.addClass(examId, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['exam', examId] }); onClose() }, onError: (err: any) => setError(err?.response?.data?.detail || 'Failed') })
  const updateMutation = useMutation({ mutationFn: (data: Partial<ExamClassPaperForm>) => examService.updateClass(examId, existing!.id, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['exam', examId] }); onClose() }, onError: (err: any) => setError(err?.response?.data?.detail || 'Failed') })

  const handleSubmit = () => {
    setError('')
    if (!className.trim() || !subject.trim()) { setError('Class and Subject are required'); return }
    const ids = [setA, setB, setC].filter(Boolean)
    if (new Set(ids).size !== ids.length) { setError('Each paper set must be different'); return }
    const payload: ExamClassPaperForm = { class_name: className.trim(), subject: subject.trim(), paper_set_a_id: setA, paper_set_b_id: setB, paper_set_c_id: setC }
    existing ? updateMutation.mutate(payload) : addMutation.mutate(payload)
  }

  const isPending = addMutation.isPending || updateMutation.isPending

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{existing ? 'Edit Class Entry' : 'Add Class to Exam'}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={6}>
            <TextField select label="Class *" fullWidth value={className} onChange={(e) => setClassName(e.target.value)}>
              <MenuItem value="">Select Class</MenuItem>
              {classes.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={6}><TextField label="Subject *" fullWidth value={subject} onChange={(e) => setSubject(e.target.value)} /></Grid>
        </Grid>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 1 }}>Attach up to 3 paper sets (approved/published papers):</Typography>
        <Grid container spacing={2}>
          {[['Set A', setA, setSetA], ['Set B', setB, setSetB], ['Set C', setC, setSetC]].map(([label, value, onChange]) => (
            <Grid key={label as string} size={4}>
              <TextField select label={label as string} fullWidth size="small" value={value ?? ''} onChange={(e) => (onChange as any)(e.target.value ? Number(e.target.value) : null)}>
                <MenuItem value="">— None —</MenuItem>
                {sortedPapers.map((p) => <MenuItem key={p.id} value={p.id}>#{p.id} – {p.title} ({p.class_name}/{p.subject})</MenuItem>)}
              </TextField>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={isPending}>{isPending ? 'Saving...' : existing ? 'Update' : 'Add Class'}</Button>
      </DialogActions>
    </Dialog>
  )
}

function SelectionDialog({ examId, classCount, onClose }: { examId: number; classCount: number; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const mutation = useMutation({
    mutationFn: () => examService.selectPapers(examId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['exam', examId] }); onClose() },
    onError: (err: any) => setError(err?.response?.data?.detail || 'Failed'),
  })
  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Confirm Paper Selection</DialogTitle>
      <DialogContent>
        <Typography>This will <strong>randomly</strong> select one paper set for all <strong>{classCount}</strong> class entries. This <strong>cannot be undone</strong>.</Typography>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" color="success" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending ? 'Selecting...' : 'Confirm Selection'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default function ExamViewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const examId = Number(id)
  const [modal, setModal] = useState<'add' | 'selection' | null>(null)
  const [editingEntry, setEditingEntry] = useState<ExamClassPaperResponse | null>(null)

  const { data: exam, isLoading, error } = useQuery({
    queryKey: ['exam', examId],
    queryFn: () => examService.getById(examId),
    enabled: !!examId,
  })

  const deleteClassMutation = useMutation({
    mutationFn: (classId: number) => examService.removeClass(examId, classId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exam', examId] }),
  })

  if (isLoading) return <Box sx={{ textAlign: 'center', py: 8 }}><CircularProgress /></Box>
  if (error || !exam) return <Alert severity="error">Failed to load exam details</Alert>

  const canAddClasses = exam.status === 'draft' || exam.status === 'papers_attached'
  const canSelect = exam.status === 'papers_attached' && (exam.class_papers?.length || 0) > 0

  return (
    <Box className="fade-in">
      <Button size="small" startIcon={<ArrowBackIcon />} onClick={() => navigate('/exams')} sx={{ mb: 2 }}>Back to Exams</Button>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h1">{exam.name}</Typography>
          <Typography variant="subtitle1" sx={{ mt: 0.5 }}>
            {EXAM_TYPE_LABELS[exam.exam_type] || exam.exam_type} · {exam.academic_year} · {new Date(exam.exam_date).toLocaleDateString()}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip label={STATUS_LABELS[exam.status]} color={STATUS_CHIP[exam.status]} />
          {canSelect && (
            <Button variant="contained" color="success" startIcon={<CasinoIcon />} onClick={() => setModal('selection')}>
              Select Papers
            </Button>
          )}
          {canAddClasses && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditingEntry(null); setModal('add') }}>
              Add Class
            </Button>
          )}
        </Box>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h3" sx={{ mb: 2 }}>Classes & Paper Sets</Typography>
          {(exam.class_papers?.length || 0) === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}><Typography color="text.secondary">No classes added yet.</Typography></Box>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Class</TableCell><TableCell>Subject</TableCell>
                    <TableCell>Set A</TableCell><TableCell>Set B</TableCell><TableCell>Set C</TableCell>
                    <TableCell>Selected</TableCell><TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {exam.class_papers!.map((cp: ExamClassPaperResponse) => (
                    <TableRow key={cp.id}>
                      <TableCell sx={{ fontWeight: 600 }}>{cp.class_name}</TableCell>
                      <TableCell>{cp.subject}</TableCell>
                      <TableCell>{cp.paper_set_a_id ? `#${cp.paper_set_a_id}` : '—'}</TableCell>
                      <TableCell>{cp.paper_set_b_id ? `#${cp.paper_set_b_id}` : '—'}</TableCell>
                      <TableCell>{cp.paper_set_c_id ? `#${cp.paper_set_c_id}` : '—'}</TableCell>
                      <TableCell>{cp.selected_set ? <Chip label={`Set ${cp.selected_set.toUpperCase()}`} size="small" color="success" /> : '—'}</TableCell>
                      <TableCell align="right">
                        {canAddClasses && (
                          <>
                            <IconButton size="small" onClick={() => { setEditingEntry(cp); setModal('add') }}><EditIcon fontSize="small" /></IconButton>
                            <IconButton size="small" color="error" onClick={() => { if (confirm('Remove this class?')) deleteClassMutation.mutate(cp.id) }}><DeleteIcon fontSize="small" /></IconButton>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {modal === 'add' && <ClassPaperDialog examId={examId} examType={exam.exam_type} existing={editingEntry} onClose={() => setModal(null)} />}
      {modal === 'selection' && <SelectionDialog examId={examId} classCount={exam.class_papers?.length || 0} onClose={() => setModal(null)} />}
    </Box>
  )
}
