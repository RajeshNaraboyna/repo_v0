// Authentication Types
export interface User {
  id: string
  email: string
  name: string
  role: string
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface AuthToken {
  access_token: string
  token_type: string
  user?: User
}

export interface GuestToken {
  access_token: string
  token_type: string
  is_guest: boolean
  expires_in: number
  permissions: string[]
}

// Admission Types
export type Gender = 'male' | 'female' | 'other'

export type AdmissionStatus = 
  | 'pending' 
  | 'under_review' 
  | 'documents_required' 
  | 'approved' 
  | 'rejected' 
  | 'waitlisted'
  | 'admitted'

export interface ParentGuardianInfo {
  name: string
  relationship: string
  phone: string
  email?: string
  occupation?: string
  address?: string
}

export interface PreviousSchoolInfo {
  school_name: string
  grade_completed: string
  year_completed: number
  reason_for_leaving?: string
  transfer_certificate?: boolean
}

export interface AdmissionRequestForm {
  // Student Information
  student_name: string
  date_of_birth: string
  gender: Gender
  nationality: string
  religion?: string
  mother_tongue?: string
  
  // Academic Information
  grade_applying_for: string
  academic_year: string
  
  // Contact Information
  contact_phone: string
  contact_email: string
  residential_address: string
  city: string
  state: string
  pincode: string
  
  // Parent/Guardian Information
  primary_guardian: ParentGuardianInfo
  secondary_guardian?: ParentGuardianInfo
  
  // Previous School
  previous_school?: PreviousSchoolInfo
  
  // Additional Information
  medical_conditions?: string
  allergies?: string
  special_needs?: string
  how_did_you_hear?: string
  additional_notes?: string
  
  // Consent
  terms_accepted: boolean
  data_privacy_accepted: boolean
}

export interface AdmissionRequestResponse {
  id: string
  student_name: string
  date_of_birth: string
  gender: Gender
  grade_applying_for: string
  academic_year: string
  contact_email: string
  contact_phone: string
  city: string
  state: string
  status: AdmissionStatus
  submitted_at: string
  updated_at: string
  primary_guardian: ParentGuardianInfo
  secondary_guardian?: ParentGuardianInfo
  previous_school?: PreviousSchoolInfo
  reviewer?: string
  reviewer_notes?: string
  // Class admission fields
  admitted_class?: string
  admitted_section?: string
  roll_number?: string
  admitted_at?: string
  admitted_by?: string
}

export interface ClassAdmitRequest {
  admitted_class: string
  admitted_section: string
  roll_number?: string
}

export interface AdmissionStatusCheck {
  request_id: string
  student_name: string
  status: AdmissionStatus
  submitted_at: string
  last_updated: string
}

// Direct student add (bypasses admission workflow)
export interface DirectStudentForm {
  student_name: string
  date_of_birth: string
  gender: Gender
  nationality: string
  religion?: string
  mother_tongue?: string
  grade_applying_for: string
  academic_year: string
  admitted_class: string
  admitted_section: string
  roll_number?: string
  contact_phone: string
  contact_email: string
  residential_address: string
  city: string
  state: string
  pincode: string
  primary_guardian: ParentGuardianInfo
  secondary_guardian?: ParentGuardianInfo
  previous_school?: PreviousSchoolInfo
  medical_conditions?: string
  allergies?: string
  special_needs?: string
  additional_notes?: string
}

// Student Marks
export interface StudentMarkForm {
  exam_name: string
  subject: string
  marks_obtained: number
  max_marks: number
  grade?: string
  academic_year: string
  remarks?: string
}

export interface StudentMarkResponse {
  id: number
  student_id: string
  exam_name: string
  subject: string
  marks_obtained: number
  max_marks: number
  grade?: string
  academic_year: string
  remarks?: string
  created_at: string
}

// Class History
export interface ClassHistoryForm {
  academic_year: string
  class_name: string
  section: string
  roll_number?: string
  start_date?: string
  end_date?: string
  remarks?: string
}

export interface ClassHistoryResponse {
  id: number
  student_id: string
  academic_year: string
  class_name: string
  section: string
  roll_number?: string
  start_date?: string
  end_date?: string
  remarks?: string
  created_at: string
}

// Question Paper Types
export type QuestionPaperStatus = 'draft' | 'review' | 'approved' | 'published'

export type ExamType = 'unit_test' | 'quarterly' | 'half_yearly' | 'midterm' | 'final'

export type QuestionType = 'mcq' | 'short_answer' | 'long_answer' | 'descriptive' | 'fill_in_blank'

// Content block for the visual drag-and-drop designer
export interface ContentBlock {
  id: string
  type: 'header' | 'instructions' | 'section_title' | 'question' | 'text' | 'image' | 'divider'
  content: string // HTML from TipTap editor
  position: number
  metadata?: {
    questionNumber?: number
    marks?: number
    questionType?: string
    section?: string
    [key: string]: unknown
  }
}

export interface QuestionForm {
  question_number: number
  question_text: string
  question_type: QuestionType
  marks: number
  options?: Record<string, string>
  expected_answer?: string
  section?: string
}

export interface QuestionResponse {
  id: number
  question_paper_id: number
  question_number: number
  question_text: string
  question_type: string
  marks: number
  options?: Record<string, string>
  expected_answer?: string
  section?: string
}

export interface QuestionPaperForm {
  title: string
  subject: string
  class_name: string
  academic_year: string
  exam_type: ExamType
  total_marks: number
  duration_minutes: number
  instructions?: string
  questions?: QuestionForm[]
}

export interface QuestionPaperUpdate {
  title?: string
  subject?: string
  class_name?: string
  academic_year?: string
  exam_type?: ExamType
  total_marks?: number
  duration_minutes?: number
  instructions?: string
  content_blocks?: Record<string, unknown>[]
  status?: QuestionPaperStatus
}

export interface QuestionPaperResponse {
  id: number
  title: string
  subject: string
  class_name: string
  academic_year: string
  exam_type: string
  total_marks: number
  duration_minutes: number
  instructions?: string
  content_blocks?: ContentBlock[]
  status: QuestionPaperStatus
  created_by?: string
  approved_by?: string
  created_at: string
  updated_at: string
  questions: QuestionResponse[]
}

// ── Exam Types ────────────────────────────────────────────────

export type ExamEventStatus = 'draft' | 'papers_attached' | 'paper_selected' | 'conducted'

export interface PaperBrief {
  id: number
  title: string
  status: string
  total_marks: number
}

export interface ExamClassPaperResponse {
  id: number
  exam_id: number
  class_name: string
  subject: string
  paper_set_a_id?: number | null
  paper_set_b_id?: number | null
  paper_set_c_id?: number | null
  paper_set_a?: PaperBrief | null
  paper_set_b?: PaperBrief | null
  paper_set_c?: PaperBrief | null
  selected_set?: string | null
  selected_paper_id?: number | null
  selected_at?: string | null
}

export interface ExamClassPaperForm {
  class_name: string
  subject: string
  paper_set_a_id?: number | null
  paper_set_b_id?: number | null
  paper_set_c_id?: number | null
}

export interface ExamEventForm {
  name: string
  academic_year: string
  exam_type: string
  exam_date: string
  paper_selection_date: string
}

export interface ExamEventUpdate {
  name?: string
  academic_year?: string
  exam_type?: string
  exam_date?: string
  paper_selection_date?: string
  status?: string
}

export interface ExamEventResponse {
  id: number
  name: string
  academic_year: string
  exam_type: string
  exam_date: string
  paper_selection_date: string
  status: ExamEventStatus
  created_by?: string
  created_at: string
  updated_at: string
  class_papers: ExamClassPaperResponse[]
}

export interface ExamEventListResponse {
  id: number
  name: string
  academic_year: string
  exam_type: string
  exam_date: string
  paper_selection_date: string
  status: ExamEventStatus
  created_by?: string
  created_at: string
  updated_at: string
  class_count: number
}

// ── Result Types ──────────────────────────────────────────────

export interface ResultExamSummary {
  exam_id: number
  exam_name: string
  academic_year: string
  exam_type: string
  exam_date: string
  status: string
  class_count: number
  result_count: number
}

export interface ResultClassSummary {
  class_name: string
  subjects: string[]
  student_count: number
  result_count: number
}

export interface ResultStudentSummary {
  student_id: string
  student_name: string
  roll_number?: string
  subjects_completed: number
  total_subjects: number
  total_marks?: number
  total_max_marks?: number
  has_pdf: boolean
}

export interface StudentResultResponse {
  id: number
  exam_id: number
  student_id: string
  class_name: string
  subject: string
  marks_obtained?: number
  max_marks: number
  grade?: string
  remarks?: string
  pdf_filename?: string
  has_pdf: boolean
  uploaded_by?: string
  created_at: string
  updated_at: string
}

export interface StudentResultForm {
  exam_id: number
  student_id: string
  class_name: string
  subject: string
  marks_obtained?: number
  max_marks: number
  grade?: string
  remarks?: string
}

// ── RAG Types ─────────────────────────────────────────────────

export interface RagIndexResponse {
  success: boolean
  message: string
  documents_indexed: number
  student_id: string
  index_name: string
}

// ── Analytics Types ───────────────────────────────────────────

export interface AnalyticsQueryParams {
  query?: string
  student_id?: string
  student_name?: string
  class_name?: string
  subject?: string
  exam_id?: number
  exam_type?: string
  academic_year?: string
  min_marks?: number
  max_marks_filter?: number
  grade?: string
  sort_by?: 'relevance' | 'marks_asc' | 'marks_desc' | 'student_name' | 'subject'
  page?: number
  page_size?: number
}

export interface AnalyticsResultItem {
  result_id: number
  student_id: string
  student_name: string
  class_name: string
  roll_number?: string
  exam_id: number
  exam_name: string
  exam_type: string
  academic_year: string
  subject: string
  marks_obtained?: number
  max_marks: number
  percentage?: number
  grade?: string
  has_pdf: boolean
  relevance_score?: number
  document?: string
}

export interface AnalyticsSummary {
  total_records: number
  unique_students: number
  unique_subjects: number
  unique_exams: number
  average_percentage?: number
  highest_percentage?: number
  lowest_percentage?: number
  grade_distribution: Record<string, number>
  subject_averages: Record<string, number>
  class_averages: Record<string, number>
}

export interface AnalyticsQueryResponse {
  results: AnalyticsResultItem[]
  summary: AnalyticsSummary
  total_results: number
  page: number
  page_size: number
  total_pages: number
  kb_documents: string[]
}

export interface AnalyticsFilters {
  classes: string[]
  subjects: string[]
  exam_types: string[]
  academic_years: string[]
  grades: string[]
}
