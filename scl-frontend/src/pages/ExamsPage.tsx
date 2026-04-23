import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import examService from '../services/examService'
import type { ExamEventListResponse, ExamEventStatus } from '../types'

const STATUS_COLORS: Record<ExamEventStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  papers_attached: 'bg-yellow-100 text-yellow-800',
  paper_selected: 'bg-green-100 text-green-800',
  conducted: 'bg-blue-100 text-blue-800',
}

const STATUS_LABELS: Record<ExamEventStatus, string> = {
  draft: 'Draft',
  papers_attached: 'Papers Attached',
  paper_selected: 'Paper Selected',
  conducted: 'Conducted',
}

const EXAM_TYPE_LABELS: Record<string, string> = {
  unit_test: 'Unit Test',
  quarterly: 'Quarterly',
  half_yearly: 'Half Yearly',
  midterm: 'Midterm',
  final: 'Final',
}

export default function ExamsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [statusFilter, setStatusFilter] = useState<string>('')
  const [yearFilter, setYearFilter] = useState<string>('')

  const { data: exams = [], isLoading, error } = useQuery({
    queryKey: ['exams', statusFilter, yearFilter],
    queryFn: () =>
      examService.getAll({
        status: statusFilter || undefined,
        academic_year: yearFilter || undefined,
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => examService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exams'] }),
  })

  const handleDelete = (exam: ExamEventListResponse) => {
    if (exam.status !== 'draft') {
      alert('Only draft exams can be deleted')
      return
    }
    if (confirm(`Delete "${exam.name}"?`)) {
      deleteMutation.mutate(exam.id)
    }
  }

  const years = [...new Set(exams.map((e) => e.academic_year))].sort()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exams</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create exam events, attach paper sets, and randomly select papers
          </p>
        </div>
        <Link
          to="/exams/new"
          className="btn-primary inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          + Create Exam Event
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="papers_attached">Papers Attached</option>
              <option value="paper_selected">Paper Selected</option>
              <option value="conducted">Conducted</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
            >
              <option value="">All Years</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading / Error */}
      {isLoading && (
        <div className="text-center py-12 text-gray-500">Loading exams…</div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Failed to load exams.
        </div>
      )}

      {/* Table */}
      {!isLoading && !error && (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {exams.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No exams found. Click "Create Exam Event" to get started.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Selection Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {exams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/exams/${exam.id}`}
                        className="text-primary-600 hover:text-primary-800 font-medium text-sm"
                      >
                        {exam.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {EXAM_TYPE_LABELS[exam.exam_type] || exam.exam_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{exam.academic_year}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(exam.exam_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(exam.paper_selection_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{exam.class_count}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[exam.status] || 'bg-gray-100 text-gray-800'}`}>
                        {STATUS_LABELS[exam.status] || exam.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                      <button
                        onClick={() => navigate(`/exams/${exam.id}`)}
                        className="text-primary-600 hover:text-primary-800"
                      >
                        View
                      </button>
                      {exam.status === 'draft' && (
                        <button
                          onClick={() => handleDelete(exam)}
                          className="text-red-600 hover:text-red-800 ml-2"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
