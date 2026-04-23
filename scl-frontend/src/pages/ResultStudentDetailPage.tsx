import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import resultService from '../services/resultService'
import type { StudentResultResponse } from '../types'

export default function ResultStudentDetailPage() {
  const { examId, className, studentId } = useParams<{
    examId: string
    className: string
    studentId: string
  }>()
  const numericExamId = Number(examId)
  const decodedClass = decodeURIComponent(className || '')
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── State for add-result modal ──────────────────────────────
  const [showModal, setShowModal] = useState(false)
  const [formSubject, setFormSubject] = useState('')
  const [formMarks, setFormMarks] = useState<string>('')
  const [formMaxMarks, setFormMaxMarks] = useState<string>('100')
  const [formGrade, setFormGrade] = useState('')
  const [formRemarks, setFormRemarks] = useState('')

  // ── Upload state ────────────────────────────────────────────
  const [uploadSubject, setUploadSubject] = useState('')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadResultId, setUploadResultId] = useState<number | null>(null)

  const qk = ['student-results', numericExamId, decodedClass, studentId]

  const { data: results = [], isLoading, error } = useQuery({
    queryKey: qk,
    queryFn: () =>
      resultService.getStudentResults(numericExamId, decodedClass, studentId || ''),
    enabled: !!numericExamId && !!decodedClass && !!studentId,
  })

  // ── Mutations ───────────────────────────────────────────────

  const upsertMutation = useMutation({
    mutationFn: () =>
      resultService.upsertResult({
        exam_id: numericExamId,
        student_id: studentId || '',
        class_name: decodedClass,
        subject: formSubject,
        marks_obtained: formMarks !== '' ? Number(formMarks) : undefined,
        max_marks: Number(formMaxMarks) || 100,
        grade: formGrade || undefined,
        remarks: formRemarks || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk })
      setShowModal(false)
      resetForm()
    },
  })

  const uploadPdfMutation = useMutation({
    mutationFn: ({ file, subject }: { file: File; subject: string }) =>
      resultService.uploadPdf(numericExamId, studentId || '', decodedClass, subject, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk })
      setShowUploadModal(false)
      setUploadSubject('')
      setUploadResultId(null)
    },
  })

  const uploadToExistingMutation = useMutation({
    mutationFn: ({ file, resultId }: { file: File; resultId: number }) =>
      resultService.uploadPdfToResult(resultId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk })
      setShowUploadModal(false)
      setUploadResultId(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => resultService.deleteResult(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk }),
  })

  // ── RAG indexing state ──────────────────────────────────────
  const [ragStatus, setRagStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [ragMessage, setRagMessage] = useState('')

  const ragIndexMutation = useMutation({
    mutationFn: () =>
      resultService.indexToRag(numericExamId, decodedClass, studentId || ''),
    onSuccess: (data) => {
      setRagStatus('success')
      setRagMessage(data.message)
      setTimeout(() => setRagStatus('idle'), 5000)
    },
    onError: (err: Error) => {
      setRagStatus('error')
      setRagMessage(err.message || 'Failed to index results')
      setTimeout(() => setRagStatus('idle'), 5000)
    },
  })

  const handleIndexToRag = () => {
    setRagStatus('loading')
    setRagMessage('')
    ragIndexMutation.mutate()
  }

  const resetForm = () => {
    setFormSubject('')
    setFormMarks('')
    setFormMaxMarks('100')
    setFormGrade('')
    setFormRemarks('')
  }

  const openEditModal = (r: StudentResultResponse) => {
    setFormSubject(r.subject)
    setFormMarks(r.marks_obtained != null ? String(r.marks_obtained) : '')
    setFormMaxMarks(String(r.max_marks))
    setFormGrade(r.grade || '')
    setFormRemarks(r.remarks || '')
    setShowModal(true)
  }

  const handleUploadClick = (r: StudentResultResponse) => {
    setUploadResultId(r.id)
    setUploadSubject(r.subject)
    setShowUploadModal(true)
  }

  const handleNewUpload = () => {
    setUploadResultId(null)
    setUploadSubject('')
    setShowUploadModal(true)
  }

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      alert('Only PDF files are accepted')
      return
    }
    if (uploadResultId) {
      uploadToExistingMutation.mutate({ file, resultId: uploadResultId })
    } else if (uploadSubject) {
      uploadPdfMutation.mutate({ file, subject: uploadSubject })
    }
  }

  const handleViewPdf = (r: StudentResultResponse) => {
    const token = localStorage.getItem('access_token')
    const url = resultService.getPdfUrl(r.id)
    // Open in new tab with auth
    window.open(`${url}?token=${token}`, '_blank')
  }

  // ── Totals ──────────────────────────────────────────────────
  const totalObtained = results.reduce(
    (s, r) => s + (r.marks_obtained ?? 0),
    0,
  )
  const totalMax = results.reduce((s, r) => s + r.max_marks, 0)

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center text-sm text-gray-500 space-x-2 flex-wrap">
        <Link to="/results" className="hover:text-primary-600">Results</Link>
        <span>/</span>
        <Link to={`/results/${examId}`} className="hover:text-primary-600">
          Exam #{examId}
        </Link>
        <span>/</span>
        <Link
          to={`/results/${examId}/class/${encodeURIComponent(decodedClass)}`}
          className="hover:text-primary-600"
        >
          Class {decodedClass}
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{studentId}</span>
      </nav>

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Results</h1>
          <p className="text-sm text-gray-500 mt-1">
            Student <span className="font-mono">{studentId}</span> · Class {decodedClass}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleIndexToRag}
            disabled={ragIndexMutation.isPending || results.length === 0}
            className={`text-sm px-4 py-2 rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
              ragStatus === 'success'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : ragStatus === 'error'
                ? 'bg-red-100 text-red-800 border border-red-300'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {ragIndexMutation.isPending ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Indexing…
              </>
            ) : ragStatus === 'success' ? (
              <> ✓ Indexed</>
            ) : ragStatus === 'error' ? (
              <> ✗ Failed</>
            ) : (
              <> 🔍 Index to RAG</>
            )}
          </button>
          <button
            onClick={handleNewUpload}
            className="btn-primary bg-green-600 hover:bg-green-700 text-sm flex items-center gap-1"
          >
            📄 Upload PDF
          </button>
          <button
            onClick={() => { resetForm(); setShowModal(true) }}
            className="btn-primary text-sm"
          >
            + Add Result
          </button>
        </div>
      </div>

      {isLoading && <div className="text-center py-12 text-gray-500">Loading…</div>}
      {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg">Failed to load results</div>}

      {/* RAG indexing status message */}
      {ragStatus !== 'idle' && ragMessage && (
        <div
          className={`p-3 rounded-lg text-sm ${
            ragStatus === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : ragStatus === 'error'
              ? 'bg-red-50 text-red-800 border border-red-200'
              : 'bg-blue-50 text-blue-800 border border-blue-200'
          }`}
        >
          {ragMessage}
        </div>
      )}

      {/* Results Table */}
      {!isLoading && !error && (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marks</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PDF</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {results.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    No results yet. Click "Add Result" to enter marks or "Upload PDF" to attach a document.
                  </td>
                </tr>
              ) : (
                results.map((r: StudentResultResponse) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {r.subject}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {r.marks_obtained != null
                        ? `${r.marks_obtained} / ${r.max_marks}`
                        : '–'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {r.grade || '–'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {r.remarks || '–'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {r.has_pdf ? (
                        <button
                          onClick={() => handleViewPdf(r)}
                          className="text-green-600 hover:text-green-800 font-medium"
                        >
                          📄 View PDF
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUploadClick(r)}
                          className="text-gray-400 hover:text-primary-600"
                        >
                          Upload
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                      <button
                        onClick={() => openEditModal(r)}
                        className="text-primary-600 hover:text-primary-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleUploadClick(r)}
                        className="text-green-600 hover:text-green-800"
                      >
                        {r.has_pdf ? 'Replace PDF' : 'Upload PDF'}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete result for "${r.subject}"?`))
                            deleteMutation.mutate(r.id)
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
              {/* Totals row */}
              {results.length > 0 && (
                <tr className="bg-gray-50 font-semibold">
                  <td className="px-6 py-3 text-sm text-gray-900">Total</td>
                  <td className="px-6 py-3 text-sm text-gray-900">
                    {totalObtained} / {totalMax}
                  </td>
                  <td colSpan={4}></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Add / Edit Result Modal ──────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {formSubject ? `Edit Result – ${formSubject}` : 'Add Result'}
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                upsertMutation.mutate()
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  className="input"
                  required
                  placeholder="e.g. Mathematics"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Marks Obtained
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formMarks}
                    onChange={(e) => setFormMarks(e.target.value)}
                    className="input"
                    placeholder="–"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Marks
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formMaxMarks}
                    onChange={(e) => setFormMaxMarks(e.target.value)}
                    className="input"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                <input
                  type="text"
                  value={formGrade}
                  onChange={(e) => setFormGrade(e.target.value)}
                  className="input"
                  maxLength={5}
                  placeholder="A+, B1, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                <textarea
                  value={formRemarks}
                  onChange={(e) => setFormRemarks(e.target.value)}
                  className="input"
                  rows={2}
                />
              </div>

              {upsertMutation.isError && (
                <p className="text-red-600 text-sm">
                  Error: {(upsertMutation.error as Error).message}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={upsertMutation.isPending}
                  className="btn-primary text-sm"
                >
                  {upsertMutation.isPending ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Upload PDF Modal ─────────────────────────────────── */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Upload Result PDF</h2>
            <div className="space-y-3">
              {!uploadResultId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={uploadSubject}
                    onChange={(e) => setUploadSubject(e.target.value)}
                    className="input"
                    required
                    placeholder="e.g. Mathematics"
                  />
                </div>
              )}
              {uploadResultId && (
                <p className="text-sm text-gray-600">
                  Uploading PDF for <strong>{uploadSubject}</strong>
                </p>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PDF File
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileSelected}
                  className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
              </div>

              {(uploadPdfMutation.isPending || uploadToExistingMutation.isPending) && (
                <p className="text-sm text-primary-600">Uploading…</p>
              )}
              {(uploadPdfMutation.isError || uploadToExistingMutation.isError) && (
                <p className="text-red-600 text-sm">Upload failed. Please try again.</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false)
                    setUploadResultId(null)
                    setUploadSubject('')
                  }}
                  className="px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
