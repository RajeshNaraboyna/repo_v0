import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuth } from '../store/AuthContext'
import admissionService from '../services/admissionService'
import type { AdmissionStatus } from '../types'

const statusColors: Record<AdmissionStatus, { bg: string; text: string }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  under_review: { bg: 'bg-blue-100', text: 'text-blue-800' },
  documents_required: { bg: 'bg-orange-100', text: 'text-orange-800' },
  approved: { bg: 'bg-green-100', text: 'text-green-800' },
  rejected: { bg: 'bg-red-100', text: 'text-red-800' },
  waitlisted: { bg: 'bg-purple-100', text: 'text-purple-800' },
  admitted: { bg: 'bg-teal-100', text: 'text-teal-800' },
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
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, {user?.name}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="card">
          <p className="text-sm text-gray-500">Total Applications</p>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Pending Review</p>
          <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Approved</p>
          <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Admitted</p>
          <p className="text-3xl font-bold text-teal-600">{stats.admitted}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Rejected</p>
          <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
        </div>
      </div>

      {/* Recent Applications Table */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Applications</h2>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading applications...</p>
          </div>
        ) : requests && requests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Student Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Grade</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Submitted</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.slice(0, 10).map((request) => (
                  <tr key={request.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-sm">{request.id}</td>
                    <td className="py-3 px-4">{request.student_name}</td>
                    <td className="py-3 px-4">{request.grade_applying_for}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          statusColors[request.status].bg
                        } ${statusColors[request.status].text}`}
                      >
                        {request.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {new Date(request.submitted_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        to={`/admission/view/${request.id}`}
                        className="text-primary-600 hover:text-primary-800 font-medium text-sm"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No applications found
          </div>
        )}
      </div>
    </div>
  )
}
