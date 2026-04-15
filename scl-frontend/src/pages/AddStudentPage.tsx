import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import admissionService from '../services/admissionService'
import { useSchoolConfig } from '../hooks/useSchoolConfig'
import type { DirectStudentForm } from '../types'
import {
  Box, Typography, Card, CardContent, TextField, Button, MenuItem, Grid, Alert,
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

const initialForm: DirectStudentForm = {
  student_name: '', date_of_birth: '', gender: 'male', nationality: 'Indian',
  religion: '', mother_tongue: '', grade_applying_for: '', academic_year: '2026-2027',
  admitted_class: '', admitted_section: '', roll_number: '', contact_phone: '',
  contact_email: '', residential_address: '', city: '', state: '', pincode: '',
  primary_guardian: { name: '', relationship: 'Father', phone: '', email: '', occupation: '' },
  medical_conditions: '', allergies: '', special_needs: '', additional_notes: '',
}

export default function AddStudentPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { classes, sections } = useSchoolConfig()
  const [form, setForm] = useState<DirectStudentForm>({ ...initialForm })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const mutation = useMutation({
    mutationFn: (data: DirectStudentForm) => admissionService.addStudent(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admitted-students'] }); navigate('/students') },
  })

  const set = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n })
  }
  const setGuardian = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, primary_guardian: { ...prev.primary_guardian, [field]: value } }))
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
    if (!form.primary_guardian.name.trim()) e.guardian_name = 'Required'
    if (!form.primary_guardian.phone.trim()) e.guardian_phone = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    mutation.mutate({ ...form, grade_applying_for: form.admitted_class })
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }} className="fade-in">
      <Box sx={{ mb: 4 }}>
        <Button size="small" startIcon={<ArrowBackIcon />} onClick={() => navigate('/students')} sx={{ mb: 1 }}>Back to Students</Button>
        <Typography variant="h1">Add Student</Typography>
        <Typography variant="subtitle1">Directly add a student to a class</Typography>
      </Box>

      {mutation.isError && <Alert severity="error" sx={{ mb: 3 }}>Failed to add student. Please try again.</Alert>}

      <form onSubmit={handleSubmit}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h3" gutterBottom>Student Information</Typography>
            <Grid container spacing={2}>
              <Grid size={12}><TextField label="Student Name *" fullWidth value={form.student_name} onChange={(e) => set('student_name', e.target.value)} error={!!errors.student_name} helperText={errors.student_name} /></Grid>
              <Grid size={{ xs: 12, md: 6 }}><TextField label="Date of Birth *" type="date" fullWidth slotProps={{ inputLabel: { shrink: true } }} value={form.date_of_birth} onChange={(e) => set('date_of_birth', e.target.value)} error={!!errors.date_of_birth} helperText={errors.date_of_birth} /></Grid>
              <Grid size={{ xs: 12, md: 6 }}><TextField select label="Gender" fullWidth value={form.gender} onChange={(e) => set('gender', e.target.value)}><MenuItem value="male">Male</MenuItem><MenuItem value="female">Female</MenuItem><MenuItem value="other">Other</MenuItem></TextField></Grid>
              <Grid size={{ xs: 12, md: 6 }}><TextField label="Nationality" fullWidth value={form.nationality} onChange={(e) => set('nationality', e.target.value)} /></Grid>
              <Grid size={{ xs: 12, md: 6 }}><TextField label="Mother Tongue" fullWidth value={form.mother_tongue ?? ''} onChange={(e) => set('mother_tongue', e.target.value)} /></Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h3" gutterBottom>Class Information</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}><TextField select label="Class *" fullWidth value={form.admitted_class} onChange={(e) => set('admitted_class', e.target.value)} error={!!errors.admitted_class} helperText={errors.admitted_class}><MenuItem value="">Select</MenuItem>{classes.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}</TextField></Grid>
              <Grid size={{ xs: 12, md: 4 }}><TextField select label="Section *" fullWidth value={form.admitted_section} onChange={(e) => set('admitted_section', e.target.value)} error={!!errors.admitted_section} helperText={errors.admitted_section}><MenuItem value="">Select</MenuItem>{sections.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField></Grid>
              <Grid size={{ xs: 12, md: 4 }}><TextField label="Roll Number" fullWidth value={form.roll_number ?? ''} onChange={(e) => set('roll_number', e.target.value)} /></Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h3" gutterBottom>Contact Information</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}><TextField label="Phone *" fullWidth value={form.contact_phone} onChange={(e) => set('contact_phone', e.target.value)} error={!!errors.contact_phone} helperText={errors.contact_phone} /></Grid>
              <Grid size={{ xs: 12, md: 6 }}><TextField label="Email *" type="email" fullWidth value={form.contact_email} onChange={(e) => set('contact_email', e.target.value)} error={!!errors.contact_email} helperText={errors.contact_email} /></Grid>
              <Grid size={12}><TextField label="Address *" fullWidth multiline rows={2} value={form.residential_address} onChange={(e) => set('residential_address', e.target.value)} error={!!errors.residential_address} helperText={errors.residential_address} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><TextField label="City *" fullWidth value={form.city} onChange={(e) => set('city', e.target.value)} error={!!errors.city} helperText={errors.city} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><TextField label="State *" fullWidth value={form.state} onChange={(e) => set('state', e.target.value)} error={!!errors.state} helperText={errors.state} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><TextField label="Pincode *" fullWidth value={form.pincode} onChange={(e) => set('pincode', e.target.value)} error={!!errors.pincode} helperText={errors.pincode} /></Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h3" gutterBottom>Primary Guardian</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}><TextField label="Name *" fullWidth value={form.primary_guardian.name} onChange={(e) => setGuardian('name', e.target.value)} error={!!errors.guardian_name} helperText={errors.guardian_name} /></Grid>
              <Grid size={{ xs: 12, md: 6 }}><TextField select label="Relationship" fullWidth value={form.primary_guardian.relationship} onChange={(e) => setGuardian('relationship', e.target.value)}><MenuItem value="Father">Father</MenuItem><MenuItem value="Mother">Mother</MenuItem><MenuItem value="Guardian">Guardian</MenuItem><MenuItem value="Other">Other</MenuItem></TextField></Grid>
              <Grid size={{ xs: 12, md: 6 }}><TextField label="Phone *" fullWidth value={form.primary_guardian.phone} onChange={(e) => setGuardian('phone', e.target.value)} error={!!errors.guardian_phone} helperText={errors.guardian_phone} /></Grid>
              <Grid size={{ xs: 12, md: 6 }}><TextField label="Email" fullWidth value={form.primary_guardian.email ?? ''} onChange={(e) => setGuardian('email', e.target.value)} /></Grid>
            </Grid>
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="outlined" onClick={() => navigate('/students')}>Cancel</Button>
          <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : 'Add Student'}
          </Button>
        </Box>
      </form>
    </Box>
  )
}
