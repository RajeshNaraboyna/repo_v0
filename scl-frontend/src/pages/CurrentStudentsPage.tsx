import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import admissionService from '../services/admissionService'
import type { AdmissionRequestResponse } from '../types'

interface StudentDetailModalProps {
  student: AdmissionRequestResponse
  onClose: () => void
}

function StudentDetailModal({ student, onClose }: StudentDetailModalProps) {
  const { t } = useTranslation()
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 my-8 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b sticky top-0 bg-white">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">{t('students.viewDetails')}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* Class Information */}
          <div className="bg-teal-50 rounded-lg p-4">
            <h4 className="font-medium text-teal-800 mb-3">{t('students.classInfo')}</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">{t('students.class')}</span>
                <p className="font-medium">{student.admitted_class}</p>
              </div>
              <div>
                <span className="text-gray-500">{t('students.section')}</span>
                <p className="font-medium">{student.admitted_section}</p>
              </div>
              <div>
                <span className="text-gray-500">{t('students.rollNumber')}</span>
                <p className="font-medium">{student.roll_number || t('students.notAssigned')}</p>
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-500">
            {t('students.admittedOn')} {student.admitted_at ? new Date(student.admitted_at).toLocaleDateString() : t('students.na')}
            </div>
          </div>

          {/* Student Information */}
          <div>
            <h4 className="font-medium text-gray-800 mb-3">{t('students.studentInformation')}</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">{t('students.fullName')}</span>
                <p className="font-medium">{student.student_name}</p>
              </div>
              <div>
                <span className="text-gray-500">{t('students.dateOfBirth')}</span>
                <p className="font-medium">{new Date(student.date_of_birth).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="text-gray-500">{t('students.gender')}</span>
                <p className="font-medium capitalize">{student.gender}</p>
              </div>
              <div>
                <span className="text-gray-500">{t('students.academicYear')}</span>
                <p className="font-medium">{student.academic_year}</p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h4 className="font-medium text-gray-800 mb-3">{t('students.contactInformation')}</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">{t('students.phone')}</span>
                <p className="font-medium">{student.contact_phone}</p>
              </div>
              <div>
                <span className="text-gray-500">{t('students.email')}</span>
                <p className="font-medium">{student.contact_email}</p>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">{t('students.cityState')}</span>
                <p className="font-medium">{student.city}, {student.state}</p>
              </div>
            </div>
          </div>

          {/* Guardian Information */}
          <div>
            <h4 className="font-medium text-gray-800 mb-3">Primary Guardian</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Name:</span>
                <p className="font-medium">{student.primary_guardian.name}</p>
              </div>
              <div>
                <span className="text-gray-500">Relationship:</span>
                <p className="font-medium">{student.primary_guardian.relationship}</p>
              </div>
              <div>
                <span className="text-gray-500">Phone:</span>
                <p className="font-medium">{student.primary_guardian.phone}</p>
              </div>
              {student.primary_guardian.email && (
                <div>
                  <span className="text-gray-500">Email:</span>
                  <p className="font-medium">{student.primary_guardian.email}</p>
                </div>
              )}
              {student.primary_guardian.occupation && (
                <div>
                  <span className="text-gray-500">Occupation:</span>
                  <p className="font-medium">{student.primary_guardian.occupation}</p>
                </div>
              )}
            </div>
          </div>

          {student.secondary_guardian && (
            <div>
              <h4 className="font-medium text-gray-800 mb-3">Secondary Guardian</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Name:</span>
                  <p className="font-medium">{student.secondary_guardian.name}</p>
                </div>
                <div>
                  <span className="text-gray-500">Relationship:</span>
                  <p className="font-medium">{student.secondary_guardian.relationship}</p>
                </div>
                <div>
                  <span className="text-gray-500">Phone:</span>
                  <p className="font-medium">{student.secondary_guardian.phone}</p>
                </div>
              </div>
            </div>
          )}

          {/* Previous School */}
          {student.previous_school && (
            <div>
              <h4 className="font-medium text-gray-800 mb-3">Previous School</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="col-span-2">
                  <span className="text-gray-500">School Name:</span>
                  <p className="font-medium">{student.previous_school.school_name}</p>
                </div>
                <div>
                  <span className="text-gray-500">Grade Completed:</span>
                  <p className="font-medium">{student.previous_school.grade_completed}</p>
                </div>
                <div>
                  <span className="text-gray-500">Year:</span>
                  <p className="font-medium">{student.previous_school.year_completed}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
          <Link
            to={`/admission/view/${student.id}`}
            className="px-4 py-2 text-primary-600 border border-primary-600 rounded-lg hover:bg-primary-50"
          >
            View Full Application
          </Link>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CurrentStudentsPage() {
  const [selectedStudent, setSelectedStudent] = useState<AdmissionRequestResponse | null>(null)
  const [filterClass, setFilterClass] = useState<string>('')
  const [filterSection, setFilterSection] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [deleteTarget, setDeleteTarget] = useState<AdmissionRequestResponse | null>(null)
  const { t } = useTranslation()

  const queryClient = useQueryClient()

  const { data: students, isLoading } = useQuery({
    queryKey: ['admitted-students'],
    queryFn: () => admissionService.getAllRequests({ status: 'admitted' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (studentId: string) => admissionService.deleteStudent(studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admitted-students'] })
      setDeleteTarget(null)
    },
  })

  // Get unique classes and sections for filter dropdowns
  const classes = [...new Set(students?.map(s => s.admitted_class).filter(Boolean))]
  const sections = [...new Set(students?.map(s => s.admitted_section).filter(Boolean))]

  // Filter students
  const filteredStudents = students?.filter(student => {
    const matchesClass = !filterClass || student.admitted_class === filterClass
    const matchesSection = !filterSection || student.admitted_section === filterSection
    const matchesSearch = !searchQuery || 
      student.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.roll_number?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesClass && matchesSection && matchesSearch
  })

  // Group by class for summary
  const classSummary = students?.reduce((acc, student) => {
    const key = `${student.admitted_class} - ${student.admitted_section}`
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  return (
    <div>
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('students.title')}</h1>
          <p className="text-gray-600 mt-2">
            {t('students.subtitle')}
          </p>
        </div>
        <Link
          to="/students/add"
          className="btn-primary flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>{t('students.addStudent')}</span>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <p className="text-sm text-gray-500">Total Students</p>
          <p className="text-3xl font-bold text-teal-600">{students?.length || 0}</p>
        </div>
        {Object.entries(classSummary).slice(0, 3).map(([classSection, count]) => (
          <div key={classSection} className="card">
            <p className="text-sm text-gray-500">{classSection}</p>
            <p className="text-2xl font-bold text-gray-700">{count}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, ID, or roll number..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="w-40">
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Classes</option>
              {classes.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>
          <div className="w-40">
            <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
            <select
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Sections</option>
              {sections.map(sec => (
                <option key={sec} value={sec}>Section {sec}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilterClass('')
                setFilterSection('')
                setSearchQuery('')
              }}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Student List</h2>
          <span className="text-sm text-gray-500">
            Showing {filteredStudents?.length || 0} of {students?.length || 0} students
          </span>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-600 mt-4">{t('students.loading')}</p>
          </div>
        ) : filteredStudents && filteredStudents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Roll No.</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Student Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Class</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Section</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Guardian</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Contact</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Admitted On</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-sm">
                      {student.roll_number || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium">{student.student_name}</div>
                      <div className="text-xs text-gray-500">ID: {student.id}</div>
                    </td>
                    <td className="py-3 px-4">{student.admitted_class}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-teal-100 text-teal-800 rounded-full text-xs font-medium">
                        {student.admitted_section}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <div>{student.primary_guardian.name}</div>
                      <div className="text-gray-500">{student.primary_guardian.relationship}</div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {student.contact_phone}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {student.admitted_at ? new Date(student.admitted_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedStudent(student)}
                          className="px-3 py-1 text-primary-600 border border-primary-600 text-sm rounded-lg hover:bg-primary-50"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => setDeleteTarget(student)}
                          className="px-3 py-1 text-red-600 border border-red-600 text-sm rounded-lg hover:bg-red-50"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <p className="text-lg font-medium">No students found</p>
            <p className="mt-1">
              {students?.length === 0 
                ? 'No students have been admitted yet' 
                : 'Try adjusting your filters'}
            </p>
          </div>
        )}
      </div>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Remove Student</h3>
            <p className="text-gray-600 mb-1">
              Are you sure you want to remove <span className="font-semibold">{deleteTarget.student_name}</span>?
            </p>
            <p className="text-sm text-gray-500 mb-6">
              This will soft-delete the student record. It can be restored later if needed.
            </p>
            {deleteMutation.isError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">
                Failed to remove student. Please try again.
              </div>
            )}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={deleteMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Removing…' : 'Remove Student'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
