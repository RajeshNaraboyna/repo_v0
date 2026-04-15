import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import resultService from '../services/resultService'
import type { ResultClassSummary } from '../types'

export default function ResultExamClassesPage() {
  const { examId } = useParams<{ examId: string }>()
  const numericExamId = Number(examId)

  const { data: classes = [], isLoading, error } = useQuery({
    queryKey: ['result-classes', numericExamId],
    queryFn: () => resultService.getClasses(numericExamId),
    enabled: !!numericExamId,
  })

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center text-sm text-gray-500 space-x-2">
        <Link to="/results" className="hover:text-primary-600">Results</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Exam #{examId} – Classes</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
        <p className="text-sm text-gray-500 mt-1">
          Select a class to view students and their results
        </p>
      </div>

      {isLoading && <div className="text-center py-12 text-gray-500">Loading…</div>}
      {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg">Failed to load classes</div>}

      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-400">
              No classes found for this exam. Add classes to the exam first.
            </div>
          ) : (
            classes.map((cls: ResultClassSummary) => (
              <Link
                key={cls.class_name}
                to={`/results/${examId}/class/${encodeURIComponent(cls.class_name)}`}
                className="bg-white rounded-lg shadow-sm border p-5 hover:shadow-md transition-shadow"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Class {cls.class_name}
                </h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>
                    <span className="font-medium">{cls.student_count}</span> students
                  </p>
                  <p>
                    <span className="font-medium">{cls.subjects.length}</span> subjects:{' '}
                    <span className="text-gray-500">{cls.subjects.join(', ')}</span>
                  </p>
                  <p>
                    <span className="font-medium">{cls.result_count}</span> results uploaded
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  )
}
