import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import resultService from '../services/resultService'
import type {
  AnalyticsQueryParams,
  AnalyticsQueryResponse,
  AnalyticsFilters,
  AnalyticsResultItem,
} from '../types'

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'marks_desc', label: 'Marks (High → Low)' },
  { value: 'marks_asc', label: 'Marks (Low → High)' },
  { value: 'student_name', label: 'Student Name' },
  { value: 'subject', label: 'Subject' },
] as const

const PAGE_SIZES = [10, 20, 50, 100]

export default function AnalyticsPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  // Filters state
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [studentName, setStudentName] = useState(searchParams.get('student') || '')
  const [className, setClassName] = useState(searchParams.get('class') || '')
  const [subject, setSubject] = useState(searchParams.get('subject') || '')
  const [examType, setExamType] = useState(searchParams.get('exam_type') || '')
  const [academicYear, setAcademicYear] = useState(searchParams.get('year') || '')
  const [grade, setGrade] = useState(searchParams.get('grade') || '')
  const [sortBy, setSortBy] = useState<AnalyticsQueryParams['sort_by']>(
    (searchParams.get('sort') as AnalyticsQueryParams['sort_by']) || 'relevance',
  )
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)
  const [pageSize, setPageSize] = useState(Number(searchParams.get('size')) || 20)

  // Data state
  const [response, setResponse] = useState<AnalyticsQueryResponse | null>(null)
  const [filters, setFilters] = useState<AnalyticsFilters | null>(null)
  const [loading, setLoading] = useState(false)
  const [filtersLoading, setFiltersLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(true)

  // Load available filter values
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const data = await resultService.getAnalyticsFilters()
        setFilters(data)
      } catch {
        // Filters are optional — proceed without them
        setFilters({
          classes: [],
          subjects: [],
          exam_types: [],
          academic_years: [],
          grades: [],
        })
      } finally {
        setFiltersLoading(false)
      }
    }
    loadFilters()
  }, [])

  const executeSearch = useCallback(
    async (newPage?: number) => {
      setLoading(true)
      setError(null)
      const currentPage = newPage ?? page

      const params: AnalyticsQueryParams = {
        query: query.trim() || undefined,
        student_name: studentName.trim() || undefined,
        class_name: className || undefined,
        subject: subject || undefined,
        exam_type: examType || undefined,
        academic_year: academicYear || undefined,
        grade: grade || undefined,
        sort_by: sortBy,
        page: currentPage,
        page_size: pageSize,
      }

      // Sync URL
      const sp = new URLSearchParams()
      if (params.query) sp.set('q', params.query)
      if (params.student_name) sp.set('student', params.student_name)
      if (params.class_name) sp.set('class', params.class_name)
      if (params.subject) sp.set('subject', params.subject)
      if (params.exam_type) sp.set('exam_type', params.exam_type)
      if (params.academic_year) sp.set('year', params.academic_year)
      if (params.grade) sp.set('grade', params.grade)
      if (sortBy !== 'relevance') sp.set('sort', sortBy!)
      if (currentPage > 1) sp.set('page', String(currentPage))
      if (pageSize !== 20) sp.set('size', String(pageSize))
      setSearchParams(sp, { replace: true })

      try {
        const data = await resultService.queryAnalytics(params)
        setResponse(data)
        setPage(data.page)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Analytics query failed'
        setError(msg)
      } finally {
        setLoading(false)
      }
    },
    [query, studentName, className, subject, examType, academicYear, grade, sortBy, page, pageSize, setSearchParams],
  )

  // Run initial search if URL has params
  useEffect(() => {
    if (searchParams.toString()) {
      executeSearch()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    executeSearch(1)
  }

  const handleReset = () => {
    setQuery('')
    setStudentName('')
    setClassName('')
    setSubject('')
    setExamType('')
    setAcademicYear('')
    setGrade('')
    setSortBy('relevance')
    setPage(1)
    setPageSize(20)
    setResponse(null)
    setSearchParams({}, { replace: true })
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    executeSearch(newPage)
  }

  const summary = response?.summary

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">
            Search and analyze student results across exams using semantic search and structured filters
          </p>
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
        >
          {showFilters ? 'Hide' : 'Show'} Filters
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
      </div>

      {/* Search & Filters */}
      {showFilters && (
        <form onSubmit={handleSearch} className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
          {/* Semantic search bar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Semantic Search
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. students who scored above 90 in Mathematics..."
                className="flex-1 rounded-lg border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
              <button type="submit" disabled={loading} className="btn-primary text-sm px-6">
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>

          {/* Structured filters grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Student Name</label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Search by name..."
                className="w-full rounded-md border-gray-300 shadow-sm text-sm focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Class</label>
              <select
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm text-sm focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Classes</option>
                {filters?.classes.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm text-sm focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Subjects</option>
                {filters?.subjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Exam Type</label>
              <select
                value={examType}
                onChange={(e) => setExamType(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm text-sm focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Types</option>
                {filters?.exam_types.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Academic Year</label>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm text-sm focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Years</option>
                {filters?.academic_years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Grade</label>
              <input
                type="text"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="e.g. A+, B, C"
                className="w-full rounded-md border-gray-300 shadow-sm text-sm focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as AnalyticsQueryParams['sort_by'])}
                className="w-full rounded-md border-gray-300 shadow-sm text-sm focus:ring-primary-500 focus:border-primary-500"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Results Per Page</label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="w-full rounded-md border-gray-300 shadow-sm text-sm focus:ring-primary-500 focus:border-primary-500"
              >
                {PAGE_SIZES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary text-sm px-6">
              {loading ? 'Searching...' : 'Apply Filters'}
            </button>
            <button type="button" onClick={handleReset} className="btn-secondary text-sm px-4">
              Reset
            </button>
          </div>
        </form>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          <span className="font-medium">Error:</span> {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      )}

      {/* Results */}
      {response && !loading && (
        <>
          {/* Summary cards */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <SummaryCard label="Total Records" value={summary.total_records} />
              <SummaryCard label="Students" value={summary.unique_students} />
              <SummaryCard label="Subjects" value={summary.unique_subjects} />
              <SummaryCard label="Exams" value={summary.unique_exams} />
              <SummaryCard label="Avg %" value={summary.average_percentage != null ? `${summary.average_percentage}%` : '—'} color="blue" />
              <SummaryCard label="Highest %" value={summary.highest_percentage != null ? `${summary.highest_percentage}%` : '—'} color="green" />
              <SummaryCard label="Lowest %" value={summary.lowest_percentage != null ? `${summary.lowest_percentage}%` : '—'} color="red" />
            </div>
          )}

          {/* KB Response */}
          {query.trim() && response.kb_documents && response.kb_documents.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="px-4 py-3 border-b bg-indigo-50 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span className="text-sm font-semibold text-indigo-800">Knowledge Base Response</span>
                <span className="text-xs text-indigo-500 ml-1">({response.kb_documents.length} document{response.kb_documents.length !== 1 ? 's' : ''} matched)</span>
              </div>
              <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                {response.kb_documents.map((doc, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-md p-3 border border-gray-100">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">{idx + 1}</span>
                      <span className="text-xs font-medium text-gray-500">Document</span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{doc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Charts row */}
          {summary && (Object.keys(summary.grade_distribution).length > 0 || Object.keys(summary.subject_averages).length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {Object.keys(summary.grade_distribution).length > 0 && (
                <DistributionCard title="Grade Distribution" data={summary.grade_distribution} />
              )}
              {Object.keys(summary.subject_averages).length > 0 && (
                <DistributionCard title="Subject Avg %" data={summary.subject_averages} valueSuffix="%" />
              )}
              {Object.keys(summary.class_averages).length > 0 && (
                <DistributionCard title="Class Avg %" data={summary.class_averages} valueSuffix="%" />
              )}
            </div>
          )}

          {/* Results table */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                {response.total_results} result{response.total_results !== 1 ? 's' : ''} found
              </span>
              <span className="text-xs text-gray-500">
                Page {response.page} of {response.total_pages}
              </span>
            </div>

            {response.results.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                <p className="text-lg font-medium">No results found</p>
                <p className="text-sm mt-1">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Marks</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">%</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                      {query.trim() && (
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {response.results.map((item) => (
                      <ResultRow key={`${item.result_id}-${item.student_id}`} item={item} showScore={!!query.trim()} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {response.total_pages > 1 && (
              <div className="px-4 py-3 border-t bg-gray-50 flex items-center justify-between">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className="btn-secondary text-sm px-3 py-1 disabled:opacity-50"
                >
                  Previous
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(response.total_pages, 7) }, (_, i) => {
                    let pageNum: number
                    if (response.total_pages <= 7) {
                      pageNum = i + 1
                    } else if (page <= 4) {
                      pageNum = i + 1
                    } else if (page >= response.total_pages - 3) {
                      pageNum = response.total_pages - 6 + i
                    } else {
                      pageNum = page - 3 + i
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-1 text-sm rounded ${
                          pageNum === page
                            ? 'bg-primary-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= response.total_pages}
                  className="btn-secondary text-sm px-3 py-1 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Empty initial state */}
      {!response && !loading && !error && (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900">Search Student Results</h3>
          <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
            Use the semantic search bar to ask natural language questions about student performance,
            or apply structured filters to find specific records. Results that have been indexed to RAG
            will appear here.
          </p>
          <button
            onClick={() => executeSearch(1)}
            className="btn-primary text-sm mt-6 px-6"
          >
            Show All Indexed Results
          </button>
        </div>
      )}

      {filtersLoading && null}
    </div>
  )
}

/* ── Small components ────────────────────────────────────────── */

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string
  value: string | number
  color?: 'blue' | 'green' | 'red'
}) {
  const colorClasses = {
    blue: 'text-blue-700',
    green: 'text-green-700',
    red: 'text-red-700',
  }
  return (
    <div className="bg-white rounded-lg border shadow-sm p-4">
      <p className="text-xs font-medium text-gray-500 uppercase">{label}</p>
      <p className={`text-xl font-bold mt-1 ${color ? colorClasses[color] : 'text-gray-900'}`}>
        {value}
      </p>
    </div>
  )
}

function DistributionCard({
  title,
  data,
  valueSuffix = '',
}: {
  title: string
  data: Record<string, number>
  valueSuffix?: string
}) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1])
  const maxVal = Math.max(...entries.map(([, v]) => v), 1)

  return (
    <div className="bg-white rounded-lg border shadow-sm p-4">
      <h4 className="text-sm font-medium text-gray-700 mb-3">{title}</h4>
      <div className="space-y-2">
        {entries.map(([key, val]) => (
          <div key={key} className="flex items-center gap-2">
            <span className="text-xs text-gray-600 w-20 truncate" title={key}>{key}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
              <div
                className="bg-primary-500 h-full rounded-full transition-all"
                style={{ width: `${(val / maxVal) * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium text-gray-700 w-14 text-right">
              {typeof val === 'number' && val % 1 !== 0 ? val.toFixed(1) : val}{valueSuffix}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ResultRow({ item, showScore }: { item: AnalyticsResultItem; showScore: boolean }) {
  const getPercentColor = (pct?: number) => {
    if (pct == null) return 'text-gray-400'
    if (pct >= 90) return 'text-green-700 font-semibold'
    if (pct >= 75) return 'text-green-600'
    if (pct >= 60) return 'text-blue-600'
    if (pct >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getGradeBadge = (g?: string) => {
    if (!g) return null
    const colors: Record<string, string> = {
      'A+': 'bg-green-100 text-green-800',
      A: 'bg-green-50 text-green-700',
      'B+': 'bg-blue-100 text-blue-800',
      B: 'bg-blue-50 text-blue-700',
      'C+': 'bg-yellow-100 text-yellow-800',
      C: 'bg-yellow-50 text-yellow-700',
      D: 'bg-orange-100 text-orange-800',
      F: 'bg-red-100 text-red-800',
    }
    return (
      <span className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium ${colors[g] || 'bg-gray-100 text-gray-700'}`}>
        {g}
      </span>
    )
  }

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3 text-sm">
        <div className="font-medium text-gray-900">{item.student_name}</div>
        <div className="text-xs text-gray-500">ID: {item.student_id}</div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-700">{item.class_name}</td>
      <td className="px-4 py-3 text-sm text-gray-700">{item.subject}</td>
      <td className="px-4 py-3 text-sm">
        <div className="text-gray-700">{item.exam_name}</div>
        <div className="text-xs text-gray-500">{item.exam_type}</div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">{item.academic_year}</td>
      <td className="px-4 py-3 text-sm text-right text-gray-700">
        {item.marks_obtained != null ? (
          <span>{item.marks_obtained}/{item.max_marks}</span>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>
      <td className={`px-4 py-3 text-sm text-right ${getPercentColor(item.percentage)}`}>
        {item.percentage != null ? `${item.percentage}%` : '—'}
      </td>
      <td className="px-4 py-3 text-center">
        {getGradeBadge(item.grade)}
      </td>
      {showScore && (
        <td className="px-4 py-3 text-sm text-right text-gray-400">
          {item.relevance_score != null ? item.relevance_score.toFixed(3) : '—'}
        </td>
      )}
    </tr>
  )
}
