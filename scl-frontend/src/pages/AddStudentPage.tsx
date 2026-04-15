import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import admissionService from '../services/admissionService'
import { useSchoolConfig } from '../hooks/useSchoolConfig'
import type { DirectStudentForm, Gender } from '../types'

const initialForm: DirectStudentForm = {
  student_name: '',
  date_of_birth: '',
  gender: 'male',
  nationality: 'Indian',
  religion: '',
  mother_tongue: '',
  grade_applying_for: '',
  academic_year: '2026-2027',
  admitted_class: '',
  admitted_section: '',
  roll_number: '',
  contact_phone: '',
  contact_email: '',
  residential_address: '',
  city: '',
  state: '',
  pincode: '',
  primary_guardian: {
    name: '',
    relationship: 'Father',
    phone: '',
    email: '',
    occupation: '',
  },
  medical_conditions: '',
  allergies: '',
  special_needs: '',
  additional_notes: '',
}

export default function AddStudentPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { classes, sections } = useSchoolConfig()
  const [form, setForm] = useState<DirectStudentForm>({ ...initialForm })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const mutation = useMutation({
    mutationFn: (data: DirectStudentForm) => admissionService.addStudent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admitted-students'] })
      navigate('/students')
    },
  })

  const set = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n })
  }

  const setGuardian = (field: string, value: string) => {
    setForm(prev => ({
      ...prev,
      primary_guardian: { ...prev.primary_guardian, [field]: value },
    }))
  }

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (!form.student_name.trim()) e.student_name = 'Required'
    if (!form.date_of_birth) e.date_of_birth = 'Required'
    if (!form.admitted_class) e.admitted_class = 'Select a class'
    if (!form.admitted_section) e.admitted_section = 'Select a section'
    if (!form.contact_phone.trim()) e.contact_phone = 'Required'
    if (!form.contact_email.trim()) e.contact_email = 'Required'
    if (!form.residential_address.trim()) e.residential_address = 'Required'
    if (!form.city.trim()) e.city = 'Required'
    if (!form.state.trim()) e.state = 'Required'
    if (!form.pincode.trim()) e.pincode = 'Required'
    if (!form.primary_guardian.name.trim()) e['guardian_name'] = 'Required'
    if (!form.primary_guardian.phone.trim()) e['guardian_phone'] = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    // Sync grade_applying_for with admitted_class
    const payload: DirectStudentForm = {
      ...form,
      grade_applying_for: form.admitted_class,
    }
    mutation.mutate(payload)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Add Student</h1>
        <p className="text-gray-600 mt-2">Directly add a student to a class</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ---- Student Information ---- */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Student Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Student Name *</label>
              <input
                type="text"
                value={form.student_name}
                onChange={e => set('student_name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.student_name ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.student_name && <p className="text-red-500 text-xs mt-1">{errors.student_name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
              <input
                type="date"
                value={form.date_of_birth}
                onChange={e => set('date_of_birth', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg ${errors.date_of_birth ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.date_of_birth && <p className="text-red-500 text-xs mt-1">{errors.date_of_birth}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
              <select
                value={form.gender}
                onChange={e => set('gender', e.target.value as Gender)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
              <input
                type="text"
                value={form.nationality}
                onChange={e => set('nationality', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Religion</label>
              <input
                type="text"
                value={form.religion ?? ''}
                onChange={e => set('religion', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mother Tongue</label>
              <input
                type="text"
                value={form.mother_tongue ?? ''}
                onChange={e => set('mother_tongue', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* ---- Class Information ---- */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Class Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
              <select
                value={form.admitted_class}
                onChange={e => set('admitted_class', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg ${errors.admitted_class ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Select Class</option>
                {classes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.admitted_class && <p className="text-red-500 text-xs mt-1">{errors.admitted_class}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section *</label>
              <select
                value={form.admitted_section}
                onChange={e => set('admitted_section', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg ${errors.admitted_section ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Select Section</option>
                {sections.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.admitted_section && <p className="text-red-500 text-xs mt-1">{errors.admitted_section}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
              <input
                type="text"
                value={form.roll_number ?? ''}
                onChange={e => set('roll_number', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
              <input
                type="text"
                value={form.academic_year}
                onChange={e => set('academic_year', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* ---- Contact Information ---- */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <input
                type="text"
                value={form.contact_phone}
                onChange={e => set('contact_phone', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg ${errors.contact_phone ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.contact_phone && <p className="text-red-500 text-xs mt-1">{errors.contact_phone}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                value={form.contact_email}
                onChange={e => set('contact_email', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg ${errors.contact_email ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.contact_email && <p className="text-red-500 text-xs mt-1">{errors.contact_email}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
              <textarea
                value={form.residential_address}
                onChange={e => set('residential_address', e.target.value)}
                rows={2}
                className={`w-full px-3 py-2 border rounded-lg ${errors.residential_address ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.residential_address && <p className="text-red-500 text-xs mt-1">{errors.residential_address}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
              <input
                type="text"
                value={form.city}
                onChange={e => set('city', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg ${errors.city ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
              <input
                type="text"
                value={form.state}
                onChange={e => set('state', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg ${errors.state ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
              <input
                type="text"
                value={form.pincode}
                onChange={e => set('pincode', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg ${errors.pincode ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.pincode && <p className="text-red-500 text-xs mt-1">{errors.pincode}</p>}
            </div>
          </div>
        </div>

        {/* ---- Guardian Information ---- */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Primary Guardian</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                value={form.primary_guardian.name}
                onChange={e => setGuardian('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg ${errors.guardian_name ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.guardian_name && <p className="text-red-500 text-xs mt-1">{errors.guardian_name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
              <select
                value={form.primary_guardian.relationship}
                onChange={e => setGuardian('relationship', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Guardian">Guardian</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <input
                type="text"
                value={form.primary_guardian.phone}
                onChange={e => setGuardian('phone', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg ${errors.guardian_phone ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.guardian_phone && <p className="text-red-500 text-xs mt-1">{errors.guardian_phone}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={form.primary_guardian.email ?? ''}
                onChange={e => setGuardian('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
              <input
                type="text"
                value={form.primary_guardian.occupation ?? ''}
                onChange={e => setGuardian('occupation', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* ---- Additional Information ---- */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Information</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Medical Conditions</label>
              <textarea
                value={form.medical_conditions ?? ''}
                onChange={e => set('medical_conditions', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
              <textarea
                value={form.allergies ?? ''}
                onChange={e => set('allergies', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
              <textarea
                value={form.additional_notes ?? ''}
                onChange={e => set('additional_notes', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* ---- Actions ---- */}
        {mutation.isError && (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg">
            Failed to add student. Please check the form and try again.
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/students')}
            className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Adding…' : 'Add Student'}
          </button>
        </div>
      </form>
    </div>
  )
}
