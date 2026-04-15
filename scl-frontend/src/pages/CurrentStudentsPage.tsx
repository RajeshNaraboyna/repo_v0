import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import admissionService from '../services/admissionService'
import type { AdmissionRequestResponse } from '../types'
import {
  Box, Typography, Card, CardContent, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, CircularProgress, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Grid,
  IconButton, InputAdornment,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import VisibilityIcon from '@mui/icons-material/Visibility'
import DeleteIcon from '@mui/icons-material/Delete'
import CloseIcon from '@mui/icons-material/Close'
import PersonAddIcon from '@mui/icons-material/PersonAdd'

function StudentDetailDialog({ student, onClose }: { student: AdmissionRequestResponse; onClose: () => void }) {
  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Student Details
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ bgcolor: 'info.main', color: 'info.contrastText', borderRadius: 2, p: 2.5, mb: 3, opacity: 0.9 }}>
          <Typography variant="h5" sx={{ color: 'inherit' }} gutterBottom>Class Information</Typography>
          <Grid container spacing={2}>
            <Grid size={4}><Typography variant="caption" sx={{ opacity: 0.8 }}>Class</Typography><Typography sx={{ fontWeight: 600 }}>{student.admitted_class}</Typography></Grid>
            <Grid size={4}><Typography variant="caption" sx={{ opacity: 0.8 }}>Section</Typography><Typography sx={{ fontWeight: 600 }}>{student.admitted_section}</Typography></Grid>
            <Grid size={4}><Typography variant="caption" sx={{ opacity: 0.8 }}>Roll Number</Typography><Typography sx={{ fontWeight: 600 }}>{student.roll_number || 'N/A'}</Typography></Grid>
          </Grid>
        </Box>
        <Typography variant="h5" sx={{ mb: 1.5 }}>Student Information</Typography>
        <Grid container spacing={1.5} sx={{ mb: 3 }}>
          {[
            ['Full Name', student.student_name],
            ['DOB', new Date(student.date_of_birth).toLocaleDateString()],
            ['Gender', student.gender],
            ['Academic Year', student.academic_year],
          ].map(([label, val]) => (
            <Grid key={label} size={6}><Typography variant="caption" color="text.secondary">{label}</Typography><Typography variant="body2" sx={{ fontWeight: 500 }}>{val}</Typography></Grid>
          ))}
        </Grid>
        <Typography variant="h5" sx={{ mb: 1.5 }}>Contact</Typography>
        <Grid container spacing={1.5} sx={{ mb: 3 }}>
          <Grid size={6}><Typography variant="caption" color="text.secondary">Phone</Typography><Typography variant="body2">{student.contact_phone}</Typography></Grid>
          <Grid size={6}><Typography variant="caption" color="text.secondary">Email</Typography><Typography variant="body2">{student.contact_email}</Typography></Grid>
          <Grid size={12}><Typography variant="caption" color="text.secondary">City, State</Typography><Typography variant="body2">{student.city}, {student.state}</Typography></Grid>
        </Grid>
        <Typography variant="h5" sx={{ mb: 1.5 }}>Primary Guardian</Typography>
        <Grid container spacing={1.5}>
          <Grid size={6}><Typography variant="caption" color="text.secondary">Name</Typography><Typography variant="body2">{student.primary_guardian.name}</Typography></Grid>
          <Grid size={6}><Typography variant="caption" color="text.secondary">Relationship</Typography><Typography variant="body2">{student.primary_guardian.relationship}</Typography></Grid>
          <Grid size={6}><Typography variant="caption" color="text.secondary">Phone</Typography><Typography variant="body2">{student.primary_guardian.phone}</Typography></Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="outlined" component={Link} to={`/admission/view/${student.id}`}>View Full Application</Button>
        <Button variant="contained" onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}

export default function CurrentStudentsPage() {
  const [selectedStudent, setSelectedStudent] = useState<AdmissionRequestResponse | null>(null)
  const [filterClass, setFilterClass] = useState('')
  const [filterSection, setFilterSection] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<AdmissionRequestResponse | null>(null)
  const queryClient = useQueryClient()

  const { data: students, isLoading } = useQuery({
    queryKey: ['admitted-students'],
    queryFn: () => admissionService.getAllRequests({ status: 'admitted' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => admissionService.deleteStudent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admitted-students'] })
      setDeleteTarget(null)
    },
  })

  const filteredStudents = (students || []).filter((s) => {
    if (filterClass && s.admitted_class !== filterClass) return false
    if (filterSection && s.admitted_section !== filterSection) return false
    if (searchQuery && !s.student_name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const classes = [...new Set((students || []).map((s) => s.admitted_class).filter(Boolean))].sort()
  const sections = [...new Set((students || []).map((s) => s.admitted_section).filter(Boolean))].sort()

  return (
    <Box className="fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h1">Students</Typography>
          <Typography variant="subtitle1" sx={{ mt: 0.5 }}>
            {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} enrolled
          </Typography>
        </Box>
        <Button variant="contained" component={Link} to="/students/add" startIcon={<PersonAddIcon />}>
          Add Student
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ pb: '16px !important' }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> } }}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 4 }}>
              <TextField select fullWidth label="Class" value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
                <MenuItem value="">All Classes</MenuItem>
                {classes.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 6, md: 4 }}>
              <TextField select fullWidth label="Section" value={filterSection} onChange={(e) => setFilterSection(e.target.value)}>
                <MenuItem value="">All Sections</MenuItem>
                {sections.map((s) => <MenuItem key={s} value={s}>Section {s}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent>
          {isLoading ? (
            <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>
          ) : filteredStudents.length > 0 ? (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Student Name</TableCell>
                    <TableCell>Class</TableCell>
                    <TableCell>Section</TableCell>
                    <TableCell>Roll #</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Guardian</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredStudents.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell sx={{ fontWeight: 600 }}>{s.student_name}</TableCell>
                      <TableCell>{s.admitted_class}</TableCell>
                      <TableCell>{s.admitted_section}</TableCell>
                      <TableCell>{s.roll_number || '—'}</TableCell>
                      <TableCell>{s.contact_phone}</TableCell>
                      <TableCell>{s.primary_guardian.name}</TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => setSelectedStudent(s)} title="View"><VisibilityIcon fontSize="small" /></IconButton>
                        <IconButton size="small" color="error" onClick={() => setDeleteTarget(s)} title="Delete"><DeleteIcon fontSize="small" /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography color="text.secondary">No students found</Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {selectedStudent && <StudentDetailDialog student={selectedStudent} onClose={() => setSelectedStudent(null)} />}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <Dialog open onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
          <DialogTitle>Remove Student?</DialogTitle>
          <DialogContent>
            <Typography>Are you sure you want to remove <strong>{deleteTarget.student_name}</strong>?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="contained" color="error" onClick={() => deleteMutation.mutate(deleteTarget.id)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Removing...' : 'Remove'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  )
}
