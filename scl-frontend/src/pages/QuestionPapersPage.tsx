import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import questionPaperService from '../services/questionPaperService'
import type { QuestionPaperResponse, QuestionPaperStatus } from '../types'
import {
  Box, Typography, Card, CardContent, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, CircularProgress, Chip, TextField,
  MenuItem, Grid, IconButton, Alert,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'

const STATUS_CHIP: Record<QuestionPaperStatus, 'default' | 'warning' | 'success' | 'info'> = {
  draft: 'default', review: 'warning', approved: 'success', published: 'info',
}
const EXAM_TYPE_LABELS: Record<string, string> = {
  unit_test: 'Unit Test', quarterly: 'Quarterly', half_yearly: 'Half Yearly', midterm: 'Midterm', final: 'Final',
}

function DownloadPdfButton({ paper }: { paper: QuestionPaperResponse }) {
  const [loading, setLoading] = useState(false)
  return (
    <IconButton
      size="small"
      color="success"
      disabled={loading}
      title="Download PDF"
      onClick={async () => {
        setLoading(true)
        try {
          await questionPaperService.downloadPdf(paper.id, `${paper.title.replace(/\s+/g, '_')}.pdf`)
        } catch { alert('Failed to generate PDF') } finally { setLoading(false) }
      }}
    >
      <PictureAsPdfIcon fontSize="small" />
    </IconButton>
  )
}

export default function QuestionPapersPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [classFilter, setClassFilter] = useState('')

  const { data: papers = [], isLoading, error } = useQuery({
    queryKey: ['question-papers', statusFilter, subjectFilter, classFilter],
    queryFn: () => questionPaperService.getAll({ status: statusFilter || undefined, subject: subjectFilter || undefined, class_name: classFilter || undefined }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => questionPaperService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['question-papers'] }),
  })

  const subjects = [...new Set(papers.map((p) => p.subject))].sort()
  const classes = [...new Set(papers.map((p) => p.class_name))].sort()

  return (
    <Box className="fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h1">Question Papers</Typography>
          <Typography variant="subtitle1" sx={{ mt: 0.5 }}>Create, review and publish question papers</Typography>
        </Box>
        <Button variant="contained" component={Link} to="/question-papers/new" startIcon={<AddIcon />}>New Question Paper</Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ pb: '16px !important' }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField select fullWidth label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="draft">Draft</MenuItem><MenuItem value="review">Under Review</MenuItem>
                <MenuItem value="approved">Approved</MenuItem><MenuItem value="published">Published</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField select fullWidth label="Subject" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
                <MenuItem value="">All Subjects</MenuItem>
                {subjects.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField select fullWidth label="Class" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
                <MenuItem value="">All Classes</MenuItem>
                {classes.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {isLoading && <Box sx={{ textAlign: 'center', py: 8 }}><CircularProgress /></Box>}
      {error && <Alert severity="error" sx={{ mb: 3 }}>Failed to load question papers.</Alert>}

      {!isLoading && !error && (
        <Card>
          <CardContent>
            {papers.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}><Typography color="text.secondary">No question papers found.</Typography></Box>
            ) : (
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell><TableCell>Subject</TableCell><TableCell>Class</TableCell>
                      <TableCell>Exam</TableCell><TableCell>Marks</TableCell><TableCell>Qs</TableCell>
                      <TableCell>Status</TableCell><TableCell>Updated</TableCell><TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {papers.map((paper) => (
                      <TableRow key={paper.id}>
                        <TableCell><Button size="small" component={Link} to={`/question-papers/${paper.id}`}>{paper.title}</Button></TableCell>
                        <TableCell>{paper.subject}</TableCell>
                        <TableCell>{paper.class_name}</TableCell>
                        <TableCell>{EXAM_TYPE_LABELS[paper.exam_type] || paper.exam_type}</TableCell>
                        <TableCell>{paper.total_marks}</TableCell>
                        <TableCell>{paper.questions.length}</TableCell>
                        <TableCell><Chip label={paper.status} size="small" color={STATUS_CHIP[paper.status as QuestionPaperStatus] || 'default'} /></TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{new Date(paper.updated_at).toLocaleDateString()}</TableCell>
                        <TableCell align="right">
                          <DownloadPdfButton paper={paper} />
                          {paper.status === 'draft' && (
                            <IconButton size="small" color="error" onClick={() => { if (confirm(`Delete "${paper.title}"?`)) deleteMutation.mutate(paper.id) }}>
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
