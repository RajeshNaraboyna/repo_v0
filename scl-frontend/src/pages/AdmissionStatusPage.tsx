import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import admissionService from '../services/admissionService'
import type { AdmissionStatus } from '../types'

const statusColors: Record<AdmissionStatus, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
  under_review: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Under Review' },
  documents_required: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Documents Required' },
  approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
  rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
  waitlisted: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Waitlisted' },
  admitted: { bg: 'bg-teal-100', text: 'text-teal-800', label: 'Admitted' },
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
    if (manualId) {
      window.location.href = `/admission/status/${manualId}`
    }
  }

  if (!requestId) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Check Application Status</h2>
          <p className="text-gray-600 mb-6">
            Enter your application ID to check the status of your admission request.
          </p>
          
          <div className="flex space-x-3">
            <input
              type="text"
              value={manualId}
              onChange={(e) => setManualId(e.target.value.toUpperCase())}
              className="input-field flex-1"
              placeholder="Enter Application ID"
            />
            <button onClick={handleSearch} className="btn-primary">
              Check Status
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="card text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading application status...</p>
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="card text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Application Not Found</h2>
          <p className="text-gray-600 mb-6">
            We couldn't find an application with ID: <span className="font-mono font-bold">{requestId}</span>
          </p>
          <Link to="/admission" className="btn-primary">
            Submit New Application
          </Link>
        </div>
      </div>
    )
  }

  const statusInfo = statusColors[data.status]

  return (
    <div className="max-w-xl mx-auto">
      <div className="card">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Application Status</h2>
          <p className="text-gray-600 mt-1">Application ID: <span className="font-mono font-bold">{data.request_id}</span></p>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Student Name</span>
            <span className="font-medium text-gray-900">{data.student_name}</span>
          </div>

          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Status</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bg} ${statusInfo.text}`}>
              {statusInfo.label}
            </span>
          </div>

          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Submitted On</span>
            <span className="font-medium text-gray-900">
              {new Date(data.submitted_at).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>

          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Last Updated</span>
            <span className="font-medium text-gray-900">
              {new Date(data.last_updated).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t flex justify-between">
          <Link to="/admission" className="btn-outline">
            Submit Another
          </Link>
          <button onClick={() => refetch()} className="btn-secondary">
            Refresh Status
          </button>
        </div>
      </div>
    </div>
  )
}
