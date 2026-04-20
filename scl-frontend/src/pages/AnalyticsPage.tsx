import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import resultService from '../services/resultService'
import type { AnalyticsQueryParams, AnalyticsResultItem } from '../types'
import {
  Box, Typography, Card, CardContent, CircularProgress, Alert, Button, TextField, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Pagination,
  Grid, Divider, InputAdornment,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import FilterListIcon from '@mui/icons-material/FilterList'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import PeopleIcon from '@mui/icons-material/People'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import AssessmentIcon from '@mui/icons-material/Assessment'

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'marks_desc', label: 'Marks (High → Low)' },
  { value: 'marks_asc', label: 'Marks (Low → High)' },
  { value: 'student_name', label: 'Student Name' },
  { value: 'subject', label: 'Subject' },
]

function SummaryCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
        <Box sx={{ width: 48, height: 48, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: color, color: '#fff', flexShrink: 0 }}>
          {icon}
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">{label}</Typography>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{value}</Typography>
        </Box>
      </CardContent>
    </Card>
  )
}

export default function AnalyticsPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [query, setQuery] = useState(searchParams.get('query') || '')
  const [studentName, setStudentName] = useState(searchParams.get('student_name') || '')
  const [className, setClassName] = useState(searchParams.get('class_name') || '')
  const [subject, setSubject] = useState(searchParams.get('subject') || '')
  const [examType, setExamType] = useState(searchParams.get('exam_type') || '')
  const [academicYear, setAcademicYear] = useState(searchParams.get('academic_year') || '')
  const [grade, setGrade] = useState(searchParams.get('grade') || '')
  const [sortBy, setSortBy] = useState<string>(searchParams.get('sort_by') || 'relevance')
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)
  const [submitted, setSubmitted] = useState(false)

  const { data: filters } = useQuery({
    queryKey: ['analytics-filters'],
    queryFn: () => resultService.getAnalyticsFilters(),
  })

  const buildParams = useCallback((): AnalyticsQueryParams => ({
    ...(query && { query }),
    ...(studentName && { student_name: studentName }),
    ...(className && { class_name: className }),
    ...(subject && { subject }),
    ...(examType && { exam_type: examType }),
    ...(academicYear && { academic_year: academicYear }),
    ...(grade && { grade }),
    sort_by: sortBy as AnalyticsQueryParams['sort_by'],
    page,
    page_size: 20,
  }), [query, studentName, className, subject, examType, academicYear, grade, sortBy, page])

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['analytics', buildParams()],
    queryFn: () => resultService.queryAnalytics(buildParams()),
    enabled: submitted,
  })

  // Sync URL params
  useEffect(() => {
    if (!submitted) return
    const p = new URLSearchParams()
    if (query) p.set('query', query)
    if (studentName) p.set('student_name', studentName)
    if (className) p.set('class_name', className)
    if (subject) p.set('subject', subject)
    if (examType) p.set('exam_type', examType)
    if (academicYear) p.set('academic_year', academicYear)
    if (grade) p.set('grade', grade)
    if (sortBy !== 'relevance') p.set('sort_by', sortBy)
    if (page > 1) p.set('page', String(page))
    setSearchParams(p, { replace: true })
  }, [submitted, query, studentName, className, subject, examType, academicYear, grade, sortBy, page, setSearchParams])

  // Auto-search on mount if URL has params
  useEffect(() => {
    if (searchParams.toString()) setSubmitted(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = () => { setPage(1); setSubmitted(true); refetch() }
  const handleClear = () => {
    setQuery(''); setStudentName(''); setClassName(''); setSubject(''); setExamType(''); setAcademicYear(''); setGrade(''); setSortBy('relevance'); setPage(1); setSubmitted(false)
    setSearchParams({}, { replace: true })
  }

  const summary = data?.summary
  const results = data?.results || []

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h1">Analytics</Typography>
        <Typography variant="subtitle1">Search and analyze student results across exams with semantic search</Typography>
      </Box>

      {/* Search & Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <FilterListIcon color="primary" fontSize="small" /><Typography sx={{ fontWeight: 600 }}>Search & Filters</Typography>
          </Box>

          <TextField
            placeholder="Semantic search — e.g. 'students who scored above 90 in math'"
            fullWidth value={query} onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> } }}
            sx={{ mb: 2 }}
          />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField label="Student Name" fullWidth size="small" value={studentName} onChange={(e) => setStudentName(e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField label="Class" fullWidth size="small" select value={className} onChange={(e) => setClassName(e.target.value)}>
                <MenuItem value="">All Classes</MenuItem>
                {filters?.classes?.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField label="Subject" fullWidth size="small" select value={subject} onChange={(e) => setSubject(e.target.value)}>
                <MenuItem value="">All Subjects</MenuItem>
                {filters?.subjects?.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField label="Exam Type" fullWidth size="small" select value={examType} onChange={(e) => setExamType(e.target.value)}>
                <MenuItem value="">All Types</MenuItem>
                {filters?.exam_types?.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField label="Academic Year" fullWidth size="small" select value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}>
                <MenuItem value="">All Years</MenuItem>
                {filters?.academic_years?.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField label="Grade" fullWidth size="small" select value={grade} onChange={(e) => setGrade(e.target.value)}>
                <MenuItem value="">All Grades</MenuItem>
                {filters?.grades?.map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', gap: 2, mt: 2, alignItems: 'center' }}>
            <TextField label="Sort By" size="small" select value={sortBy} onChange={(e) => setSortBy(e.target.value)} sx={{ minWidth: 180 }}>
              {SORT_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </TextField>
            <Box sx={{ flex: 1 }} />
            <Button variant="text" onClick={handleClear}>Clear</Button>
            <Button variant="contained" startIcon={<SearchIcon />} onClick={handleSearch}>Search</Button>
          </Box>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {summary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 6, md: 3 }}>
            <SummaryCard icon={<AssessmentIcon />} label="Total Records" value={summary.total_records} color="#2563eb" />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <SummaryCard icon={<PeopleIcon />} label="Students" value={summary.unique_students} color="#7c3aed" />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <SummaryCard icon={<MenuBookIcon />} label="Subjects" value={summary.unique_subjects} color="#059669" />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <SummaryCard icon={<TrendingUpIcon />} label="Avg %" value={summary.average_percentage != null ? `${summary.average_percentage.toFixed(1)}%` : '—'} color="#ea580c" />
          </Grid>
        </Grid>
      )}

      {/* Grade Distribution & Subject Averages */}
      {summary && (Object.keys(summary.grade_distribution).length > 0 || Object.keys(summary.subject_averages).length > 0) && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {Object.keys(summary.grade_distribution).length > 0 && (
            <Grid size={{ xs: 12, md: 6 }}>
              <Card><CardContent>
                <Typography sx={{ fontWeight: 600, mb: 1 }}>Grade Distribution</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {Object.entries(summary.grade_distribution).map(([g, count]) => (
                    <Chip key={g} label={`${g}: ${count}`} size="small" variant="outlined" />
                  ))}
                </Box>
              </CardContent></Card>
            </Grid>
          )}
          {Object.keys(summary.subject_averages).length > 0 && (
            <Grid size={{ xs: 12, md: 6 }}>
              <Card><CardContent>
                <Typography sx={{ fontWeight: 600, mb: 1 }}>Subject Averages</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {Object.entries(summary.subject_averages).map(([subj, avg]) => (
                    <Chip key={subj} label={`${subj}: ${avg.toFixed(1)}%`} size="small" color="primary" variant="outlined" />
                  ))}
                </Box>
              </CardContent></Card>
            </Grid>
          )}
        </Grid>
      )}

      {/* KB Documents */}
      {data?.kb_documents && data.kb_documents.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography sx={{ fontWeight: 600, mb: 1 }}>Knowledge Base Matches</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {data.kb_documents.map((doc, i) => (
                <Paper key={i} variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 12 }}>{doc}</Typography>
                </Paper>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Loading / Error */}
      {isLoading && <Box sx={{ textAlign: 'center', py: 8 }}><CircularProgress /></Box>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>Search failed</Alert>}

      {/* Results Table */}
      {!isLoading && results.length > 0 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography sx={{ fontWeight: 600 }}>{data?.total_results} result{data?.total_results !== 1 ? 's' : ''}</Typography>
              <Typography variant="body2" color="text.secondary">Page {data?.page} / {data?.total_pages}</Typography>
            </Box>
            <Divider sx={{ mb: 1 }} />
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell><TableCell>Class</TableCell>
                    <TableCell>Exam</TableCell><TableCell>Subject</TableCell>
                    <TableCell>Marks</TableCell><TableCell>%</TableCell>
                    <TableCell>Grade</TableCell>
                    {query && <TableCell>Score</TableCell>}
                    <TableCell>PDF</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {results.map((r: AnalyticsResultItem) => (
                    <TableRow key={r.result_id}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{r.student_name}</Typography>
                        <Typography variant="caption" color="text.secondary">{r.student_id}{r.roll_number ? ` · Roll ${r.roll_number}` : ''}</Typography>
                      </TableCell>
                      <TableCell>{r.class_name}</TableCell>
                      <TableCell>
                        <Typography variant="body2">{r.exam_name}</Typography>
                        <Typography variant="caption" color="text.secondary">{r.exam_type} · {r.academic_year}</Typography>
                      </TableCell>
                      <TableCell>{r.subject}</TableCell>
                      <TableCell>{r.marks_obtained != null ? `${r.marks_obtained}/${r.max_marks}` : '—'}</TableCell>
                      <TableCell>{r.percentage != null ? `${r.percentage.toFixed(1)}%` : '—'}</TableCell>
                      <TableCell>{r.grade ? <Chip label={r.grade} size="small" color={r.grade === 'A' || r.grade === 'A+' ? 'success' : r.grade === 'F' ? 'error' : 'default'} /> : '—'}</TableCell>
                      {query && <TableCell>{r.relevance_score != null ? r.relevance_score.toFixed(3) : '—'}</TableCell>}
                      <TableCell>{r.has_pdf ? <Chip label="PDF" size="small" color="info" variant="outlined" /> : '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {(data?.total_pages ?? 0) > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination count={data?.total_pages || 1} page={page} onChange={(_, v) => setPage(v)} color="primary" />
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* No results */}
      {submitted && !isLoading && !error && results.length === 0 && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <SearchIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary">No results found. Try adjusting your search or filters.</Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}
