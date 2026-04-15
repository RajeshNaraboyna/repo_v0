import api from './api'
import type { 
  AdmissionRequestForm, 
  AdmissionRequestResponse, 
  AdmissionStatusCheck,
  ClassAdmitRequest,
  DirectStudentForm,
  StudentMarkForm,
  StudentMarkResponse,
  ClassHistoryForm,
  ClassHistoryResponse,
} from '../types'

// Helper function to clean empty strings to undefined for optional fields
function cleanFormData(data: AdmissionRequestForm): Record<string, unknown> {
  const cleanValue = (value: unknown): unknown => {
    if (value === '' || value === null) return undefined
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const cleaned: Record<string, unknown> = {}
      for (const [key, val] of Object.entries(value)) {
        const cleanedVal = cleanValue(val)
        if (cleanedVal !== undefined) {
          cleaned[key] = cleanedVal
        }
      }
      return Object.keys(cleaned).length > 0 ? cleaned : undefined
    }
    return value
  }

  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    const cleanedValue = cleanValue(value)
    if (cleanedValue !== undefined) {
      result[key] = cleanedValue
    }
  }
  return result
}

export const admissionService = {
  async submitRequest(data: AdmissionRequestForm): Promise<AdmissionRequestResponse> {
    const cleanedData = cleanFormData(data)
    const response = await api.post<AdmissionRequestResponse>('/admissions/request', cleanedData)
    return response.data
  },

  async getRequestById(requestId: string): Promise<AdmissionRequestResponse> {
    const response = await api.get<AdmissionRequestResponse>(`/admissions/request/${requestId}`)
    return response.data
  },

  async checkStatus(requestId: string): Promise<AdmissionStatusCheck> {
    const response = await api.get<AdmissionStatusCheck>(`/admissions/status/${requestId}`)
    return response.data
  },

  async getAllRequests(params?: {
    status?: string
    grade?: string
    skip?: number
    limit?: number
  }): Promise<AdmissionRequestResponse[]> {
    const response = await api.get<AdmissionRequestResponse[]>('/admissions/requests', {
      params,
    })
    return response.data
  },

  async updateRequest(
    requestId: string, 
    data: { status?: string; reviewer_notes?: string }
  ): Promise<AdmissionRequestResponse> {
    const response = await api.patch<AdmissionRequestResponse>(
      `/admissions/request/${requestId}`, 
      data
    )
    return response.data
  },

  async admitToClass(
    requestId: string,
    data: ClassAdmitRequest
  ): Promise<AdmissionRequestResponse> {
    const response = await api.post<AdmissionRequestResponse>(
      `/admissions/admit/${requestId}`,
      data
    )
    return response.data
  },

  // ---- Direct student management ----

  async addStudent(data: DirectStudentForm): Promise<AdmissionRequestResponse> {
    const cleanedData = cleanFormData(data as unknown as AdmissionRequestForm)
    const response = await api.post<AdmissionRequestResponse>('/students', cleanedData)
    return response.data
  },

  async deleteStudent(studentId: string): Promise<AdmissionRequestResponse> {
    const response = await api.delete<AdmissionRequestResponse>(`/students/${studentId}`)
    return response.data
  },

  // ---- Student marks ----

  async getMarks(studentId: string): Promise<StudentMarkResponse[]> {
    const response = await api.get<StudentMarkResponse[]>(`/students/${studentId}/marks`)
    return response.data
  },

  async addMark(studentId: string, data: StudentMarkForm): Promise<StudentMarkResponse> {
    const response = await api.post<StudentMarkResponse>(`/students/${studentId}/marks`, data)
    return response.data
  },

  async deleteMark(studentId: string, markId: number): Promise<void> {
    await api.delete(`/students/${studentId}/marks/${markId}`)
  },

  // ---- Class history ----

  async getClassHistory(studentId: string): Promise<ClassHistoryResponse[]> {
    const response = await api.get<ClassHistoryResponse[]>(`/students/${studentId}/class-history`)
    return response.data
  },

  async addClassHistory(studentId: string, data: ClassHistoryForm): Promise<ClassHistoryResponse> {
    const response = await api.post<ClassHistoryResponse>(`/students/${studentId}/class-history`, data)
    return response.data
  },

  async deleteClassHistory(studentId: string, entryId: number): Promise<void> {
    await api.delete(`/students/${studentId}/class-history/${entryId}`)
  },
}

export default admissionService
