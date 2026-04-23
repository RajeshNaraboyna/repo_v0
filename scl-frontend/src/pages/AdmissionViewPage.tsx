import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import admissionService from '../services/admissionService'
import { useSchoolConfig } from '../hooks/useSchoolConfig'
import { useAuth } from '../store/AuthContext'
import type { AdmissionStatus, StudentMarkForm, ClassHistoryForm } from '../types'

const statusColors: Record<AdmissionStatus, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
  under_review: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Under Review' },
  documents_required: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Documents Required' },
  approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
  rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
  waitlisted: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Waitlisted' },
  admitted: { bg: 'bg-teal-100', text: 'text-teal-800', label: 'Admitted' },
}

const allStatuses: AdmissionStatus[] = [
  'pending',
  'under_review',
  'documents_required',
  'approved',
  'rejected',
  'waitlisted',
]

export default function AdmissionViewPage() {
  const { requestId } = useParams<{ requestId: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()

  const [isEditing, setIsEditing] = useState(false)
  const [newStatus, setNewStatus] = useState<AdmissionStatus | ''>('')
  const [reviewerNotes, setReviewerNotes] = useState('')
  const [activeTab, setActiveTab] = useState<'details' | 'marks' | 'class-history'>('details')

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
    
    if (Object.keys(updateData).length > 0) {
      updateMutation.mutate(updateData)
    }
  }

  const handleStartEdit = () => {
    if (request) {
      setNewStatus(request.status)
      setReviewerNotes(request.reviewer_notes || '')
      setIsEditing(true)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading application details...</p>
        </div>
      </div>
    )
  }

  if (isError || !request) {
    return (
      <div className="max-w-4xl mx-auto">
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
          <Link to="/dashboard" className="btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const statusInfo = statusColors[request.status]

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-900 flex items-center gap-2 mb-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Application Details</h1>
          <p className="text-gray-600 mt-1">
            Application ID: <span className="font-mono font-bold">{request.id}</span>
          </p>
        </div>
        <span className={`px-4 py-2 rounded-full text-sm font-medium ${statusInfo.bg} ${statusInfo.text}`}>
          {statusInfo.label}
        </span>
      </div>

      {/* Status Update Section (Admin Only) */}
      {isAuthenticated && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Status Management</h2>
            {!isEditing ? (
              <button onClick={handleStartEdit} className="btn-primary">
                Update Status
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="btn-outline"
                  disabled={updateMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveStatus}
                  className="btn-primary"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as AdmissionStatus)}
                  className="input-field"
                >
                  {allStatuses.map((status) => (
                    <option key={status} value={status}>
                      {statusColors[status].label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reviewer Notes</label>
                <textarea
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  className="input-field"
                  rows={3}
                  placeholder="Add notes about this application..."
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-500">Current Status</span>
                <p className="font-medium text-gray-900">{statusInfo.label}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-500">Reviewer</span>
                <p className="font-medium text-gray-900">{request.reviewer || 'Not assigned'}</p>
              </div>
              {request.reviewer_notes && (
                <div className="col-span-2 p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-500">Reviewer Notes</span>
                  <p className="font-medium text-gray-900">{request.reviewer_notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      {request.status === 'admitted' ? (
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8" aria-label="Tabs">
              {(['details', 'marks', 'class-history'] as const).map((tab) => {
                const labels = { details: 'Details', marks: 'Marks', 'class-history': 'Class History' }
                const isActive = activeTab === tab
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {labels[tab]}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>
      ) : null}

      {/* Tab: Details (always shown for non-admitted, or when details tab is active) */}
      {(request.status !== 'admitted' || activeTab === 'details') && (
        <>
          {/* Student Information */}
          <div className="card mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Student Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField label="Full Name" value={request.student_name} />
              <InfoField
                label="Date of Birth"
                value={new Date(request.date_of_birth).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              />
              <InfoField label="Gender" value={request.gender.charAt(0).toUpperCase() + request.gender.slice(1)} />
              <InfoField label="Grade Applying For" value={request.grade_applying_for} />
              <InfoField label="Academic Year" value={request.academic_year} />
            </div>
          </div>

          {/* Contact Information */}
          <div className="card mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField label="Email" value={request.contact_email} />
              <InfoField label="Phone" value={request.contact_phone} />
              <InfoField label="City" value={request.city} />
              <InfoField label="State" value={request.state} />
            </div>
          </div>

          {/* Primary Guardian */}
          <div className="card mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Primary Guardian</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField label="Name" value={request.primary_guardian.name} />
              <InfoField label="Relationship" value={request.primary_guardian.relationship} />
              <InfoField label="Phone" value={request.primary_guardian.phone} />
              {request.primary_guardian.email && (
                <InfoField label="Email" value={request.primary_guardian.email} />
              )}
              {request.primary_guardian.occupation && (
                <InfoField label="Occupation" value={request.primary_guardian.occupation} />
              )}
              {request.primary_guardian.address && (
                <InfoField label="Address" value={request.primary_guardian.address} className="md:col-span-2" />
              )}
            </div>
          </div>

          {/* Secondary Guardian */}
          {request.secondary_guardian && (
            <div className="card mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Secondary Guardian</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoField label="Name" value={request.secondary_guardian.name} />
                <InfoField label="Relationship" value={request.secondary_guardian.relationship} />
                <InfoField label="Phone" value={request.secondary_guardian.phone} />
                {request.secondary_guardian.email && (
                  <InfoField label="Email" value={request.secondary_guardian.email} />
                )}
                {request.secondary_guardian.occupation && (
                  <InfoField label="Occupation" value={request.secondary_guardian.occupation} />
                )}
                {request.secondary_guardian.address && (
                  <InfoField label="Address" value={request.secondary_guardian.address} className="md:col-span-2" />
                )}
              </div>
            </div>
          )}

          {/* Previous School */}
          {request.previous_school && (
            <div className="card mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Previous School</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoField label="School Name" value={request.previous_school.school_name} />
                <InfoField label="Grade Completed" value={request.previous_school.grade_completed} />
                <InfoField label="Year Completed" value={String(request.previous_school.year_completed)} />
                {request.previous_school.reason_for_leaving && (
                  <InfoField label="Reason for Leaving" value={request.previous_school.reason_for_leaving} />
                )}
                <InfoField
                  label="Transfer Certificate"
                  value={request.previous_school.transfer_certificate ? 'Yes' : 'No'}
                />
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Application Timeline</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField
                label="Submitted At"
                value={new Date(request.submitted_at).toLocaleString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              />
              <InfoField
                label="Last Updated"
                value={new Date(request.updated_at).toLocaleString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              />
            </div>
          </div>
        </>
      )}

      {/* Tab: Marks */}
      {request.status === 'admitted' && activeTab === 'marks' && (
        <MarksSection studentId={request.id} />
      )}

      {/* Tab: Class History */}
      {request.status === 'admitted' && activeTab === 'class-history' && (
        <ClassHistorySection studentId={request.id} />
      )}
    </div>
  )
}

function InfoField({
  label,
  value,
  className = '',
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={`p-3 bg-gray-50 rounded-lg ${className}`}>
      <span className="text-sm text-gray-500">{label}</span>
      <p className="font-medium text-gray-900">{value}</p>
    </div>
  )
}

/* ── Marks Section ─────────────────────────────────────────── */

const emptyMark: StudentMarkForm = {
  exam_name: '',
  subject: '',
  marks_obtained: 0,
  max_marks: 100,
  grade: '',
  academic_year: '2026-2027',
  remarks: '',
}

function MarksSection({ studentId }: { studentId: string }) {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<StudentMarkForm>({ ...emptyMark })

  const { data: marks = [], isLoading } = useQuery({
    queryKey: ['student-marks', studentId],
    queryFn: () => admissionService.getMarks(studentId),
  })

  const addMutation = useMutation({
    mutationFn: (data: StudentMarkForm) => admissionService.addMark(studentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-marks', studentId] })
      setForm({ ...emptyMark })
      setShowForm(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (markId: number) => admissionService.deleteMark(studentId, markId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-marks', studentId] })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.exam_name || !form.subject) return
    addMutation.mutate(form)
  }

  // Group by exam for display
  const examGroups = marks.reduce((acc, m) => {
    const key = `${m.exam_name} (${m.academic_year})`
    if (!acc[key]) acc[key] = []
    acc[key].push(m)
    return acc
  }, {} as Record<string, typeof marks>)

  return (
    <div className="card mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Marks</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary text-sm"
        >
          {showForm ? 'Cancel' : '+ Add Mark'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Exam Name *</label>
              <input
                type="text"
                value={form.exam_name}
                onChange={e => setForm({ ...form, exam_name: e.target.value })}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                placeholder="e.g. Mid-Term"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Subject *</label>
              <input
                type="text"
                value={form.subject}
                onChange={e => setForm({ ...form, subject: e.target.value })}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                placeholder="e.g. Mathematics"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Marks Obtained *</label>
              <input
                type="number"
                value={form.marks_obtained}
                onChange={e => setForm({ ...form, marks_obtained: parseFloat(e.target.value) || 0 })}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Max Marks</label>
              <input
                type="number"
                value={form.max_marks}
                onChange={e => setForm({ ...form, max_marks: parseFloat(e.target.value) || 100 })}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Grade</label>
              <input
                type="text"
                value={form.grade ?? ''}
                onChange={e => setForm({ ...form, grade: e.target.value })}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                placeholder="A+"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Academic Year</label>
              <input
                type="text"
                value={form.academic_year}
                onChange={e => setForm({ ...form, academic_year: e.target.value })}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Remarks</label>
              <input
                type="text"
                value={form.remarks ?? ''}
                onChange={e => setForm({ ...form, remarks: e.target.value })}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-1.5 bg-primary-600 text-white rounded text-sm hover:bg-primary-700 disabled:opacity-50"
              disabled={addMutation.isPending}
            >
              {addMutation.isPending ? 'Saving…' : 'Save Mark'}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <p className="text-gray-500 text-sm">Loading marks…</p>
      ) : marks.length === 0 ? (
        <p className="text-gray-500 text-sm">No marks recorded yet.</p>
      ) : (
        Object.entries(examGroups).map(([exam, subjects]) => (
          <div key={exam} className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">{exam}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-2 px-3 font-medium text-gray-500">Subject</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-500">Marks</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-500">Grade</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-500">Remarks</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map(m => (
                    <tr key={m.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3">{m.subject}</td>
                      <td className="py-2 px-3">{m.marks_obtained} / {m.max_marks}</td>
                      <td className="py-2 px-3">{m.grade || '-'}</td>
                      <td className="py-2 px-3 text-gray-500">{m.remarks || '-'}</td>
                      <td className="py-2 px-3">
                        <button
                          onClick={() => deleteMutation.mutate(m.id)}
                          className="text-red-500 hover:text-red-700 text-xs"
                          disabled={deleteMutation.isPending}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

/* ── Class History Section ─────────────────────────────────── */

const emptyHistory: ClassHistoryForm = {
  academic_year: '2026-2027',
  class_name: '',
  section: '',
  roll_number: '',
  start_date: '',
  end_date: '',
  remarks: '',
}

function ClassHistorySection({ studentId }: { studentId: string }) {
  const queryClient = useQueryClient()
  const { classes, sections } = useSchoolConfig()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<ClassHistoryForm>({ ...emptyHistory })

  const { data: history = [], isLoading } = useQuery({
    queryKey: ['class-history', studentId],
    queryFn: () => admissionService.getClassHistory(studentId),
  })

  const addMutation = useMutation({
    mutationFn: (data: ClassHistoryForm) => admissionService.addClassHistory(studentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-history', studentId] })
      setForm({ ...emptyHistory })
      setShowForm(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (entryId: number) => admissionService.deleteClassHistory(studentId, entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-history', studentId] })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.class_name || !form.section || !form.academic_year) return
    addMutation.mutate(form)
  }

  return (
    <div className="card mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Class History</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary text-sm"
        >
          {showForm ? 'Cancel' : '+ Add Entry'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Academic Year *</label>
              <input
                type="text"
                value={form.academic_year}
                onChange={e => setForm({ ...form, academic_year: e.target.value })}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                placeholder="2026-2027"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Class *</label>
              <select
                value={form.class_name}
                onChange={e => setForm({ ...form, class_name: e.target.value })}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
              >
                <option value="">Select Class</option>
                {classes.map((c: string) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Section *</label>
              <select
                value={form.section}
                onChange={e => setForm({ ...form, section: e.target.value })}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
              >
                <option value="">Select Section</option>
                {sections.map((s: string) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Roll Number</label>
              <input
                type="text"
                value={form.roll_number ?? ''}
                onChange={e => setForm({ ...form, roll_number: e.target.value })}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
              <input
                type="date"
                value={form.start_date ?? ''}
                onChange={e => setForm({ ...form, start_date: e.target.value })}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
              <input
                type="date"
                value={form.end_date ?? ''}
                onChange={e => setForm({ ...form, end_date: e.target.value })}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Remarks</label>
              <input
                type="text"
                value={form.remarks ?? ''}
                onChange={e => setForm({ ...form, remarks: e.target.value })}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-1.5 bg-primary-600 text-white rounded text-sm hover:bg-primary-700 disabled:opacity-50"
              disabled={addMutation.isPending}
            >
              {addMutation.isPending ? 'Saving…' : 'Save Entry'}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <p className="text-gray-500 text-sm">Loading history…</p>
      ) : history.length === 0 ? (
        <p className="text-gray-500 text-sm">No class history recorded yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-2 px-3 font-medium text-gray-500">Academic Year</th>
                <th className="text-left py-2 px-3 font-medium text-gray-500">Class</th>
                <th className="text-left py-2 px-3 font-medium text-gray-500">Section</th>
                <th className="text-left py-2 px-3 font-medium text-gray-500">Roll No.</th>
                <th className="text-left py-2 px-3 font-medium text-gray-500">Duration</th>
                <th className="text-left py-2 px-3 font-medium text-gray-500">Remarks</th>
                <th className="text-left py-2 px-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {history.map(h => (
                <tr key={h.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-3">{h.academic_year}</td>
                  <td className="py-2 px-3">{h.class_name}</td>
                  <td className="py-2 px-3">
                    <span className="px-2 py-0.5 bg-teal-100 text-teal-800 rounded-full text-xs font-medium">{h.section}</span>
                  </td>
                  <td className="py-2 px-3 font-mono">{h.roll_number || '-'}</td>
                  <td className="py-2 px-3 text-gray-500">
                    {h.start_date ? new Date(h.start_date).toLocaleDateString() : '—'}
                    {' – '}
                    {h.end_date ? new Date(h.end_date).toLocaleDateString() : 'Present'}
                  </td>
                  <td className="py-2 px-3 text-gray-500">{h.remarks || '-'}</td>
                  <td className="py-2 px-3">
                    <button
                      onClick={() => deleteMutation.mutate(h.id)}
                      className="text-red-500 hover:text-red-700 text-xs"
                      disabled={deleteMutation.isPending}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
