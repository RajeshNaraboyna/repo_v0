import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import resultService from '../services/resultService'
import type { ResultStudentSummary } from '../types'

export default function ResultStudentsPage() {
  const { examId, className } = useParams<{ examId: string; className: string }>()
  const numericExamId = Number(examId)
  const decodedClass = decodeURIComponent(className || '')

  const { data: students = [], isLoading, error } = useQuery({
    queryKey: ['result-students', numericExamId, decodedClass],
    queryFn: () => resultService.getStudents(numericExamId, decodedClass),
    enabled: !!numericExamId && !!decodedClass,
  })

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center text-sm text-gray-500 space-x-2">
        <Link to="/results" className="hover:text-primary-600">Results</Link>
        <span>/</span>
        <Link to={`/results/${examId}`} className="hover:text-primary-600">
          Exam #{examId}
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Class {decodedClass}</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Students – Class {decodedClass}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Click a student to enter marks and upload result PDFs
        </p>
      </div>

      {isLoading && <div className="text-center py-12 text-gray-500">Loading…</div>}
      {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg">Failed to load students</div>}

      {!isLoading && !error && (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subjects Done</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Marks</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PDF</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    No admitted students found for this class
                  </td>
                </tr>
              ) : (
                students.map((s: ResultStudentSummary) => (
                  <tr key={s.student_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {s.roll_number || '–'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {s.student_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {s.subjects_completed} / {s.total_subjects}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {s.total_marks != null
                        ? `${s.total_marks} / ${s.total_max_marks}`
                        : '–'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {s.has_pdf ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          ✓ Uploaded
                        </span>
                      ) : (
                        <span className="text-gray-400">–</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        to={`/results/${examId}/class/${encodeURIComponent(decodedClass)}/student/${s.student_id}`}
                        className="text-primary-600 hover:text-primary-800 font-medium"
                      >
                        View / Upload
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
