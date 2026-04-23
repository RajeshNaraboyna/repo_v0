import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import admissionService from '../services/admissionService'
import { useSchoolConfig } from '../hooks/useSchoolConfig'
import type { AdmissionRequestForm } from '../types'

const relationships = ['Father', 'Mother', 'Guardian', 'Other']

export default function AdmissionRequestPage() {
  const navigate = useNavigate()
  const { grades } = useSchoolConfig()
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Your admission request has been submitted successfully.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500 mb-1">Your Application ID</p>
            <p className="text-2xl font-mono font-bold text-primary-600">{submittedId}</p>
          </div>
          
          <p className="text-sm text-gray-500 mb-6">
            Please save this ID to check your application status later.
          </p>
          
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => navigate(`/admission/status/${submittedId}`)}
              className="btn-primary"
            >
              Check Status
            </button>
            <button
              onClick={() => {
                setSubmittedId(null)
                setStep(1)
              }}
              className="btn-outline"
            >
              Submit Another
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Student Admission Request</h1>
        <p className="text-gray-600 mt-2">Fill out the form below to submit an admission request</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {['Student Info', 'Contact Details', 'Guardian Info', 'Review'].map((label, index) => (
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
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Student Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Student Name *</label>
                  <input
                    {...register('student_name', { required: 'Student name is required' })}
                    className={`input-field ${errors.student_name ? 'input-error' : ''}`}
                    placeholder="Full name of the student"
                  />
                  {errors.student_name && <p className="error-text">{errors.student_name.message}</p>}
                </div>

                <div>
                  <label className="label">Date of Birth *</label>
                  <input
                    type="date"
                    {...register('date_of_birth', { required: 'Date of birth is required' })}
                    className={`input-field ${errors.date_of_birth ? 'input-error' : ''}`}
                  />
                  {errors.date_of_birth && <p className="error-text">{errors.date_of_birth.message}</p>}
                </div>

                <div>
                  <label className="label">Gender *</label>
                  <select
                    {...register('gender', { required: 'Gender is required' })}
                    className={`input-field ${errors.gender ? 'input-error' : ''}`}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.gender && <p className="error-text">{errors.gender.message}</p>}
                </div>

                <div>
                  <label className="label">Nationality</label>
                  <input
                    {...register('nationality')}
                    className="input-field"
                    placeholder="Indian"
                  />
                </div>

                <div>
                  <label className="label">Grade Applying For *</label>
                  <select
                    {...register('grade_applying_for', { required: 'Grade is required' })}
                    className={`input-field ${errors.grade_applying_for ? 'input-error' : ''}`}
                  >
                    <option value="">Select grade</option>
                    {grades.map((grade) => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                  {errors.grade_applying_for && <p className="error-text">{errors.grade_applying_for.message}</p>}
                </div>

                <div>
                  <label className="label">Academic Year *</label>
                  <select
                    {...register('academic_year', { required: 'Academic year is required' })}
                    className={`input-field ${errors.academic_year ? 'input-error' : ''}`}
                  >
                    <option value="2026-2027">2026-2027</option>
                    <option value="2027-2028">2027-2028</option>
                  </select>
                  {errors.academic_year && <p className="error-text">{errors.academic_year.message}</p>}
                </div>

                <div>
                  <label className="label">Religion</label>
                  <input
                    {...register('religion')}
                    className="input-field"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="label">Mother Tongue</label>
                  <input
                    {...register('mother_tongue')}
                    className="input-field"
                    placeholder="Optional"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Contact Details */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Contact Phone *</label>
                  <input
                    {...register('contact_phone', { 
                      required: 'Phone number is required',
                      pattern: {
                        value: /^[0-9]{10}$/,
                        message: 'Please enter a valid 10-digit phone number'
                      }
                    })}
                    className={`input-field ${errors.contact_phone ? 'input-error' : ''}`}
                    placeholder="10-digit mobile number"
                  />
                  {errors.contact_phone && <p className="error-text">{errors.contact_phone.message}</p>}
                </div>

                <div>
                  <label className="label">Contact Email *</label>
                  <input
                    type="email"
                    {...register('contact_email', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    className={`input-field ${errors.contact_email ? 'input-error' : ''}`}
                    placeholder="your@email.com"
                  />
                  {errors.contact_email && <p className="error-text">{errors.contact_email.message}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="label">Residential Address *</label>
                  <textarea
                    {...register('residential_address', { required: 'Address is required' })}
                    className={`input-field ${errors.residential_address ? 'input-error' : ''}`}
                    rows={3}
                    placeholder="Full residential address"
                  />
                  {errors.residential_address && <p className="error-text">{errors.residential_address.message}</p>}
                </div>

                <div>
                  <label className="label">City *</label>
                  <input
                    {...register('city', { required: 'City is required' })}
                    className={`input-field ${errors.city ? 'input-error' : ''}`}
                    placeholder="City"
                  />
                  {errors.city && <p className="error-text">{errors.city.message}</p>}
                </div>

                <div>
                  <label className="label">State *</label>
                  <input
                    {...register('state', { required: 'State is required' })}
                    className={`input-field ${errors.state ? 'input-error' : ''}`}
                    placeholder="State"
                  />
                  {errors.state && <p className="error-text">{errors.state.message}</p>}
                </div>

                <div>
                  <label className="label">Pincode *</label>
                  <input
                    {...register('pincode', { 
                      required: 'Pincode is required',
                      pattern: {
                        value: /^[0-9]{6}$/,
                        message: 'Please enter a valid 6-digit pincode'
                      }
                    })}
                    className={`input-field ${errors.pincode ? 'input-error' : ''}`}
                    placeholder="6-digit pincode"
                  />
                  {errors.pincode && <p className="error-text">{errors.pincode.message}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Guardian Information */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Parent/Guardian Information</h2>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-4">Primary Guardian *</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Name *</label>
                    <input
                      {...register('primary_guardian.name', { required: 'Guardian name is required' })}
                      className={`input-field ${errors.primary_guardian?.name ? 'input-error' : ''}`}
                      placeholder="Full name"
                    />
                    {errors.primary_guardian?.name && <p className="error-text">{errors.primary_guardian.name.message}</p>}
                  </div>
                  <div>
                    <label className="label">Relationship *</label>
                    <select
                      {...register('primary_guardian.relationship', { required: 'Relationship is required' })}
                      className={`input-field ${errors.primary_guardian?.relationship ? 'input-error' : ''}`}
                    >
                      <option value="">Select relationship</option>
                      {relationships.map((rel) => (
                        <option key={rel} value={rel}>{rel}</option>
                      ))}
                    </select>
                    {errors.primary_guardian?.relationship && <p className="error-text">{errors.primary_guardian.relationship.message}</p>}
                  </div>
                  <div>
                    <label className="label">Phone *</label>
                    <input
                      {...register('primary_guardian.phone', { required: 'Phone number is required' })}
                      className={`input-field ${errors.primary_guardian?.phone ? 'input-error' : ''}`}
                      placeholder="Phone number"
                    />
                    {errors.primary_guardian?.phone && <p className="error-text">{errors.primary_guardian.phone.message}</p>}
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input
                      type="email"
                      {...register('primary_guardian.email')}
                      className="input-field"
                      placeholder="Email (optional)"
                    />
                  </div>
                  <div>
                    <label className="label">Occupation</label>
                    <input
                      {...register('primary_guardian.occupation')}
                      className="input-field"
                      placeholder="Occupation (optional)"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="label">Medical Conditions</label>
                  <textarea
                    {...register('medical_conditions')}
                    className="input-field"
                    rows={2}
                    placeholder="Any medical conditions we should be aware of (optional)"
                  />
                </div>
                <div>
                  <label className="label">How did you hear about us?</label>
                  <input
                    {...register('how_did_you_hear')}
                    className="input-field"
                    placeholder="Referral, website, newspaper, etc."
                  />
                </div>
              </div>

              {/* Consent */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    {...register('terms_accepted', { required: 'You must accept the terms and conditions' })}
                    className="mt-1 mr-3"
                  />
                  <label className="text-sm text-gray-700">
                    I accept the <a href="#" className="text-primary-600 hover:underline">Terms and Conditions</a> *
                  </label>
                </div>
                {errors.terms_accepted && <p className="error-text">{errors.terms_accepted.message}</p>}

                <div className="flex items-start">
                  <input
                    type="checkbox"
                    {...register('data_privacy_accepted', { required: 'You must accept the data privacy policy' })}
                    className="mt-1 mr-3"
                  />
                  <label className="text-sm text-gray-700">
                    I accept the <a href="#" className="text-primary-600 hover:underline">Data Privacy Policy</a> *
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
                Previous
              </button>
            )}
            {step < 3 && (
              <button type="button" onClick={nextStep} className="btn-primary ml-auto">
                Next
              </button>
            )}
            {step === 3 && (
              <button
                type="submit"
                className="btn-primary ml-auto"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? 'Submitting...' : 'Submit Application'}
              </button>
            )}
          </div>

          {mutation.isError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              Failed to submit application. Please try again.
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
