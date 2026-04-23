import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()

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
          <h1 className="text-2xl font-bold text-gray-900">{t('questionPapers.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('questionPapers.subtitle')}
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
        <div className="text-center py-12 text-gray-500">{t('questionPapers.loading')}</div>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('questionPapers.title_col')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('questionPapers.subject')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('questionPapers.class')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('questionPapers.examType')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('questionPapers.totalMarks')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('questionPapers.questions')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('questionPapers.status')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('questionPapers.updated')}</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('questionPapers.actions')}</th>
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
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/question-papers/${paper.id}`)}
                          title={paper.status === 'draft' || paper.status === 'review' ? t('questionPapers.edit') : t('questionPapers.view')}
                          className="p-1.5 rounded-md text-primary-600 hover:bg-primary-50 hover:text-primary-800 transition-colors"
                        >
                          {paper.status === 'draft' || paper.status === 'review' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                        <DownloadPdfButton paper={paper} />
                        {paper.status === 'draft' && (
                          <button
                            onClick={() => handleDelete(paper)}
                            title={t('questionPapers.delete')}
                            className="p-1.5 rounded-md text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
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
