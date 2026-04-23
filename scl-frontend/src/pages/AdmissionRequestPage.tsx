import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import admissionService from '../services/admissionService'
import { useSchoolConfig } from '../hooks/useSchoolConfig'
import type { AdmissionRequestForm } from '../types'

const relationships = ['Father', 'Mother', 'Guardian', 'Other']

export default function AdmissionRequestPage() {
  const navigate = useNavigate()
  const { grades } = useSchoolConfig()
  const { t } = useTranslation()
  const [step, setStep] = useState(1)
  const [submittedId, setSubmittedId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
  } = useForm<AdmissionRequestForm>({
    defaultValues: {
      nationality: 'Indian',
      academic_year: '2026-2027',
      terms_accepted: false,
      data_privacy_accepted: false,
    },
  })

  const mutation = useMutation({
    mutationFn: admissionService.submitRequest,
    onSuccess: (data) => {
      setSubmittedId(data.id)
      setStep(4) // Success step
    },
  })

  const nextStep = async () => {
    let fieldsToValidate: (keyof AdmissionRequestForm)[] = []
    
    if (step === 1) {
      fieldsToValidate = ['student_name', 'date_of_birth', 'gender', 'grade_applying_for', 'academic_year']
    } else if (step === 2) {
      fieldsToValidate = ['contact_phone', 'contact_email', 'residential_address', 'city', 'state', 'pincode']
    }

    const isValid = await trigger(fieldsToValidate)
    if (isValid) {
      setStep(step + 1)
    }
  }

  const prevStep = () => setStep(step - 1)

  const onSubmit = (data: AdmissionRequestForm) => {
    mutation.mutate(data)
  }

  if (submittedId) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('admission.success.heading')}</h2>
          <p className="text-gray-600 mb-6">
            {t('admission.success.message')}
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500 mb-1">{t('admission.success.applicationIdLabel')}</p>
            <p className="text-2xl font-mono font-bold text-primary-600">{submittedId}</p>
          </div>
          
          <p className="text-sm text-gray-500 mb-6">
            {t('admission.success.saveIdMessage')}
          </p>
          
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => navigate(`/admission/status/${submittedId}`)}
              className="btn-primary"
            >
              {t('admission.buttons.checkStatus')}
            </button>
            <button
              onClick={() => {
                setSubmittedId(null)
                setStep(1)
              }}
              className="btn-outline"
            >
              {t('admission.buttons.submitAnother')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('admission.title')}</h1>
        <p className="text-gray-600 mt-2">{t('admission.subtitle')}</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {([
            t('admission.steps.studentInfo'),
            t('admission.steps.contactDetails'),
            t('admission.steps.guardianInfo'),
            t('admission.steps.review'),
          ]).map((label, index) => (
            <div key={label} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                  step > index + 1
                    ? 'bg-green-500 text-white'
                    : step === index + 1
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step > index + 1 ? '✓' : index + 1}
              </div>
              <span className={`ml-2 text-sm ${step >= index + 1 ? 'text-gray-900' : 'text-gray-400'}`}>
                {label}
              </span>
              {index < 3 && (
                <div className={`w-12 h-1 mx-4 ${step > index + 1 ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="card">
          {/* Step 1: Student Information */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('admission.studentInfo.heading')}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">{t('admission.studentInfo.studentName')}</label>
                  <input
                    {...register('student_name', { required: t('admission.errors.studentNameRequired') })}
                    className={`input-field ${errors.student_name ? 'input-error' : ''}`}
                    placeholder={t('admission.studentInfo.studentNamePlaceholder')}
                  />
                  {errors.student_name && <p className="error-text">{errors.student_name.message}</p>}
                </div>

                <div>
                  <label className="label">{t('admission.studentInfo.dateOfBirth')}</label>
                  <input
                    type="date"
                    {...register('date_of_birth', { required: t('admission.errors.dateOfBirthRequired') })}
                    className={`input-field ${errors.date_of_birth ? 'input-error' : ''}`}
                  />
                  {errors.date_of_birth && <p className="error-text">{errors.date_of_birth.message}</p>}
                </div>

                <div>
                  <label className="label">{t('admission.studentInfo.gender')}</label>
                  <select
                    {...register('gender', { required: t('admission.errors.genderRequired') })}
                    className={`input-field ${errors.gender ? 'input-error' : ''}`}
                  >
                    <option value="">{t('admission.studentInfo.selectGender')}</option>
                    <option value="male">{t('admission.studentInfo.male')}</option>
                    <option value="female">{t('admission.studentInfo.female')}</option>
                    <option value="other">{t('admission.studentInfo.other')}</option>
                  </select>
                  {errors.gender && <p className="error-text">{errors.gender.message}</p>}
                </div>

                <div>
                  <label className="label">{t('admission.studentInfo.nationality')}</label>
                  <input
                    {...register('nationality')}
                    className="input-field"
                    placeholder="Indian"
                  />
                </div>

                <div>
                  <label className="label">{t('admission.studentInfo.gradeApplyingFor')}</label>
                  <select
                    {...register('grade_applying_for', { required: t('admission.errors.gradeRequired') })}
                    className={`input-field ${errors.grade_applying_for ? 'input-error' : ''}`}
                  >
                    <option value="">{t('admission.studentInfo.selectGrade')}</option>
                    {grades.map((grade) => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                  {errors.grade_applying_for && <p className="error-text">{errors.grade_applying_for.message}</p>}
                </div>

                <div>
                  <label className="label">{t('admission.studentInfo.academicYear')}</label>
                  <select
                    {...register('academic_year', { required: t('admission.errors.academicYearRequired') })}
                    className={`input-field ${errors.academic_year ? 'input-error' : ''}`}
                  >
                    <option value="2026-2027">2026-2027</option>
                    <option value="2027-2028">2027-2028</option>
                  </select>
                  {errors.academic_year && <p className="error-text">{errors.academic_year.message}</p>}
                </div>

                <div>
                  <label className="label">{t('admission.studentInfo.religion')}</label>
                  <input
                    {...register('religion')}
                    className="input-field"
                    placeholder={t('admission.studentInfo.optional')}
                  />
                </div>

                <div>
                  <label className="label">{t('admission.studentInfo.motherTongue')}</label>
                  <input
                    {...register('mother_tongue')}
                    className="input-field"
                    placeholder={t('admission.studentInfo.optional')}
                  />
                </div>
              </div>
            </div>
          )}
          {/* Step 2: Contact Details */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('admission.contactDetails.heading')}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">{t('admission.contactDetails.contactPhone')}</label>
                  <input
                    {...register('contact_phone', { 
                      required: t('admission.errors.phoneRequired'),
                      pattern: {
                        value: /^[0-9]{10}$/,
                        message: t('admission.errors.phoneInvalid'),
                      }
                    })}
                    className={`input-field ${errors.contact_phone ? 'input-error' : ''}`}
                    placeholder={t('admission.contactDetails.contactPhonePlaceholder')}
                  />
                  {errors.contact_phone && <p className="error-text">{errors.contact_phone.message}</p>}
                </div>

                <div>
                  <label className="label">{t('admission.contactDetails.contactEmail')}</label>
                  <input
                    type="email"
                    {...register('contact_email', { 
                      required: t('admission.errors.emailRequired'),
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: t('admission.errors.emailInvalid'),
                      }
                    })}
                    className={`input-field ${errors.contact_email ? 'input-error' : ''}`}
                    placeholder={t('admission.contactDetails.contactEmailPlaceholder')}
                  />
                  {errors.contact_email && <p className="error-text">{errors.contact_email.message}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="label">{t('admission.contactDetails.residentialAddress')}</label>
                  <textarea
                    {...register('residential_address', { required: t('admission.errors.addressRequired') })}
                    className={`input-field ${errors.residential_address ? 'input-error' : ''}`}
                    rows={3}
                    placeholder={t('admission.contactDetails.residentialAddressPlaceholder')}
                  />
                  {errors.residential_address && <p className="error-text">{errors.residential_address.message}</p>}
                </div>

                <div>
                  <label className="label">{t('admission.contactDetails.city')}</label>
                  <input
                    {...register('city', { required: t('admission.errors.cityRequired') })}
                    className={`input-field ${errors.city ? 'input-error' : ''}`}
                    placeholder={t('admission.contactDetails.cityPlaceholder')}
                  />
                  {errors.city && <p className="error-text">{errors.city.message}</p>}
                </div>

                <div>
                  <label className="label">{t('admission.contactDetails.state')}</label>
                  <input
                    {...register('state', { required: t('admission.errors.stateRequired') })}
                    className={`input-field ${errors.state ? 'input-error' : ''}`}
                    placeholder={t('admission.contactDetails.statePlaceholder')}
                  />
                  {errors.state && <p className="error-text">{errors.state.message}</p>}
                </div>

                <div>
                  <label className="label">{t('admission.contactDetails.pincode')}</label>
                  <input
                    {...register('pincode', { 
                      required: t('admission.errors.pincodeRequired'),
                      pattern: {
                        value: /^[0-9]{6}$/,
                        message: t('admission.errors.pincodeInvalid'),
                      }
                    })}
                    className={`input-field ${errors.pincode ? 'input-error' : ''}`}
                    placeholder={t('admission.contactDetails.pincodePlaceholder')}
                  />
                  {errors.pincode && <p className="error-text">{errors.pincode.message}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Guardian Information */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('admission.guardianInfo.heading')}</h2>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-4">{t('admission.guardianInfo.primaryGuardian')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">{t('admission.guardianInfo.name')}</label>
                    <input
                      {...register('primary_guardian.name', { required: t('admission.errors.guardianNameRequired') })}
                      className={`input-field ${errors.primary_guardian?.name ? 'input-error' : ''}`}
                      placeholder={t('admission.guardianInfo.namePlaceholder')}
                    />
                    {errors.primary_guardian?.name && <p className="error-text">{errors.primary_guardian.name.message}</p>}
                  </div>
                  <div>
                    <label className="label">{t('admission.guardianInfo.relationship')}</label>
                    <select
                      {...register('primary_guardian.relationship', { required: t('admission.errors.guardianRelationshipRequired') })}
                      className={`input-field ${errors.primary_guardian?.relationship ? 'input-error' : ''}`}
                    >
                      <option value="">{t('admission.guardianInfo.selectRelationship')}</option>
                      {relationships.map((rel) => (
                        <option key={rel} value={rel}>{rel}</option>
                      ))}
                    </select>
                    {errors.primary_guardian?.relationship && <p className="error-text">{errors.primary_guardian.relationship.message}</p>}
                  </div>
                  <div>
                    <label className="label">{t('admission.guardianInfo.phone')}</label>
                    <input
                      {...register('primary_guardian.phone', { required: t('admission.errors.guardianPhoneRequired') })}
                      className={`input-field ${errors.primary_guardian?.phone ? 'input-error' : ''}`}
                      placeholder={t('admission.guardianInfo.phonePlaceholder')}
                    />
                    {errors.primary_guardian?.phone && <p className="error-text">{errors.primary_guardian.phone.message}</p>}
                  </div>
                  <div>
                    <label className="label">{t('admission.guardianInfo.email')}</label>
                    <input
                      type="email"
                      {...register('primary_guardian.email')}
                      className="input-field"
                      placeholder={t('admission.guardianInfo.emailPlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="label">{t('admission.guardianInfo.occupation')}</label>
                    <input
                      {...register('primary_guardian.occupation')}
                      className="input-field"
                      placeholder={t('admission.guardianInfo.occupationPlaceholder')}
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="label">{t('admission.guardianInfo.medicalConditions')}</label>
                  <textarea
                    {...register('medical_conditions')}
                    className="input-field"
                    rows={2}
                    placeholder={t('admission.guardianInfo.medicalConditionsPlaceholder')}
                  />
                </div>
                <div>
                  <label className="label">{t('admission.guardianInfo.howDidYouHear')}</label>
                  <input
                    {...register('how_did_you_hear')}
                    className="input-field"
                    placeholder={t('admission.guardianInfo.howDidYouHearPlaceholder')}
                  />
                </div>
              </div>

              {/* Consent */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    {...register('terms_accepted', { required: t('admission.errors.termsRequired') })}
                    className="mt-1 mr-3"
                  />
                  <label className="text-sm text-gray-700">
                    {t('admission.consent.termsAccepted')} <a href="#" className="text-primary-600 hover:underline">{t('admission.consent.termsLink')}</a> *
                  </label>
                </div>
                {errors.terms_accepted && <p className="error-text">{errors.terms_accepted.message}</p>}

                <div className="flex items-start">
                  <input
                    type="checkbox"
                    {...register('data_privacy_accepted', { required: t('admission.errors.dataPrivacyRequired') })}
                    className="mt-1 mr-3"
                  />
                  <label className="text-sm text-gray-700">
                    {t('admission.consent.dataPrivacyAccepted')} <a href="#" className="text-primary-600 hover:underline">{t('admission.consent.dataPrivacyLink')}</a> *
                  </label>
                </div>
                {errors.data_privacy_accepted && <p className="error-text">{errors.data_privacy_accepted.message}</p>}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            {step > 1 && (
              <button type="button" onClick={prevStep} className="btn-secondary">
                {t('admission.buttons.previous')}
              </button>
            )}
            {step < 3 && (
              <button type="button" onClick={nextStep} className="btn-primary ml-auto">
                {t('admission.buttons.next')}
              </button>
            )}
            {step === 3 && (
              <button
                type="submit"
                className="btn-primary ml-auto"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? t('admission.buttons.submitting') : t('admission.buttons.submit')}
              </button>
            )}
          </div>

          {mutation.isError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {t('admission.errors.submitFailed')}
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
