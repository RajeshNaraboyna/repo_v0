import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import examService from '../services/examService'
import type { ExamEventForm } from '../types'

const EXAM_TYPES = [
  { value: 'unit_test', label: 'Unit Test' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'half_yearly', label: 'Half Yearly' },
  { value: 'midterm', label: 'Midterm' },
  { value: 'final', label: 'Final' },
]

export default function ExamCreatePage() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [academicYear, setAcademicYear] = useState('2025-2026')
  const [examType, setExamType] = useState('midterm')
  const [examDate, setExamDate] = useState('')
  const [paperSelectionDate, setPaperSelectionDate] = useState('')
  const [formError, setFormError] = useState('')

  const createMutation = useMutation({
    mutationFn: (data: ExamEventForm) => examService.create(data),
    onSuccess: (exam) => {
      navigate(`/exams/${exam.id}`)
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.detail || 'Failed to create exam')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!name.trim()) {
      setFormError('Exam name is required')
      return
    }
    if (!examDate) {
      setFormError('Exam date is required')
      return
    }
    if (!paperSelectionDate) {
      setFormError('Paper selection date is required')
      return
    }
    if (new Date(paperSelectionDate) > new Date(examDate)) {
      setFormError('Paper selection date must be on or before the exam date')
      return
    }

    createMutation.mutate({
      name: name.trim(),
      academic_year: academicYear,
      exam_type: examType,
      exam_date: examDate,
      paper_selection_date: paperSelectionDate,
    })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create Exam Event</h1>
        <p className="text-sm text-gray-500 mt-1">
          Set up the exam details, then add classes and attach paper sets.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border p-6 space-y-5">
        {formError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
            {formError}
          </div>
        )}

        {/* Exam Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Exam Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Mid-Term Exams April 2026"
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
            required
          />
        </div>

        {/* Academic Year & Exam Type */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
            >
              <option value="2024-2025">2024-2025</option>
              <option value="2025-2026">2025-2026</option>
              <option value="2026-2027">2026-2027</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exam Type *</label>
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
            >
              {EXAM_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exam Date *</label>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Paper Selection Date *</label>
            <input
              type="date"
              value={paperSelectionDate}
              onChange={(e) => setPaperSelectionDate(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
              required
            />
            <p className="text-xs text-gray-400 mt-1">Must be on or before the exam date</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => navigate('/exams')}
            className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-4 py-2 rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
          >
            {createMutation.isPending ? 'Creating…' : 'Create Exam'}
          </button>
        </div>
      </form>
    </div>
  )
}
