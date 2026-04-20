import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import resultService from '../services/resultService'
import type { ResultStudentSummary } from '../types'
import {
  Box, Typography, Card, CardContent, Breadcrumbs, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Button,
} from '@mui/material'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'

export default function ResultStudentsPage() {
  const { examId, className } = useParams<{ examId: string; className: string }>()
  const numericExamId = Number(examId)
  const decodedClass = decodeURIComponent(className || '')

  const { data: students = [], isLoading, error } = useQuery({
    queryKey: ['result-students', numericExamId, decodedClass],
    queryFn: () => resultService.getStudents(numericExamId, decodedClass),
    enabled: !!numericExamId && !!decodedClass,
  })

  return (
    <Box className="fade-in">
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
        <Typography component={Link} to="/results" color="text.secondary" sx={{ textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>Results</Typography>
        <Typography component={Link} to={`/results/${examId}`} color="text.secondary" sx={{ textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>Exam #{examId}</Typography>
        <Typography color="text.primary" sx={{ fontWeight: 600 }}>Class {decodedClass}</Typography>
      </Breadcrumbs>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h1">Students – Class {decodedClass}</Typography>
        <Typography variant="subtitle1">Click a student to enter marks and upload result PDFs</Typography>
      </Box>

      {isLoading && <Box sx={{ textAlign: 'center', py: 8 }}><CircularProgress /></Box>}
      {error && <Alert severity="error">Failed to load students</Alert>}

      {!isLoading && !error && (
        <Card>
          <CardContent>
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Roll #</TableCell><TableCell>Student Name</TableCell>
                    <TableCell>Subjects Done</TableCell><TableCell>Total Marks</TableCell>
                    <TableCell>PDF</TableCell><TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.length === 0 ? (
                    <TableRow><TableCell colSpan={6} sx={{ textAlign: 'center', py: 6 }}><Typography color="text.secondary">No admitted students found</Typography></TableCell></TableRow>
                  ) : students.map((s: ResultStudentSummary) => (
                    <TableRow key={s.student_id}>
                      <TableCell>{s.roll_number || '—'}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{s.student_name}</TableCell>
                      <TableCell>{s.subjects_completed} / {s.total_subjects}</TableCell>
                      <TableCell>{s.total_marks != null ? `${s.total_marks} / ${s.total_max_marks}` : '—'}</TableCell>
                      <TableCell>{s.has_pdf ? <Chip label="Uploaded" size="small" color="success" /> : '—'}</TableCell>
                      <TableCell>
                        <Button size="small" component={Link} to={`/results/${examId}/class/${encodeURIComponent(decodedClass)}/student/${s.student_id}`}>
                          View / Upload
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}
