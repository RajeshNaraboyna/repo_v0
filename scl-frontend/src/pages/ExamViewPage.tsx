import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import examService from '../services/examService'
import questionPaperService from '../services/questionPaperService'
import { useSchoolConfig } from '../hooks/useSchoolConfig'
import type {
  ExamClassPaperResponse,
  ExamClassPaperForm,
  ExamEventStatus,
} from '../types'

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

// ── Add / Edit Class Modal ────────────────────────────────────

function ClassPaperModal({
  examId,
  examType,
  existing,
  onClose,
}: {
  examId: number
  examType: string
  existing: ExamClassPaperResponse | null
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const { classes } = useSchoolConfig()

  const [className, setClassName] = useState(existing?.class_name || '')
  const [subject, setSubject] = useState(existing?.subject || '')
  const [setA, setSetA] = useState<number | null>(existing?.paper_set_a_id ?? null)
  const [setB, setSetB] = useState<number | null>(existing?.paper_set_b_id ?? null)
  const [setC, setSetC] = useState<number | null>(existing?.paper_set_c_id ?? null)
  const [error, setError] = useState('')

  // Fetch approved/published papers for dropdowns
  const { data: allPapers = [] } = useQuery({
    queryKey: ['question-papers-approved'],
    queryFn: () => questionPaperService.getAll({ status: 'approved' }),
  })
  const { data: publishedPapers = [] } = useQuery({
    queryKey: ['question-papers-published'],
    queryFn: () => questionPaperService.getAll({ status: 'published' }),
  })

  // Combine approved + published, deduplicate by id
  const seenIds = new Set<number>()
  const availablePapers = [...allPapers, ...publishedPapers].filter((p) => {
    if (seenIds.has(p.id)) return false
    seenIds.add(p.id)
    return true
  })

  // Sort: best matches (class + subject + exam type) first, then the rest
  const sortedPapers = [...availablePapers].sort((a, b) => {
    const score = (p: typeof a) => {
      let s = 0
      if (className && p.class_name.toLowerCase() === className.toLowerCase()) s += 4
      if (subject && p.subject.toLowerCase() === subject.toLowerCase()) s += 2
      if (p.exam_type === examType) s += 1
      return s
    }
    return score(b) - score(a)
  })

  const addMutation = useMutation({
    mutationFn: (data: ExamClassPaperForm) => examService.addClass(examId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam', examId] })
      onClose()
    },
    onError: (err: any) => setError(err?.response?.data?.detail || 'Failed'),
  })

  const updateMutation = useMutation({
    mutationFn: (data: Partial<ExamClassPaperForm>) =>
      examService.updateClass(examId, existing!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam', examId] })
      onClose()
    },
    onError: (err: any) => setError(err?.response?.data?.detail || 'Failed'),
  })

  const handleSubmit = () => {
    setError('')
    if (!className.trim() || !subject.trim()) {
      setError('Class and Subject are required')
      return
    }
    // Check duplicates among selected sets
    const ids = [setA, setB, setC].filter(Boolean)
    if (new Set(ids).size !== ids.length) {
      setError('Each paper set must reference a different question paper')
      return
    }

    const payload: ExamClassPaperForm = {
      class_name: className.trim(),
      subject: subject.trim(),
      paper_set_a_id: setA,
      paper_set_b_id: setB,
      paper_set_c_id: setC,
    }

    if (existing) {
      updateMutation.mutate(payload)
    } else {
      addMutation.mutate(payload)
    }
  }

  const isPending = addMutation.isPending || updateMutation.isPending

  const renderPaperSelect = (
    label: string,
    value: number | null,
    onChange: (v: number | null) => void,
  ) => (
    <div className="flex-1 min-w-0">
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
      >
        <option value="">— None —</option>
        {sortedPapers.map((p) => (
          <option key={p.id} value={p.id}>
            #{p.id} – {p.title} ({p.class_name} / {p.subject} / {p.total_marks}m)
          </option>
        ))}
      </select>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 space-y-5 mx-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {existing ? 'Edit Class Entry' : 'Add Class to Exam'}
        </h2>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
            <select
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
            >
              <option value="">Select Class</option>
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Mathematics"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
            />
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-500 mb-2">
            Attach up to 3 paper sets. Dropdowns show approved/published papers matching the class, subject, and exam type.
          </p>
          <div className="flex gap-3">
            {renderPaperSelect('Set A', setA, setSetA)}
            {renderPaperSelect('Set B', setB, setSetB)}
            {renderPaperSelect('Set C', setC, setSetC)}
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="px-4 py-2 rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
          >
            {isPending ? 'Saving…' : existing ? 'Update' : 'Add Class'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Selection Confirm Modal ───────────────────────────────────

function SelectionModal({
  examId,
  classCount,
  onClose,
}: {
  examId: number
  classCount: number
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () => examService.selectPapers(examId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam', examId] })
      onClose()
    },
    onError: (err: any) => setError(err?.response?.data?.detail || 'Failed'),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4 mx-4">
        <h2 className="text-lg font-semibold text-gray-900">Confirm Paper Selection</h2>
        <p className="text-sm text-gray-600">
          This will <strong>randomly</strong> select one paper set (A, B, or C) for all{' '}
          <strong>{classCount}</strong> class entries. This action <strong>cannot be undone</strong>.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-2 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="px-4 py-2 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            {mutation.isPending ? 'Selecting…' : 'Confirm Selection'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────

export default function ExamViewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const examId = Number(id)

  const [modal, setModal] = useState<'add' | 'selection' | null>(null)
  const [editingEntry, setEditingEntry] = useState<ExamClassPaperResponse | null>(null)

  const { data: exam, isLoading, error } = useQuery({
    queryKey: ['exam', examId],
    queryFn: () => examService.getById(examId),
  })

  const removeMutation = useMutation({
    mutationFn: (cpId: number) => examService.removeClass(examId, cpId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exam', examId] }),
  })

  if (isLoading) return <div className="text-center py-12 text-gray-500">Loading…</div>
  if (error || !exam) return <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">Failed to load exam.</div>

  const isLocked = exam.status === 'paper_selected' || exam.status === 'conducted'
  const canSelect =
    exam.status === 'papers_attached' &&
    new Date(exam.paper_selection_date) <= new Date()

  return (
    <div className="space-y-6">
      {/* Back link */}
      <button
        onClick={() => navigate('/exams')}
        className="text-sm text-primary-600 hover:text-primary-800"
      >
        &larr; Back to Exams
      </button>

      {/* Event Summary */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{exam.name}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <span>Type: <strong>{EXAM_TYPE_LABELS[exam.exam_type] || exam.exam_type}</strong></span>
              <span>Year: <strong>{exam.academic_year}</strong></span>
              <span>Exam Date: <strong>{new Date(exam.exam_date).toLocaleDateString()}</strong></span>
              <span>Paper Selection: <strong>{new Date(exam.paper_selection_date).toLocaleDateString()}</strong></span>
            </div>
          </div>
          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[exam.status] || 'bg-gray-100 text-gray-800'}`}>
            {STATUS_LABELS[exam.status] || exam.status}
          </span>
        </div>
      </div>

      {/* Paper Selection banner */}
      {exam.status === 'papers_attached' && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-800">
              {canSelect
                ? 'All papers attached. You can now randomly select papers.'
                : `Paper selection will be available on ${new Date(exam.paper_selection_date).toLocaleDateString()}.`}
            </p>
          </div>
          {canSelect && (
            <button
              onClick={() => setModal('selection')}
              className="px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Select Papers
            </button>
          )}
        </div>
      )}

      {exam.status === 'paper_selected' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm font-medium text-green-800">
            Papers have been randomly selected for all classes. See the "Selected" column below.
          </p>
        </div>
      )}

      {/* Class Papers Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">
            Classes &amp; Paper Sets ({exam.class_papers.length})
          </h2>
          {!isLocked && (
            <button
              onClick={() => {
                setEditingEntry(null)
                setModal('add')
              }}
              className="px-4 py-2 rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              + Add Class
            </button>
          )}
        </div>

        {exam.class_papers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No classes added yet. Click "+ Add Class" to get started.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Set A</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Set B</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Set C</th>
                {exam.status === 'paper_selected' || exam.status === 'conducted' ? (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Selected</th>
                ) : null}
                {!isLocked && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {exam.class_papers.map((cp) => {
                const isSelected = !!cp.selected_set
                return (
                  <tr key={cp.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cp.class_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{cp.subject}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isSelected && cp.selected_set !== 'A' ? 'opacity-40' : ''}`}>
                      {cp.paper_set_a ? (
                        <span className="text-green-700 font-medium" title={cp.paper_set_a.title}>
                          #{cp.paper_set_a.id} – {cp.paper_set_a.title}
                        </span>
                      ) : (
                        <span className="text-red-400">Missing</span>
                      )}
                      {isSelected && cp.selected_set === 'A' && (
                        <span className="ml-2 inline-flex px-1.5 py-0.5 rounded bg-green-100 text-green-800 text-xs font-bold">SELECTED</span>
                      )}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isSelected && cp.selected_set !== 'B' ? 'opacity-40' : ''}`}>
                      {cp.paper_set_b ? (
                        <span className="text-green-700 font-medium" title={cp.paper_set_b.title}>
                          #{cp.paper_set_b.id} – {cp.paper_set_b.title}
                        </span>
                      ) : (
                        <span className="text-red-400">Missing</span>
                      )}
                      {isSelected && cp.selected_set === 'B' && (
                        <span className="ml-2 inline-flex px-1.5 py-0.5 rounded bg-green-100 text-green-800 text-xs font-bold">SELECTED</span>
                      )}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isSelected && cp.selected_set !== 'C' ? 'opacity-40' : ''}`}>
                      {cp.paper_set_c ? (
                        <span className="text-green-700 font-medium" title={cp.paper_set_c.title}>
                          #{cp.paper_set_c.id} – {cp.paper_set_c.title}
                        </span>
                      ) : (
                        <span className="text-red-400">Missing</span>
                      )}
                      {isSelected && cp.selected_set === 'C' && (
                        <span className="ml-2 inline-flex px-1.5 py-0.5 rounded bg-green-100 text-green-800 text-xs font-bold">SELECTED</span>
                      )}
                    </td>
                    {(exam.status === 'paper_selected' || exam.status === 'conducted') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {cp.selected_set ? (
                          <span className="inline-flex px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-bold">
                            Set {cp.selected_set}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                    )}
                    {!isLocked && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                        <button
                          onClick={() => {
                            setEditingEntry(cp)
                            setModal('add')
                          }}
                          className="text-primary-600 hover:text-primary-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Remove ${cp.class_name} – ${cp.subject}?`)) {
                              removeMutation.mutate(cp.id)
                            }
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      {modal === 'add' && (
        <ClassPaperModal
          examId={examId}
          examType={exam.exam_type}
          existing={editingEntry}
          onClose={() => {
            setModal(null)
            setEditingEntry(null)
          }}
        />
      )}

      {modal === 'selection' && (
        <SelectionModal
          examId={examId}
          classCount={exam.class_papers.length}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
