import api from './api'
import type {
  ResultExamSummary,
  ResultClassSummary,
  ResultStudentSummary,
  StudentResultResponse,
  StudentResultForm,
  RagIndexResponse,
  AnalyticsQueryParams,
  AnalyticsQueryResponse,
  AnalyticsFilters,
} from '../types'

export const resultService = {
  // ── Drill-down endpoints ────────────────────────────────────

  async getExams(params?: {
    academic_year?: string
  }): Promise<ResultExamSummary[]> {
    const response = await api.get<ResultExamSummary[]>('/results/exams', { params })
    return response.data
  },

  async getClasses(examId: number): Promise<ResultClassSummary[]> {
    const response = await api.get<ResultClassSummary[]>(`/results/exams/${examId}/classes`)
    return response.data
  },

  async getStudents(examId: number, className: string): Promise<ResultStudentSummary[]> {
    const response = await api.get<ResultStudentSummary[]>(
      `/results/exams/${examId}/classes/${encodeURIComponent(className)}/students`,
    )
    return response.data
  },

  async getStudentResults(
    examId: number,
    className: string,
    studentId: string,
  ): Promise<StudentResultResponse[]> {
    const response = await api.get<StudentResultResponse[]>(
      `/results/exams/${examId}/classes/${encodeURIComponent(className)}/students/${studentId}`,
    )
    return response.data
  },

  // ── CRUD ────────────────────────────────────────────────────

  async upsertResult(data: StudentResultForm): Promise<StudentResultResponse> {
    const response = await api.post<StudentResultResponse>('/results', data)
    return response.data
  },

  async uploadPdf(
    examId: number,
    studentId: string,
    className: string,
    subject: string,
    file: File,
  ): Promise<StudentResultResponse> {
    const formData = new FormData()
    formData.append('exam_id', String(examId))
    formData.append('student_id', studentId)
    formData.append('class_name', className)
    formData.append('subject', subject)
    formData.append('file', file)
    const response = await api.post<StudentResultResponse>('/results/upload-pdf', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  async uploadPdfToResult(resultId: number, file: File): Promise<StudentResultResponse> {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post<StudentResultResponse>(
      `/results/${resultId}/pdf`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    return response.data
  },

  getPdfUrl(resultId: number): string {
    const base = api.defaults.baseURL || '/api/v1'
    return `${base}/results/${resultId}/pdf`
  },

  async deleteResult(resultId: number): Promise<void> {
    await api.delete(`/results/${resultId}`)
  },

  // ── RAG Operations ──────────────────────────────────────────

  async indexToRag(
    examId: number,
    className: string,
    studentId: string,
  ): Promise<RagIndexResponse> {
    const response = await api.post<RagIndexResponse>(
      `/results/exams/${examId}/classes/${encodeURIComponent(className)}/students/${studentId}/index-to-rag`,
    )
    return response.data
  },

  // ── Analytics Operations ────────────────────────────────────

  async queryAnalytics(params: AnalyticsQueryParams): Promise<AnalyticsQueryResponse> {
    const response = await api.post<AnalyticsQueryResponse>('/results/analytics/query', null, {
      params: {
        ...(params.query && { query: params.query }),
        ...(params.student_id && { student_id: params.student_id }),
        ...(params.student_name && { student_name: params.student_name }),
        ...(params.class_name && { class_name: params.class_name }),
        ...(params.subject && { subject: params.subject }),
        ...(params.exam_id && { exam_id: params.exam_id }),
        ...(params.exam_type && { exam_type: params.exam_type }),
        ...(params.academic_year && { academic_year: params.academic_year }),
        ...(params.min_marks !== undefined && { min_marks: params.min_marks }),
        ...(params.max_marks_filter !== undefined && { max_marks_filter: params.max_marks_filter }),
        ...(params.grade && { grade: params.grade }),
        ...(params.sort_by && { sort_by: params.sort_by }),
        ...(params.page && { page: params.page }),
        ...(params.page_size && { page_size: params.page_size }),
      },
    })
    return response.data
  },

  async getAnalyticsFilters(): Promise<AnalyticsFilters> {
    const response = await api.get<AnalyticsFilters>('/results/analytics/filters')
    return response.data
  },
}

export default resultService
