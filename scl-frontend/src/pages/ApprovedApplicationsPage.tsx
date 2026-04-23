import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import admissionService from '../services/admissionService'
import { useSchoolConfig } from '../hooks/useSchoolConfig'
import type { AdmissionRequestResponse, ClassAdmitRequest } from '../types'

interface AdmitModalProps {
  application: AdmissionRequestResponse
  onClose: () => void
  onSubmit: (data: ClassAdmitRequest) => void
  isLoading: boolean
}

function AdmitModal({ application, onClose, onSubmit, isLoading }: AdmitModalProps) {
  const { grades, sections } = useSchoolConfig()
  const { t } = useTranslation()
  const [formData, setFormData] = useState<ClassAdmitRequest>({
    admitted_class: application.grade_applying_for,
    admitted_section: 'A',
    roll_number: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">{t('approved.admitStudentToClass')}</h3>
          <p className="text-sm text-gray-600 mt-1">
            {t('approved.admitting_label')} <span className="font-medium">{application.student_name}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('approved.classLabel')} <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.admitted_class}
              onChange={(e) => setFormData({ ...formData, admitted_class: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            >
              {grades.map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('approved.sectionLabel')} <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.admitted_section}
              onChange={(e) => setFormData({ ...formData, admitted_section: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            >
              {sections.map((section) => (
                <option key={section} value={section}>
                  {t('approved.section')} {section}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('approved.rollNumber')} <span className="text-gray-400">{t('approved.rollNumberOptional')}</span>
            </label>
            <input
              type="text"
              value={formData.roll_number || ''}
              onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
              placeholder="e.g., 25"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? t('approved.admitting') : t('approved.admitToClass')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ApprovedApplicationsPage() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const [selectedApplication, setSelectedApplication] = useState<AdmissionRequestResponse | null>(null)

  const { data: applications, isLoading } = useQuery({
    queryKey: ['approved-applications'],
    queryFn: () => admissionService.getAllRequests({ status: 'approved' }),
  })

  const admitMutation = useMutation({
    mutationFn: ({ requestId, data }: { requestId: string; data: ClassAdmitRequest }) =>
      admissionService.admitToClass(requestId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approved-applications'] })
      queryClient.invalidateQueries({ queryKey: ['admission-requests'] })
      setSelectedApplication(null)
    },
  })

  const handleAdmit = (data: ClassAdmitRequest) => {
    if (selectedApplication) {
      admitMutation.mutate({ requestId: selectedApplication.id, data })
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('approved.title')}</h1>
        <p className="text-gray-600 mt-2">
          {t('approved.subtitle')}
        </p>
      </div>

      {/* Stats */}
      <div className="card mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{t('approved.pendingClassAdmission')}</p>
            <p className="text-2xl font-bold text-green-600">
              {applications?.length || 0}
            </p>
          </div>
          <div className="text-5xl text-green-100">
            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {t('approved.awaitingAssignment')}
        </h2>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-600 mt-4">{t('approved.loading')}</p>
          </div>
        ) : applications && applications.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">{t('approved.id')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">{t('approved.studentName')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">{t('approved.gradeApplying')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">{t('approved.academicYear')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">{t('approved.guardian')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">{t('approved.contact')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">{t('approved.approvedOn')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">{t('approved.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((application) => (
                  <tr key={application.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-sm">{application.id}</td>
                    <td className="py-3 px-4 font-medium">{application.student_name}</td>
                    <td className="py-3 px-4">{application.grade_applying_for}</td>
                    <td className="py-3 px-4">{application.academic_year}</td>
                    <td className="py-3 px-4 text-sm">
                      <div>{application.primary_guardian.name}</div>
                      <div className="text-gray-500">{application.primary_guardian.relationship}</div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      <div>{application.contact_phone}</div>
                      <div>{application.contact_email}</div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {new Date(application.updated_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedApplication(application)}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                        >
                          {t('approved.admitToClass')}
                        </button>
                        <Link
                          to={`/admission/view/${application.id}`}
                          className="px-3 py-1 text-primary-600 border border-primary-600 text-sm rounded-lg hover:bg-primary-50"
                        >
                          {t('approved.viewDetails')}
                        </Link>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-lg font-medium">{t('approved.noApprovedApplications')}</p>
            <p className="mt-1">All approved students have been admitted to classes</p>
          </div>
        )}
      </div>

      {/* Admit Modal */}
      {selectedApplication && (
        <AdmitModal
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onSubmit={handleAdmit}
          isLoading={admitMutation.isPending}
        />
      )}

      {/* Error Toast */}
      {admitMutation.isError && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg">
          <p className="font-medium">Error admitting student</p>
          <p className="text-sm">{(admitMutation.error as Error)?.message || 'Please try again'}</p>
        </div>
      )}

      {/* Success Toast */}
      {admitMutation.isSuccess && (
        <div className="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg">
          <p className="font-medium">Student admitted successfully!</p>
        </div>
      )}
    </div>
  )
}
