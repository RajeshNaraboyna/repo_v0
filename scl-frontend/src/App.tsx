import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './store/AuthContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import AdmissionRequestPage from './pages/AdmissionRequestPage'
import AdmissionStatusPage from './pages/AdmissionStatusPage'
import AdmissionViewPage from './pages/AdmissionViewPage'
import DashboardPage from './pages/DashboardPage'
import ApprovedApplicationsPage from './pages/ApprovedApplicationsPage'
import CurrentStudentsPage from './pages/CurrentStudentsPage'
import AddStudentPage from './pages/AddStudentPage'
import QuestionPapersPage from './pages/QuestionPapersPage'
import QuestionPaperEditPage from './pages/QuestionPaperEditPage'
import QuestionPaperDesignerPage from './pages/QuestionPaperDesignerPage'
import ExamsPage from './pages/ExamsPage'
import ExamCreatePage from './pages/ExamCreatePage'
import ExamViewPage from './pages/ExamViewPage'
import ResultsPage from './pages/ResultsPage'
import ResultExamClassesPage from './pages/ResultExamClassesPage'
import ResultStudentsPage from './pages/ResultStudentsPage'
import ResultStudentDetailPage from './pages/ResultStudentDetailPage'
import AnalyticsPage from './pages/AnalyticsPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isGuest } = useAuth()
  
  if (!isAuthenticated && !isGuest) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

function GuestOrAuthRoute({ children }: { children: React.ReactNode }) {
  // This route is accessible to both guests and authenticated users
  return <>{children}</>
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/admission" replace />} />
          <Route 
            path="admission" 
            element={
              <GuestOrAuthRoute>
                <AdmissionRequestPage />
              </GuestOrAuthRoute>
            } 
          />
          <Route 
            path="admission/status/:requestId" 
            element={<AdmissionStatusPage />} 
          />
          <Route 
            path="admission/view/:requestId" 
            element={
              <ProtectedRoute>
                <AdmissionViewPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="approved" 
            element={
              <ProtectedRoute>
                <ApprovedApplicationsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="students" 
            element={
              <ProtectedRoute>
                <CurrentStudentsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="students/add" 
            element={
              <ProtectedRoute>
                <AddStudentPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="question-papers" 
            element={
              <ProtectedRoute>
                <QuestionPapersPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="question-papers/:id" 
            element={
              <ProtectedRoute>
                <QuestionPaperEditPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="question-papers/:id/design" 
            element={
              <ProtectedRoute>
                <QuestionPaperDesignerPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="exams" 
            element={
              <ProtectedRoute>
                <ExamsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="exams/new" 
            element={
              <ProtectedRoute>
                <ExamCreatePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="exams/:id" 
            element={
              <ProtectedRoute>
                <ExamViewPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="results" 
            element={
              <ProtectedRoute>
                <ResultsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="results/:examId" 
            element={
              <ProtectedRoute>
                <ResultExamClassesPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="results/:examId/class/:className" 
            element={
              <ProtectedRoute>
                <ResultStudentsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="results/:examId/class/:className/student/:studentId" 
            element={
              <ProtectedRoute>
                <ResultStudentDetailPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="analytics" 
            element={
              <ProtectedRoute>
                <AnalyticsPage />
              </ProtectedRoute>
            } 
          />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App
