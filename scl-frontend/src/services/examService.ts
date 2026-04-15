import api from './api'
import type {
  ExamEventForm,
  ExamEventUpdate,
  ExamEventResponse,
  ExamEventListResponse,
  ExamClassPaperForm,
} from '../types'

export const examService = {
  // ── Exam Events ─────────────────────────────────────────────

  async getAll(params?: {
    academic_year?: string
    status?: string
    skip?: number
    limit?: number
  }): Promise<ExamEventListResponse[]> {
    const response = await api.get<ExamEventListResponse[]>('/exams', { params })
    return response.data
  },

  async getById(id: number): Promise<ExamEventResponse> {
    const response = await api.get<ExamEventResponse>(`/exams/${id}`)
    return response.data
  },

  async create(data: ExamEventForm): Promise<ExamEventResponse> {
    const response = await api.post<ExamEventResponse>('/exams', data)
    return response.data
  },

  async update(id: number, data: ExamEventUpdate): Promise<ExamEventResponse> {
    const response = await api.patch<ExamEventResponse>(`/exams/${id}`, data)
    return response.data
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/exams/${id}`)
  },

  // ── Class Paper Entries ─────────────────────────────────────

  async addClass(examId: number, data: ExamClassPaperForm): Promise<ExamEventResponse> {
    const response = await api.post<ExamEventResponse>(`/exams/${examId}/classes`, data)
    return response.data
  },

  async updateClass(
    examId: number,
    classPaperId: number,
    data: Partial<ExamClassPaperForm>,
  ): Promise<ExamEventResponse> {
    const response = await api.patch<ExamEventResponse>(
      `/exams/${examId}/classes/${classPaperId}`,
      data,
    )
    return response.data
  },

  async removeClass(examId: number, classPaperId: number): Promise<ExamEventResponse> {
    const response = await api.delete<ExamEventResponse>(
      `/exams/${examId}/classes/${classPaperId}`,
    )
    return response.data
  },

  // ── Paper Selection ─────────────────────────────────────────

  async selectPapers(examId: number): Promise<ExamEventResponse> {
    const response = await api.post<ExamEventResponse>(`/exams/${examId}/select-papers`)
    return response.data
  },
}

export default examService
