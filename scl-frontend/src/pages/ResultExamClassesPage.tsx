import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import resultService from '../services/resultService'
import type { ResultClassSummary } from '../types'
import {
  Box, Typography, Card, CardContent, Breadcrumbs, CircularProgress, Alert, Grid,
} from '@mui/material'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import SchoolIcon from '@mui/icons-material/School'

export default function ResultExamClassesPage() {
  const { examId } = useParams<{ examId: string }>()
  const numericExamId = Number(examId)

  const { data: classes = [], isLoading, error } = useQuery({
    queryKey: ['result-classes', numericExamId],
    queryFn: () => resultService.getClasses(numericExamId),
    enabled: !!numericExamId,
  })

  return (
    <Box className="fade-in">
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
        <Typography component={Link} to="/results" color="text.secondary" sx={{ textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>Results</Typography>
        <Typography color="text.primary" sx={{ fontWeight: 600 }}>Exam #{examId} – Classes</Typography>
      </Breadcrumbs>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h1">Classes</Typography>
        <Typography variant="subtitle1">Select a class to view students and results</Typography>
      </Box>

      {isLoading && <Box sx={{ textAlign: 'center', py: 8 }}><CircularProgress /></Box>}
      {error && <Alert severity="error">Failed to load classes</Alert>}

      {!isLoading && !error && (
        <Grid container spacing={2.5}>
          {classes.length === 0 ? (
            <Grid size={12}><Box sx={{ textAlign: 'center', py: 8 }}><Typography color="text.secondary">No classes found for this exam.</Typography></Box></Grid>
          ) : classes.map((cls: ResultClassSummary) => (
            <Grid key={cls.class_name} size={{ xs: 12, md: 6, lg: 4 }}>
              <Card
                component={Link}
                to={`/results/${examId}/class/${encodeURIComponent(cls.class_name)}`}
                sx={{ textDecoration: 'none', cursor: 'pointer', '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 } }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <SchoolIcon color="primary" />
                    <Typography variant="h3">Class {cls.class_name}</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary"><strong>{cls.student_count}</strong> students</Typography>
                  <Typography variant="body2" color="text.secondary"><strong>{cls.subjects.length}</strong> subjects: {cls.subjects.join(', ')}</Typography>
                  <Typography variant="body2" color="text.secondary"><strong>{cls.result_count}</strong> results uploaded</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  )
}
