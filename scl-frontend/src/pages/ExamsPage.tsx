import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import examService from '../services/examService'
import type { ExamEventStatus } from '../types'
import {
  Box, Typography, Card, CardContent, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, CircularProgress, Chip, TextField,
  MenuItem, Grid, Alert, IconButton,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import VisibilityIcon from '@mui/icons-material/Visibility'

const STATUS_CHIP: Record<ExamEventStatus, 'default' | 'warning' | 'success' | 'info'> = {
  draft: 'default', papers_attached: 'warning', paper_selected: 'success', conducted: 'info',
}
const STATUS_LABELS: Record<ExamEventStatus, string> = {
  draft: 'Draft', papers_attached: 'Papers Attached', paper_selected: 'Paper Selected', conducted: 'Conducted',
}
const EXAM_TYPE_LABELS: Record<string, string> = {
  unit_test: 'Unit Test', quarterly: 'Quarterly', half_yearly: 'Half Yearly', midterm: 'Midterm', final: 'Final',
}

export default function ExamsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [yearFilter, setYearFilter] = useState('')

  const { data: exams = [], isLoading, error } = useQuery({
    queryKey: ['exams', statusFilter, yearFilter],
    queryFn: () => examService.getAll({ status: statusFilter || undefined, academic_year: yearFilter || undefined }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => examService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exams'] }),
  })

  const years = [...new Set(exams.map((e) => e.academic_year))].sort()

  return (
    <Box className="fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h1">Exams</Typography>
          <Typography variant="subtitle1" sx={{ mt: 0.5 }}>Create exam events, attach paper sets, and select papers</Typography>
        </Box>
        <Button variant="contained" component={Link} to="/exams/new" startIcon={<AddIcon />}>Create Exam Event</Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ pb: '16px !important' }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField select fullWidth label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="draft">Draft</MenuItem><MenuItem value="papers_attached">Papers Attached</MenuItem>
                <MenuItem value="paper_selected">Paper Selected</MenuItem><MenuItem value="conducted">Conducted</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField select fullWidth label="Academic Year" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
                <MenuItem value="">All Years</MenuItem>
                {years.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {isLoading && <Box sx={{ textAlign: 'center', py: 8 }}><CircularProgress /></Box>}
      {error && <Alert severity="error" sx={{ mb: 3 }}>Failed to load exams.</Alert>}

      {!isLoading && !error && (
        <Card>
          <CardContent>
            {exams.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}><Typography color="text.secondary">No exams found.</Typography></Box>
            ) : (
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Exam Name</TableCell><TableCell>Type</TableCell><TableCell>Year</TableCell>
                      <TableCell>Exam Date</TableCell><TableCell>Selection Date</TableCell>
                      <TableCell>Classes</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {exams.map((exam) => (
                      <TableRow key={exam.id}>
                        <TableCell><Button size="small" component={Link} to={`/exams/${exam.id}`}>{exam.name}</Button></TableCell>
                        <TableCell>{EXAM_TYPE_LABELS[exam.exam_type] || exam.exam_type}</TableCell>
                        <TableCell>{exam.academic_year}</TableCell>
                        <TableCell>{new Date(exam.exam_date).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(exam.paper_selection_date).toLocaleDateString()}</TableCell>
                        <TableCell>{exam.class_count}</TableCell>
                        <TableCell><Chip label={STATUS_LABELS[exam.status]} size="small" color={STATUS_CHIP[exam.status] || 'default'} /></TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => navigate(`/exams/${exam.id}`)}><VisibilityIcon fontSize="small" /></IconButton>
                          {exam.status === 'draft' && (
                            <IconButton size="small" color="error" onClick={() => { if (confirm(`Delete "${exam.name}"?`)) deleteMutation.mutate(exam.id) }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
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
      )}
    </Box>
  )
}
