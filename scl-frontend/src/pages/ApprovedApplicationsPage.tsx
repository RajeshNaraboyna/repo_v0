import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import admissionService from '../services/admissionService'
import { useSchoolConfig } from '../hooks/useSchoolConfig'
import type { AdmissionRequestResponse, ClassAdmitRequest } from '../types'
import {
  Box, Typography, Card, CardContent, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, CircularProgress, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import HowToRegIcon from '@mui/icons-material/HowToReg'

function AdmitDialog({
  application, onClose, onSubmit, isLoading,
}: {
  application: AdmissionRequestResponse; onClose: () => void; onSubmit: (data: ClassAdmitRequest) => void; isLoading: boolean
}) {
  const { grades, sections } = useSchoolConfig()
  const [formData, setFormData] = useState<ClassAdmitRequest>({
    admitted_class: application.grade_applying_for,
    admitted_section: 'A',
    roll_number: '',
  })

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Admit Student to Class</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Admitting: <strong>{application.student_name}</strong>
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField select label="Class *" fullWidth value={formData.admitted_class} onChange={(e) => setFormData({ ...formData, admitted_class: e.target.value })}>
            {grades.map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
          </TextField>
          <TextField select label="Section *" fullWidth value={formData.admitted_section} onChange={(e) => setFormData({ ...formData, admitted_section: e.target.value })}>
            {sections.map((s) => <MenuItem key={s} value={s}>Section {s}</MenuItem>)}
          </TextField>
          <TextField label="Roll Number (optional)" fullWidth value={formData.roll_number || ''} onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })} />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isLoading}>Cancel</Button>
        <Button variant="contained" onClick={() => onSubmit(formData)} disabled={isLoading}>
          {isLoading ? 'Admitting...' : 'Admit to Class'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default function ApprovedApplicationsPage() {
  const queryClient = useQueryClient()
  const [selectedApp, setSelectedApp] = useState<AdmissionRequestResponse | null>(null)

  const { data: applications, isLoading } = useQuery({
    queryKey: ['approved-applications'],
    queryFn: () => admissionService.getAllRequests({ status: 'approved' }),
  })

  const admitMutation = useMutation({
    mutationFn: ({ requestId, data }: { requestId: string; data: ClassAdmitRequest }) =>
      admissionService.admitToClass(requestId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approved-applications'] })
      queryClient.invalidateQueries({ queryKey: ['admission-requests'] })
      setSelectedApp(null)
    },
  })

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h1">Approved Applications</Typography>
        <Typography variant="subtitle1" sx={{ mt: 0.5 }}>
          Admit approved students to their respective classes
        </Typography>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="body2" color="text.secondary">Pending Class Admission</Typography>
            <Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>{applications?.length || 0}</Typography>
          </Box>
          <CheckCircleIcon sx={{ fontSize: 56, color: 'success.light' }} />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h3" sx={{ mb: 2 }}>Approved Students Awaiting Class Assignment</Typography>
          {isLoading ? (
            <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>
          ) : applications && applications.length > 0 ? (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Student Name</TableCell>
                    <TableCell>Grade</TableCell>
                    <TableCell>Year</TableCell>
                    <TableCell>Guardian</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{app.id}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{app.student_name}</TableCell>
                      <TableCell>{app.grade_applying_for}</TableCell>
                      <TableCell>{app.academic_year}</TableCell>
                      <TableCell>
                        <Typography variant="body2">{app.primary_guardian.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{app.primary_guardian.relationship}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{app.contact_phone}</Typography>
                      </TableCell>
                      <TableCell>
                        <Button size="small" variant="contained" startIcon={<HowToRegIcon />} onClick={() => setSelectedApp(app)}>
                          Admit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography color="text.secondary">No approved applications pending</Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {selectedApp && (
        <AdmitDialog
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
          onSubmit={(data) => admitMutation.mutate({ requestId: selectedApp.id, data })}
          isLoading={admitMutation.isPending}
        />
      )}
    </Box>
  )
}
