import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import resultService from '../services/resultService'
import type { ResultExamSummary } from '../types'

const EXAM_TYPE_LABELS: Record<string, string> = {
  unit_test: 'Unit Test',
  quarterly: 'Quarterly',
  half_yearly: 'Half Yearly',
  midterm: 'Midterm',
  final: 'Final',
}

export default function ResultsPage() {
  const [yearFilter, setYearFilter] = useState<string>('')

  const { data: exams = [], isLoading, error } = useQuery({
    queryKey: ['result-exams', yearFilter],
    queryFn: () =>
      resultService.getExams({
        academic_year: yearFilter || undefined,
      }),
  })

  const years = [...new Set(exams.map((e) => e.academic_year))].sort()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Results</h1>
        <p className="text-sm text-gray-500 mt-1">
          View and upload student results by exam, class, and subject
        </p>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Academic Year</label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="input"
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
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          Failed to load exams
        </div>
      )}

      {/* Table */}
      {!isLoading && !error && (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Results</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {exams.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                    No exams found
                  </td>
                </tr>
              ) : (
                exams.map((exam: ResultExamSummary) => (
                  <tr key={exam.exam_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/results/${exam.exam_id}`}
                        className="text-primary-600 hover:text-primary-800 font-medium"
                      >
                        {exam.exam_name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {EXAM_TYPE_LABELS[exam.exam_type] || exam.exam_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {exam.academic_year}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(exam.exam_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {exam.class_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {exam.result_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        to={`/results/${exam.exam_id}`}
                        className="text-primary-600 hover:text-primary-800"
                      >
                        View Classes
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
