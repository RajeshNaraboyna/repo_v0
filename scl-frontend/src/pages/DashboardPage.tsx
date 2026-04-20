import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuth } from '../store/AuthContext'
import admissionService from '../services/admissionService'
import type { AdmissionStatus } from '../types'
import {
  Box, Typography, Card, CardContent, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, CircularProgress, Button, Paper,
} from '@mui/material'
import PeopleIcon from '@mui/icons-material/People'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import HowToRegIcon from '@mui/icons-material/HowToReg'
import CancelIcon from '@mui/icons-material/Cancel'
import VisibilityIcon from '@mui/icons-material/Visibility'

const statusChipColor: Record<AdmissionStatus, 'default' | 'warning' | 'info' | 'error' | 'success'> = {
  pending: 'warning',
  under_review: 'info',
  documents_required: 'warning',
  approved: 'success',
  rejected: 'error',
  waitlisted: 'default',
  admitted: 'success',
}

interface StatCardProps {
  label: string
  value: number
  color: string
  icon: React.ReactNode
}

function StatCard({ label, value, color, icon }: StatCardProps) {
  return (
    <Card sx={{ flex: 1, minWidth: 160 }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box
          sx={{
            width: 48, height: 48, borderRadius: 2.5,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            bgcolor: `${color}15`, color,
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary">{label}</Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color }}>{value}</Typography>
        </Box>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()

  const { data: requests, isLoading } = useQuery({
    queryKey: ['admission-requests'],
    queryFn: () => admissionService.getAllRequests(),
  })

  const stats = requests
    ? {
        total: requests.length,
        pending: requests.filter((r) => r.status === 'pending').length,
        approved: requests.filter((r) => r.status === 'approved').length,
        admitted: requests.filter((r) => r.status === 'admitted').length,
        rejected: requests.filter((r) => r.status === 'rejected').length,
      }
    : { total: 0, pending: 0, approved: 0, admitted: 0, rejected: 0 }

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h1">Dashboard</Typography>
        <Typography variant="subtitle1" sx={{ mt: 0.5 }}>
          Welcome back, {user?.name}
        </Typography>
      </Box>

      {/* Stats */}
      <Box sx={{ display: 'flex', gap: 2.5, flexWrap: 'wrap', mb: 4 }}>
        <StatCard label="Total Applications" value={stats.total} color="#1e293b" icon={<PeopleIcon />} />
        <StatCard label="Pending Review" value={stats.pending} color="#f59e0b" icon={<HourglassEmptyIcon />} />
        <StatCard label="Approved" value={stats.approved} color="#10b981" icon={<CheckCircleIcon />} />
        <StatCard label="Admitted" value={stats.admitted} color="#0891b2" icon={<HowToRegIcon />} />
        <StatCard label="Rejected" value={stats.rejected} color="#ef4444" icon={<CancelIcon />} />
      </Box>

      {/* Recent Applications */}
      <Card>
        <CardContent>
          <Typography variant="h3" sx={{ mb: 2 }}>Recent Applications</Typography>

          {isLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6 }}>
              <CircularProgress />
              <Typography color="text.secondary" sx={{ mt: 2 }}>Loading applications...</Typography>
            </Box>
          ) : requests && requests.length > 0 ? (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Student Name</TableCell>
                    <TableCell>Grade</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Submitted</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requests.slice(0, 10).map((request) => (
                    <TableRow key={request.id}>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{request.id}</TableCell>
                      <TableCell>{request.student_name}</TableCell>
                      <TableCell>{request.grade_applying_for}</TableCell>
                      <TableCell>
                        <Chip
                          label={request.status.replace('_', ' ')}
                          size="small"
                          color={statusChipColor[request.status] || 'default'}
                        />
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                        {new Date(request.submitted_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          component={Link}
                          to={`/admission/view/${request.id}`}
                          size="small"
                          startIcon={<VisibilityIcon />}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography color="text.secondary">No applications found</Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
