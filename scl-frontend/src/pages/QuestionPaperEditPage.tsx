import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import questionPaperService from '../services/questionPaperService'
import { useSchoolConfig } from '../hooks/useSchoolConfig'
import type {
  QuestionPaperForm,
  QuestionPaperUpdate,
  QuestionForm,
  QuestionResponse,
  ExamType,
  QuestionType,
  QuestionPaperStatus,
} from '../types'

const EXAM_TYPES: { value: ExamType; label: string }[] = [
  { value: 'unit_test', label: 'Unit Test' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'half_yearly', label: 'Half Yearly' },
  { value: 'midterm', label: 'Midterm' },
  { value: 'final', label: 'Final' },
]

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'mcq', label: 'Multiple Choice' },
  { value: 'short_answer', label: 'Short Answer' },
  { value: 'long_answer', label: 'Long Answer' },
  { value: 'descriptive', label: 'Descriptive' },
  { value: 'fill_in_blank', label: 'Fill in the Blank' },
]

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  review: 'Under Review',
  approved: 'Approved',
  published: 'Published',
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  review: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  published: 'bg-blue-100 text-blue-800',
}

const emptyQuestion = (): QuestionForm => ({
  question_number: 1,
  question_text: '',
  question_type: 'descriptive',
  marks: 5,
  section: '',
  expected_answer: '',
})

export default function QuestionPaperEditPage() {
  const { id } = useParams<{ id: string }>()
  const isNew = id === 'new'
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { classes } = useSchoolConfig()

  // ── Paper metadata form state ─────────────────────────────
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [className, setClassName] = useState('')
  const [academicYear, setAcademicYear] = useState('2025-2026')
  const [examType, setExamType] = useState<ExamType>('midterm')
  const [totalMarks, setTotalMarks] = useState(100)
  const [durationMinutes, setDurationMinutes] = useState(180)
  const [instructions, setInstructions] = useState('')

  // ── Questions form state ──────────────────────────────────
  const [questions, setQuestions] = useState<QuestionForm[]>([])
  const [editingQuestionIdx, setEditingQuestionIdx] = useState<number | null>(null)

  // ── Status info (for existing papers) ─────────────────────
  const [paperStatus, setPaperStatus] = useState<QuestionPaperStatus>('draft')
  const [existingQuestions, setExistingQuestions] = useState<QuestionResponse[]>([])
  const [pdfLoading, setPdfLoading] = useState(false)

  // ── Fetch existing paper ──────────────────────────────────
  const { data: paper, isLoading } = useQuery({
    queryKey: ['question-paper', id],
    queryFn: () => questionPaperService.getById(Number(id)),
    enabled: !isNew,
  })

  useEffect(() => {
    if (paper) {
      setTitle(paper.title)
      setSubject(paper.subject)
      setClassName(paper.class_name)
      setAcademicYear(paper.academic_year)
      setExamType(paper.exam_type as ExamType)
      setTotalMarks(paper.total_marks)
      setDurationMinutes(paper.duration_minutes)
      setInstructions(paper.instructions || '')
      setPaperStatus(paper.status)
      setExistingQuestions(paper.questions)
      setQuestions(
        paper.questions.map((q) => ({
          question_number: q.question_number,
          question_text: q.question_text,
          question_type: q.question_type as QuestionType,
          marks: q.marks,
          options: q.options,
          expected_answer: q.expected_answer || '',
          section: q.section || '',
        }))
      )
    }
  }, [paper])

  // ── Mutations ─────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data: QuestionPaperForm) => questionPaperService.create(data),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['question-papers'] })
      navigate(`/question-papers/${created.id}`)
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: QuestionPaperUpdate) => questionPaperService.update(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-papers'] })
      queryClient.invalidateQueries({ queryKey: ['question-paper', id] })
    },
  })

  const addQuestionMutation = useMutation({
    mutationFn: (data: QuestionForm) => questionPaperService.addQuestion(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-paper', id] })
    },
  })

  const updateQuestionMutation = useMutation({
    mutationFn: ({ questionId, data }: { questionId: number; data: Partial<QuestionForm> }) =>
      questionPaperService.updateQuestion(Number(id), questionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-paper', id] })
    },
  })

  const deleteQuestionMutation = useMutation({
    mutationFn: (questionId: number) => questionPaperService.removeQuestion(Number(id), questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-paper', id] })
    },
  })

  const statusMutation = useMutation({
    mutationFn: (newStatus: QuestionPaperStatus) =>
      questionPaperService.update(Number(id), { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-papers'] })
      queryClient.invalidateQueries({ queryKey: ['question-paper', id] })
    },
  })

  // ── Handlers ──────────────────────────────────────────────
  const isEditable = isNew || paperStatus === 'draft' || paperStatus === 'review'

  const handleSavePaper = async () => {
    if (isNew) {
      createMutation.mutate({
        title,
        subject,
        class_name: className,
        academic_year: academicYear,
        exam_type: examType,
        total_marks: totalMarks,
        duration_minutes: durationMinutes,
        instructions: instructions || undefined,
        questions: questions.length > 0 ? questions : undefined,
      })
    } else {
      updateMutation.mutate({
        title,
        subject,
        class_name: className,
        academic_year: academicYear,
        exam_type: examType,
        total_marks: totalMarks,
        duration_minutes: durationMinutes,
        instructions: instructions || undefined,
      })
    }
  }

  const handleAddQuestion = () => {
    const nextNum = questions.length + 1
    const newQ: QuestionForm = { ...emptyQuestion(), question_number: nextNum }
    setQuestions([...questions, newQ])
    setEditingQuestionIdx(questions.length)
  }

  const handleSaveExistingQuestion = (idx: number) => {
    const q = questions[idx]
    if (!q.question_text.trim()) {
      alert('Question text is required.')
      return
    }
    const existingQ = existingQuestions[idx]
    if (existingQ) {
      updateQuestionMutation.mutate({ questionId: existingQ.id, data: q })
    } else if (!isNew && paper) {
      addQuestionMutation.mutate(q)
    }
    setEditingQuestionIdx(null)
  }

  const handleDeleteQuestion = (idx: number) => {
    if (!isNew && existingQuestions[idx]) {
      if (confirm('Remove this question?')) {
        deleteQuestionMutation.mutate(existingQuestions[idx].id)
      }
    } else {
      setQuestions(questions.filter((_, i) => i !== idx).map((q, i) => ({ ...q, question_number: i + 1 })))
    }
  }

  const updateLocalQuestion = (idx: number, field: keyof QuestionForm, value: unknown) => {
    setQuestions(questions.map((q, i) => (i === idx ? { ...q, [field]: value } : q)))
  }

  // ── Status actions ────────────────────────────────────────
  const nextStatusActions: Record<string, { label: string; next: QuestionPaperStatus; color: string }[]> = {
    draft: [
      { label: 'Send for Review', next: 'review', color: 'bg-yellow-500 hover:bg-yellow-600' },
      { label: 'Approve', next: 'approved', color: 'bg-green-500 hover:bg-green-600' },
    ],
    review: [
      { label: 'Approve', next: 'approved', color: 'bg-green-500 hover:bg-green-600' },
      { label: 'Back to Draft', next: 'draft', color: 'bg-gray-500 hover:bg-gray-600' },
    ],
    approved: [
      { label: 'Publish', next: 'published', color: 'bg-blue-500 hover:bg-blue-600' },
      { label: 'Back to Draft', next: 'draft', color: 'bg-gray-500 hover:bg-gray-600' },
    ],
    published: [
      { label: 'Revert to Draft', next: 'draft', color: 'bg-gray-500 hover:bg-gray-600' },
    ],
  }

  if (isLoading && !isNew) {
    return <div className="text-center py-12 text-gray-500">Loading…</div>
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <button onClick={() => navigate('/question-papers')} className="text-sm text-primary-600 hover:text-primary-800 mb-1">
            ← Back to Question Papers
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isNew ? 'New Question Paper' : `Edit: ${paper?.title ?? ''}`}
          </h1>
        </div>
        {!isNew && (
          <div className="flex items-center gap-3">
            <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${STATUS_COLORS[paperStatus]}`}>
              {STATUS_LABELS[paperStatus]}
            </span>
            <button
              onClick={async () => {
                setPdfLoading(true)
                try {
                  const filename = `${paper?.title?.replace(/\s+/g, '_') || 'paper'}_${paper?.class_name || ''}_${paper?.exam_type || ''}.pdf`
                  await questionPaperService.downloadPdf(Number(id), filename)
                } catch {
                  alert('Failed to generate PDF')
                } finally {
                  setPdfLoading(false)
                }
              }}
              disabled={pdfLoading}
              className="px-3 py-1 text-sm text-white rounded-md bg-green-600 hover:bg-green-700 disabled:opacity-50 inline-flex items-center gap-1"
            >
              {pdfLoading ? 'Generating…' : '📄 PDF'}
            </button>
            {(nextStatusActions[paperStatus] || []).map((action) => (
              <button
                key={action.next}
                onClick={() => statusMutation.mutate(action.next)}
                disabled={statusMutation.isPending}
                className={`px-3 py-1 text-sm text-white rounded-md ${action.color}`}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Success / Error banners */}
      {(createMutation.isSuccess || updateMutation.isSuccess) && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm">
          Question paper saved successfully.
        </div>
      )}
      {(createMutation.isError || updateMutation.isError) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
          Failed to save question paper. Please try again.
        </div>
      )}

      {/* Paper Metadata */}
      <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Paper Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!isEditable}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm disabled:bg-gray-100"
              placeholder="e.g. Mathematics Midterm 2025-2026 Class 10"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={!isEditable}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm disabled:bg-gray-100"
              placeholder="e.g. Mathematics"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
            <select
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              disabled={!isEditable}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm disabled:bg-gray-100"
            >
              <option value="">Select Class</option>
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
            <input
              type="text"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              disabled={!isEditable}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm disabled:bg-gray-100"
              placeholder="e.g. 2025-2026"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exam Type *</label>
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value as ExamType)}
              disabled={!isEditable}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm disabled:bg-gray-100"
            >
              {EXAM_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Marks *</label>
            <input
              type="number"
              value={totalMarks}
              onChange={(e) => setTotalMarks(Number(e.target.value))}
              disabled={!isEditable}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm disabled:bg-gray-100"
              min={1}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes) *</label>
            <input
              type="number"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              disabled={!isEditable}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm disabled:bg-gray-100"
              min={1}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              disabled={!isEditable}
              rows={3}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm disabled:bg-gray-100"
              placeholder="General instructions for the paper…"
            />
          </div>
        </div>

        {isEditable && (
          <div className="pt-2">
            <button
              onClick={handleSavePaper}
              disabled={!title || !subject || !className || createMutation.isPending || updateMutation.isPending}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
            >
              {isNew ? 'Create Paper' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      {/* Visual Designer Banner */}
      {!isNew && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-indigo-900">🎨 Visual Question Paper Designer</h3>
            <p className="text-xs text-indigo-700 mt-0.5">
              Build your paper visually with drag-and-drop blocks and a rich text editor
            </p>
          </div>
          <button
            onClick={() => navigate(`/question-papers/${id}/design`)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors"
          >
            Open Designer →
          </button>
        </div>
      )}

      {/* Questions Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">
            Questions ({questions.length})
            {questions.length > 0 && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                Total: {questions.reduce((s, q) => s + q.marks, 0)} / {totalMarks} marks
              </span>
            )}
          </h2>
          {isEditable && (
            <button
              onClick={handleAddQuestion}
              className="px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-sm"
            >
              + Add Question
            </button>
          )}
        </div>

        {questions.length === 0 && (
          <p className="text-gray-500 text-sm py-4 text-center">
            No questions yet. Add questions to build the paper.
          </p>
        )}

        <div className="space-y-3">
          {questions.map((q, idx) => {
            const isEditing = editingQuestionIdx === idx
            return (
              <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-semibold text-gray-700">
                    Q{q.question_number}. {q.section ? `[Section ${q.section}]` : ''}{' '}
                    <span className="font-normal text-gray-500">({q.marks} marks)</span>
                  </span>
                  {isEditable && (
                    <div className="flex gap-2">
                      {!isEditing ? (
                        <button
                          onClick={() => setEditingQuestionIdx(idx)}
                          className="text-xs text-primary-600 hover:text-primary-800"
                        >
                          Edit
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSaveExistingQuestion(idx)}
                          className="text-xs text-green-600 hover:text-green-800"
                        >
                          Save
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteQuestion(idx)}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {isEditing && isEditable ? (
                  <div className="space-y-3 mt-2">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Q#</label>
                        <input
                          type="number"
                          min={1}
                          value={q.question_number}
                          onChange={(e) => updateLocalQuestion(idx, 'question_number', Number(e.target.value))}
                          className="w-full rounded-md border-gray-300 shadow-sm text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                        <select
                          value={q.question_type}
                          onChange={(e) => updateLocalQuestion(idx, 'question_type', e.target.value)}
                          className="w-full rounded-md border-gray-300 shadow-sm text-sm"
                        >
                          {QUESTION_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Marks</label>
                        <input
                          type="number"
                          min={0}
                          step={0.5}
                          value={q.marks}
                          onChange={(e) => updateLocalQuestion(idx, 'marks', Number(e.target.value))}
                          className="w-full rounded-md border-gray-300 shadow-sm text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Section</label>
                        <input
                          type="text"
                          value={q.section || ''}
                          onChange={(e) => updateLocalQuestion(idx, 'section', e.target.value)}
                          placeholder="A, B, C…"
                          className="w-full rounded-md border-gray-300 shadow-sm text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Question Text *</label>
                      <textarea
                        rows={3}
                        value={q.question_text}
                        onChange={(e) => updateLocalQuestion(idx, 'question_text', e.target.value)}
                        className="w-full rounded-md border-gray-300 shadow-sm text-sm"
                        placeholder="Enter the question…"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Expected Answer / Hint</label>
                      <textarea
                        rows={2}
                        value={q.expected_answer || ''}
                        onChange={(e) => updateLocalQuestion(idx, 'expected_answer', e.target.value)}
                        className="w-full rounded-md border-gray-300 shadow-sm text-sm"
                        placeholder="(optional) Answer key / hints"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">{q.question_text || '(empty)'}</div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
