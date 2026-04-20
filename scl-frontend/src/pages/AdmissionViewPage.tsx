import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import admissionService from '../services/admissionService'
import { useAuth } from '../store/AuthContext'
import type { AdmissionStatus } from '../types'
import {
  Box, Typography, Card, CardContent, Chip, Button, Grid, TextField, MenuItem,
  CircularProgress, Tabs, Tab,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EditIcon from '@mui/icons-material/Edit'
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined'

const statusChipColor: Record<AdmissionStatus, 'default' | 'warning' | 'info' | 'error' | 'success'> = {
  pending: 'warning', under_review: 'info', documents_required: 'warning',
  approved: 'success', rejected: 'error', waitlisted: 'default', admitted: 'success',
}
const statusLabels: Record<AdmissionStatus, string> = {
  pending: 'Pending', under_review: 'Under Review', documents_required: 'Documents Required',
  approved: 'Approved', rejected: 'Rejected', waitlisted: 'Waitlisted', admitted: 'Admitted',
}
const allStatuses: AdmissionStatus[] = ['pending', 'under_review', 'documents_required', 'approved', 'rejected', 'waitlisted']

function InfoField({ label, value, fullWidth }: { label: string; value?: string; fullWidth?: boolean }) {
  return (
    <Grid size={{ xs: 12, md: fullWidth ? 12 : 6 }}>
      <Box sx={{ p: 1.5 }}>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>{value || '—'}</Typography>
      </Box>
    </Grid>
  )
}

export default function AdmissionViewPage() {
  const { requestId } = useParams<{ requestId: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()

  const [isEditing, setIsEditing] = useState(false)
  const [newStatus, setNewStatus] = useState<AdmissionStatus | ''>('')
  const [reviewerNotes, setReviewerNotes] = useState('')
  const [activeTab, setActiveTab] = useState(0)

  const { data: request, isLoading, isError } = useQuery({
    queryKey: ['admission-request', requestId],
    queryFn: () => admissionService.getRequestById(requestId!),
    enabled: !!requestId,
  })

  const updateMutation = useMutation({
    mutationFn: (data: { status?: string; reviewer_notes?: string }) =>
      admissionService.updateRequest(requestId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admission-request', requestId] })
      queryClient.invalidateQueries({ queryKey: ['admission-requests'] })
      setIsEditing(false)
    },
  })

  const handleSaveStatus = () => {
    const updateData: { status?: string; reviewer_notes?: string } = {}
    if (newStatus) updateData.status = newStatus
    if (reviewerNotes) updateData.reviewer_notes = reviewerNotes
    if (Object.keys(updateData).length > 0) updateMutation.mutate(updateData)
  }

  const handleStartEdit = () => {
    if (request) {
      setNewStatus(request.status)
      setReviewerNotes(request.reviewer_notes || '')
      setIsEditing(true)
    }
  }

  if (isLoading) {
    return <Box sx={{ textAlign: 'center', py: 8 }}><CircularProgress /></Box>
  }

  if (isError || !request) {
    return (
      <Box sx={{ maxWidth: 700, mx: 'auto', textAlign: 'center', py: 6 }} className="fade-in">
        <ErrorOutlinedIcon sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
        <Typography variant="h3" gutterBottom>Application Not Found</Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Application ID: <strong>{requestId}</strong>
        </Typography>
        <Button variant="contained" component={Link} to="/dashboard">Back to Dashboard</Button>
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }} className="fade-in">
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Button size="small" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 1 }}>
            Back
          </Button>
          <Typography variant="h1">Application Details</Typography>
          <Typography color="text.secondary">
            ID: <strong style={{ fontFamily: 'monospace' }}>{request.id}</strong>
          </Typography>
        </Box>
        <Chip label={statusLabels[request.status]} color={statusChipColor[request.status]} />
      </Box>

      {/* Status Management */}
      {isAuthenticated && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h3">Status Management</Typography>
              {!isEditing ? (
                <Button variant="contained" size="small" startIcon={<EditIcon />} onClick={handleStartEdit}>
                  Update Status
                </Button>
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="outlined" size="small" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button variant="contained" size="small" onClick={handleSaveStatus} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? 'Saving...' : 'Save'}
                  </Button>
                </Box>
              )}
            </Box>
            {isEditing ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField select label="Status" fullWidth value={newStatus} onChange={(e) => setNewStatus(e.target.value as AdmissionStatus)}>
                  {allStatuses.map((s) => <MenuItem key={s} value={s}>{statusLabels[s]}</MenuItem>)}
                </TextField>
                <TextField label="Reviewer Notes" fullWidth multiline rows={3} value={reviewerNotes} onChange={(e) => setReviewerNotes(e.target.value)} />
              </Box>
            ) : (
              <Grid container spacing={2}>
                <Grid size={6}><Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}><Typography variant="caption" color="text.secondary">Current Status</Typography><Typography sx={{ fontWeight: 600 }}>{statusLabels[request.status]}</Typography></Box></Grid>
                <Grid size={6}><Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}><Typography variant="caption" color="text.secondary">Reviewer</Typography><Typography sx={{ fontWeight: 600 }}>{request.reviewer || 'Not assigned'}</Typography></Box></Grid>
                {request.reviewer_notes && (
                  <Grid size={12}><Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}><Typography variant="caption" color="text.secondary">Notes</Typography><Typography>{request.reviewer_notes}</Typography></Box></Grid>
                )}
              </Grid>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabs for admitted students */}
      {request.status === 'admitted' && (
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Details" />
          <Tab label="Marks" />
          <Tab label="Class History" />
        </Tabs>
      )}

      {(request.status !== 'admitted' || activeTab === 0) && (
        <>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h3" gutterBottom>Student Information</Typography>
              <Grid container>
                <InfoField label="Full Name" value={request.student_name} />
                <InfoField label="Date of Birth" value={new Date(request.date_of_birth).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })} />
                <InfoField label="Gender" value={request.gender.charAt(0).toUpperCase() + request.gender.slice(1)} />
                <InfoField label="Grade Applying For" value={request.grade_applying_for} />
                <InfoField label="Academic Year" value={request.academic_year} />
              </Grid>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h3" gutterBottom>Contact Information</Typography>
              <Grid container>
                <InfoField label="Email" value={request.contact_email} />
                <InfoField label="Phone" value={request.contact_phone} />
                <InfoField label="City" value={request.city} />
                <InfoField label="State" value={request.state} />
              </Grid>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h3" gutterBottom>Primary Guardian</Typography>
              <Grid container>
                <InfoField label="Name" value={request.primary_guardian.name} />
                <InfoField label="Relationship" value={request.primary_guardian.relationship} />
                <InfoField label="Phone" value={request.primary_guardian.phone} />
                {request.primary_guardian.email && <InfoField label="Email" value={request.primary_guardian.email} />}
                {request.primary_guardian.occupation && <InfoField label="Occupation" value={request.primary_guardian.occupation} />}
              </Grid>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  )
}
