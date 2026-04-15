import api from './api'
import type {
  QuestionPaperForm,
  QuestionPaperUpdate,
  QuestionPaperResponse,
  QuestionForm,
  QuestionResponse,
} from '../types'

export const questionPaperService = {
  // ---- Question Papers ----

  async getAll(params?: {
    status?: string
    subject?: string
    class_name?: string
    academic_year?: string
    skip?: number
    limit?: number
  }): Promise<QuestionPaperResponse[]> {
    const response = await api.get<QuestionPaperResponse[]>('/question-papers', { params })
    return response.data
  },

  async getById(id: number): Promise<QuestionPaperResponse> {
    const response = await api.get<QuestionPaperResponse>(`/question-papers/${id}`)
    return response.data
  },

  async create(data: QuestionPaperForm): Promise<QuestionPaperResponse> {
    const response = await api.post<QuestionPaperResponse>('/question-papers', data)
    return response.data
  },

  async update(id: number, data: QuestionPaperUpdate): Promise<QuestionPaperResponse> {
    const response = await api.patch<QuestionPaperResponse>(`/question-papers/${id}`, data)
    return response.data
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/question-papers/${id}`)
  },

  async downloadPdf(id: number, filename?: string): Promise<void> {
    const response = await api.get(`/question-papers/${id}/pdf`, {
      responseType: 'blob',
    })
    const blob = new Blob([response.data], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename || `question-paper-${id}.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },

  // ---- Questions within a paper ----

  async addQuestion(paperId: number, data: QuestionForm): Promise<QuestionResponse> {
    const response = await api.post<QuestionResponse>(`/question-papers/${paperId}/questions`, data)
    return response.data
  },

  async updateQuestion(paperId: number, questionId: number, data: Partial<QuestionForm>): Promise<QuestionResponse> {
    const response = await api.patch<QuestionResponse>(
      `/question-papers/${paperId}/questions/${questionId}`,
      data
    )
    return response.data
  },

  async removeQuestion(paperId: number, questionId: number): Promise<void> {
    await api.delete(`/question-papers/${paperId}/questions/${questionId}`)
  },
}

export default questionPaperService
