import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import questionPaperService from '../services/questionPaperService'
import type { QuestionPaperResponse, QuestionPaperStatus } from '../types'

function DownloadPdfButton({ paper }: { paper: QuestionPaperResponse }) {
  const [loading, setLoading] = useState(false)
  return (
    <button
      onClick={async () => {
        setLoading(true)
        try {
          const filename = `${paper.title.replace(/\s+/g, '_')}_${paper.class_name}_${paper.exam_type}.pdf`
          await questionPaperService.downloadPdf(paper.id, filename)
        } catch {
          alert('Failed to generate PDF')
        } finally {
          setLoading(false)
        }
      }}
      disabled={loading}
      className="text-green-600 hover:text-green-800 disabled:opacity-50"
      title="Download PDF"
    >
      {loading ? '…' : 'PDF'}
    </button>
  )
}

const STATUS_COLORS: Record<QuestionPaperStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  review: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  published: 'bg-blue-100 text-blue-800',
}

const EXAM_TYPE_LABELS: Record<string, string> = {
  unit_test: 'Unit Test',
  quarterly: 'Quarterly',
  half_yearly: 'Half Yearly',
  midterm: 'Midterm',
  final: 'Final',
}

export default function QuestionPapersPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [statusFilter, setStatusFilter] = useState<string>('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [classFilter, setClassFilter] = useState('')

  const { data: papers = [], isLoading, error } = useQuery({
    queryKey: ['question-papers', statusFilter, subjectFilter, classFilter],
    queryFn: () =>
      questionPaperService.getAll({
        status: statusFilter || undefined,
        subject: subjectFilter || undefined,
        class_name: classFilter || undefined,
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => questionPaperService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['question-papers'] }),
  })

  const handleDelete = (paper: QuestionPaperResponse) => {
    if (paper.status !== 'draft') {
      alert('Only draft papers can be deleted')
      return
    }
    if (confirm(`Delete "${paper.title}"?`)) {
      deleteMutation.mutate(paper.id)
    }
  }

  // Gather unique values for filter dropdowns
  const subjects = [...new Set(papers.map((p) => p.subject))].sort()
  const classes = [...new Set(papers.map((p) => p.class_name))].sort()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Question Papers</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create, review and publish question papers
          </p>
        </div>
        <Link
          to="/question-papers/new"
          className="btn-primary inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          + New Question Paper
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="published">Published</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
            >
              <option value="">All Subjects</option>
              {subjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading / Error */}
      {isLoading && (
        <div className="text-center py-12 text-gray-500">Loading question papers…</div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Failed to load question papers.
        </div>
      )}

      {/* Table */}
      {!isLoading && !error && (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {papers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No question papers found. Click "New Question Paper" to create one.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marks</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Questions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {papers.map((paper) => (
                  <tr key={paper.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/question-papers/${paper.id}`}
                        className="text-primary-600 hover:text-primary-800 font-medium text-sm"
                      >
                        {paper.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{paper.subject}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{paper.class_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {EXAM_TYPE_LABELS[paper.exam_type] || paper.exam_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{paper.total_marks}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{paper.questions.length}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[paper.status as QuestionPaperStatus] || 'bg-gray-100 text-gray-800'}`}>
                        {paper.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(paper.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                      <button
                        onClick={() => navigate(`/question-papers/${paper.id}`)}
                        className="text-primary-600 hover:text-primary-800"
                      >
                        {paper.status === 'draft' || paper.status === 'review' ? 'Edit' : 'View'}
                      </button>
                      <DownloadPdfButton paper={paper} />
                      {paper.status === 'draft' && (
                        <button
                          onClick={() => handleDelete(paper)}
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
