import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import examService from '../services/examService'
import type { ExamEventForm } from '../types'
import {
  Box, Typography, Card, CardContent, TextField, Button, MenuItem, Grid, Alert,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SaveIcon from '@mui/icons-material/Save'

const EXAM_TYPES = [
  { value: 'unit_test', label: 'Unit Test' }, { value: 'quarterly', label: 'Quarterly' },
  { value: 'half_yearly', label: 'Half Yearly' }, { value: 'midterm', label: 'Midterm' },
  { value: 'final', label: 'Final' },
]

export default function ExamCreatePage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [academicYear, setAcademicYear] = useState('2025-2026')
  const [examType, setExamType] = useState('midterm')
  const [examDate, setExamDate] = useState('')
  const [paperSelectionDate, setPaperSelectionDate] = useState('')
  const [formError, setFormError] = useState('')

  const createMutation = useMutation({
    mutationFn: (data: ExamEventForm) => examService.create(data),
    onSuccess: (exam) => navigate(`/exams/${exam.id}`),
    onError: (err: any) => setFormError(err?.response?.data?.detail || 'Failed to create exam'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!name.trim()) { setFormError('Exam name is required'); return }
    if (!examDate) { setFormError('Exam date is required'); return }
    if (!paperSelectionDate) { setFormError('Paper selection date is required'); return }
    if (new Date(paperSelectionDate) > new Date(examDate)) { setFormError('Paper selection date must be on or before exam date'); return }
    createMutation.mutate({ name: name.trim(), academic_year: academicYear, exam_type: examType, exam_date: examDate, paper_selection_date: paperSelectionDate })
  }

  return (
    <Box sx={{ maxWidth: 640, mx: 'auto' }} className="fade-in">
      <Box sx={{ mb: 4 }}>
        <Button size="small" startIcon={<ArrowBackIcon />} onClick={() => navigate('/exams')} sx={{ mb: 1 }}>Back to Exams</Button>
        <Typography variant="h1">Create Exam Event</Typography>
        <Typography variant="subtitle1">Set up exam details, then add classes and attach papers.</Typography>
      </Box>

      <Card>
        <CardContent sx={{ p: 4 }}>
          {formError && <Alert severity="error" sx={{ mb: 3 }}>{formError}</Alert>}
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField label="Exam Name *" fullWidth value={name} onChange={(e) => setName(e.target.value)} required />
              <Grid container spacing={2}>
                <Grid size={6}>
                  <TextField select label="Academic Year *" fullWidth value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}>
                    <MenuItem value="2024-2025">2024-2025</MenuItem><MenuItem value="2025-2026">2025-2026</MenuItem><MenuItem value="2026-2027">2026-2027</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={6}>
                  <TextField select label="Exam Type *" fullWidth value={examType} onChange={(e) => setExamType(e.target.value)}>
                    {EXAM_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid size={6}>
                  <TextField label="Exam Date *" type="date" fullWidth slotProps={{ inputLabel: { shrink: true } }} value={examDate} onChange={(e) => setExamDate(e.target.value)} required />
                </Grid>
                <Grid size={6}>
                  <TextField label="Paper Selection Date *" type="date" fullWidth slotProps={{ inputLabel: { shrink: true } }} value={paperSelectionDate} onChange={(e) => setPaperSelectionDate(e.target.value)} required helperText="Must be on or before exam date" />
                </Grid>
              </Grid>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Button variant="outlined" onClick={() => navigate('/exams')}>Cancel</Button>
                <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create Exam'}
                </Button>
              </Box>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  )
}
