import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import resultService from '../services/resultService'
import type { ResultExamSummary } from '../types'
import {
  Box, Typography, Card, CardContent, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, CircularProgress, TextField,
  MenuItem, Alert,
} from '@mui/material'

const EXAM_TYPE_LABELS: Record<string, string> = {
  unit_test: 'Unit Test', quarterly: 'Quarterly', half_yearly: 'Half Yearly', midterm: 'Midterm', final: 'Final',
}

export default function ResultsPage() {
  const [yearFilter, setYearFilter] = useState('')

  const { data: exams = [], isLoading, error } = useQuery({
    queryKey: ['result-exams', yearFilter],
    queryFn: () => resultService.getExams({ academic_year: yearFilter || undefined }),
  })

  const years = [...new Set(exams.map((e) => e.academic_year))].sort()

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h1">Results</Typography>
        <Typography variant="subtitle1" sx={{ mt: 0.5 }}>View and upload student results by exam, class, and subject</Typography>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ pb: '16px !important' }}>
          <TextField select fullWidth label="Academic Year" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} sx={{ maxWidth: 300 }}>
            <MenuItem value="">All Years</MenuItem>
            {years.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </TextField>
        </CardContent>
      </Card>

      {isLoading && <Box sx={{ textAlign: 'center', py: 8 }}><CircularProgress /></Box>}
      {error && <Alert severity="error">Failed to load exams</Alert>}

      {!isLoading && !error && (
        <Card>
          <CardContent>
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Exam Name</TableCell><TableCell>Type</TableCell><TableCell>Year</TableCell>
                    <TableCell>Exam Date</TableCell><TableCell>Classes</TableCell><TableCell>Results</TableCell><TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {exams.length === 0 ? (
                    <TableRow><TableCell colSpan={7} sx={{ textAlign: 'center', py: 6 }}><Typography color="text.secondary">No exams found</Typography></TableCell></TableRow>
                  ) : exams.map((exam: ResultExamSummary) => (
                    <TableRow key={exam.exam_id}>
                      <TableCell><Button size="small" component={Link} to={`/results/${exam.exam_id}`}>{exam.exam_name}</Button></TableCell>
                      <TableCell>{EXAM_TYPE_LABELS[exam.exam_type] || exam.exam_type}</TableCell>
                      <TableCell>{exam.academic_year}</TableCell>
                      <TableCell>{new Date(exam.exam_date).toLocaleDateString()}</TableCell>
                      <TableCell>{exam.class_count}</TableCell>
                      <TableCell>{exam.result_count}</TableCell>
                      <TableCell><Button size="small" component={Link} to={`/results/${exam.exam_id}`}>View Classes</Button></TableCell>
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
