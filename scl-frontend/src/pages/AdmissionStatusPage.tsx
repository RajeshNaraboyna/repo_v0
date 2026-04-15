import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import admissionService from '../services/admissionService'
import type { AdmissionStatus } from '../types'
import {
  Box, Typography, Card, CardContent, TextField, Button, Chip, CircularProgress,
} from '@mui/material'
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined'

const statusChipColor: Record<AdmissionStatus, 'default' | 'warning' | 'info' | 'error' | 'success'> = {
  pending: 'warning',
  under_review: 'info',
  documents_required: 'warning',
  approved: 'success',
  rejected: 'error',
  waitlisted: 'default',
  admitted: 'success',
}

const statusLabels: Record<AdmissionStatus, string> = {
  pending: 'Pending',
  under_review: 'Under Review',
  documents_required: 'Documents Required',
  approved: 'Approved',
  rejected: 'Rejected',
  waitlisted: 'Waitlisted',
  admitted: 'Admitted',
}

export default function AdmissionStatusPage() {
  const { requestId } = useParams<{ requestId: string }>()
  const [manualId, setManualId] = useState('')

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admission-status', requestId],
    queryFn: () => admissionService.checkStatus(requestId!),
    enabled: !!requestId,
  })

  const handleSearch = () => {
    if (manualId) window.location.href = `/admission/status/${manualId}`
  }

  if (!requestId) {
    return (
      <Box sx={{ maxWidth: 520, mx: 'auto' }} className="fade-in">
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h2" gutterBottom>Check Application Status</Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Enter your application ID to check the status of your admission request.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                value={manualId}
                onChange={(e) => setManualId(e.target.value.toUpperCase())}
                placeholder="Enter Application ID"
              />
              <Button variant="contained" onClick={handleSearch}>Check</Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    )
  }

  if (isLoading) {
    return (
      <Box sx={{ maxWidth: 520, mx: 'auto', textAlign: 'center', py: 8 }}>
        <CircularProgress />
        <Typography color="text.secondary" sx={{ mt: 2 }}>Loading application status...</Typography>
      </Box>
    )
  }

  if (isError || !data) {
    return (
      <Box sx={{ maxWidth: 520, mx: 'auto' }} className="fade-in">
        <Card>
          <CardContent sx={{ textAlign: 'center', p: 5 }}>
            <ErrorOutlinedIcon sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
            <Typography variant="h3" gutterBottom>Application Not Found</Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              We couldn't find an application with ID: <strong>{requestId}</strong>
            </Typography>
            <Button variant="contained" component={Link} to="/admission">Submit New Application</Button>
          </CardContent>
        </Card>
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 520, mx: 'auto' }} className="fade-in">
      <Card>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h2">Application Status</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              Application ID: <strong style={{ fontFamily: 'monospace' }}>{data.request_id}</strong>
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[
              { label: 'Student Name', value: data.student_name },
              { label: 'Status', value: <Chip label={statusLabels[data.status]} color={statusChipColor[data.status]} size="small" /> },
              { label: 'Submitted On', value: new Date(data.submitted_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) },
              { label: 'Last Updated', value: new Date(data.last_updated).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) },
            ].map((row) => (
              <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                <Typography color="text.secondary">{row.label}</Typography>
                {typeof row.value === 'string' ? <Typography sx={{ fontWeight: 600 }}>{row.value}</Typography> : row.value}
              </Box>
            ))}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button variant="outlined" component={Link} to="/admission">Submit Another</Button>
            <Button variant="contained" color="secondary" onClick={() => refetch()}>Refresh Status</Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
