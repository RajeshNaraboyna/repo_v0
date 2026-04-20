import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import admissionService from '../services/admissionService'
import { useSchoolConfig } from '../hooks/useSchoolConfig'
import type { AdmissionRequestForm } from '../types'
import {
  Box, Typography, Card, CardContent, TextField, Button, MenuItem, Stepper, Step,
  StepLabel, Checkbox, FormControlLabel, Alert, Grid, FormHelperText,
} from '@mui/material'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import SendIcon from '@mui/icons-material/Send'

const relationships = ['Father', 'Mother', 'Guardian', 'Other']
const steps = ['Student Info', 'Contact Details', 'Guardian Info']

export default function AdmissionRequestPage() {
  const navigate = useNavigate()
  const { grades } = useSchoolConfig()
  const [step, setStep] = useState(0)
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
      setStep(3)
    },
  })

  const nextStep = async () => {
    let fieldsToValidate: (keyof AdmissionRequestForm)[] = []
    if (step === 0) {
      fieldsToValidate = ['student_name', 'date_of_birth', 'gender', 'grade_applying_for', 'academic_year']
    } else if (step === 1) {
      fieldsToValidate = ['contact_phone', 'contact_email', 'residential_address', 'city', 'state', 'pincode']
    }
    const isValid = await trigger(fieldsToValidate)
    if (isValid) setStep(step + 1)
  }

  const prevStep = () => setStep(step - 1)
  const onSubmit = (data: AdmissionRequestForm) => mutation.mutate(data)

  if (submittedId) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto' }} className="fade-in">
        <Card>
          <CardContent sx={{ textAlign: 'center', p: 5 }}>
            <Box
              sx={{
                width: 64, height: 64, borderRadius: '50%', bgcolor: 'success.light',
                display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3,
              }}
            >
              <CheckCircleOutlinedIcon sx={{ fontSize: 36, color: 'success.dark' }} />
            </Box>
            <Typography variant="h2" gutterBottom>Application Submitted!</Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Your admission request has been submitted successfully.
            </Typography>
            <Box sx={{ bgcolor: 'background.default', borderRadius: 3, p: 3, mb: 3 }}>
              <Typography variant="body2" color="text.secondary">Your Application ID</Typography>
              <Typography variant="h4" sx={{ fontFamily: 'monospace', color: 'primary.main', fontWeight: 700 }}>
                {submittedId}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Please save this ID to check your application status later.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button variant="contained" onClick={() => navigate(`/admission/status/${submittedId}`)}>
                Check Status
              </Button>
              <Button variant="outlined" onClick={() => { setSubmittedId(null); setStep(0) }}>
                Submit Another
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }} className="fade-in">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h1">Student Admission Request</Typography>
        <Typography variant="subtitle1" sx={{ mt: 0.5 }}>
          Fill out the form below to submit an admission request
        </Typography>
      </Box>

      <Stepper activeStep={step} alternativeLabel sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            {step === 0 && (
              <Box>
                <Typography variant="h3" sx={{ mb: 3 }}>Student Information</Typography>
                <Grid container spacing={2.5}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Student Name *"
                      fullWidth
                      {...register('student_name', { required: 'Student name is required' })}
                      error={!!errors.student_name}
                      helperText={errors.student_name?.message}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Date of Birth *"
                      type="date"
                      fullWidth
                      slotProps={{ inputLabel: { shrink: true } }}
                      {...register('date_of_birth', { required: 'Date of birth is required' })}
                      error={!!errors.date_of_birth}
                      helperText={errors.date_of_birth?.message}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      select
                      label="Gender *"
                      fullWidth
                      defaultValue=""
                      {...register('gender', { required: 'Gender is required' })}
                      error={!!errors.gender}
                      helperText={errors.gender?.message}
                    >
                      <MenuItem value="">Select gender</MenuItem>
                      <MenuItem value="male">Male</MenuItem>
                      <MenuItem value="female">Female</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField label="Nationality" fullWidth {...register('nationality')} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      select
                      label="Grade Applying For *"
                      fullWidth
                      defaultValue=""
                      {...register('grade_applying_for', { required: 'Grade is required' })}
                      error={!!errors.grade_applying_for}
                      helperText={errors.grade_applying_for?.message}
                    >
                      <MenuItem value="">Select grade</MenuItem>
                      {grades.map((grade) => (
                        <MenuItem key={grade} value={grade}>{grade}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      select
                      label="Academic Year *"
                      fullWidth
                      defaultValue="2026-2027"
                      {...register('academic_year', { required: 'Academic year is required' })}
                      error={!!errors.academic_year}
                      helperText={errors.academic_year?.message}
                    >
                      <MenuItem value="2026-2027">2026-2027</MenuItem>
                      <MenuItem value="2027-2028">2027-2028</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField label="Religion" fullWidth {...register('religion')} placeholder="Optional" />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField label="Mother Tongue" fullWidth {...register('mother_tongue')} placeholder="Optional" />
                  </Grid>
                </Grid>
              </Box>
            )}

            {step === 1 && (
              <Box>
                <Typography variant="h3" sx={{ mb: 3 }}>Contact Details</Typography>
                <Grid container spacing={2.5}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Contact Phone *"
                      fullWidth
                      {...register('contact_phone', {
                        required: 'Phone number is required',
                        pattern: { value: /^[0-9]{10}$/, message: 'Enter a valid 10-digit phone number' }
                      })}
                      error={!!errors.contact_phone}
                      helperText={errors.contact_phone?.message}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Contact Email *"
                      type="email"
                      fullWidth
                      {...register('contact_email', {
                        required: 'Email is required',
                        pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email' }
                      })}
                      error={!!errors.contact_email}
                      helperText={errors.contact_email?.message}
                    />
                  </Grid>
                  <Grid size={12}>
                    <TextField
                      label="Residential Address *"
                      fullWidth
                      multiline
                      rows={3}
                      {...register('residential_address', { required: 'Address is required' })}
                      error={!!errors.residential_address}
                      helperText={errors.residential_address?.message}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      label="City *"
                      fullWidth
                      {...register('city', { required: 'City is required' })}
                      error={!!errors.city}
                      helperText={errors.city?.message}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      label="State *"
                      fullWidth
                      {...register('state', { required: 'State is required' })}
                      error={!!errors.state}
                      helperText={errors.state?.message}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      label="Pincode *"
                      fullWidth
                      {...register('pincode', {
                        required: 'Pincode is required',
                        pattern: { value: /^[0-9]{6}$/, message: 'Enter a valid 6-digit pincode' }
                      })}
                      error={!!errors.pincode}
                      helperText={errors.pincode?.message}
                    />
                  </Grid>
                </Grid>
              </Box>
            )}

            {step === 2 && (
              <Box>
                <Typography variant="h3" sx={{ mb: 3 }}>Parent/Guardian Information</Typography>
                <Box sx={{ bgcolor: 'background.default', borderRadius: 3, p: 3, mb: 3 }}>
                  <Typography variant="h5" gutterBottom>Primary Guardian *</Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        label="Name *"
                        fullWidth
                        {...register('primary_guardian.name', { required: 'Guardian name is required' })}
                        error={!!errors.primary_guardian?.name}
                        helperText={errors.primary_guardian?.name?.message}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        select
                        label="Relationship *"
                        fullWidth
                        defaultValue=""
                        {...register('primary_guardian.relationship', { required: 'Relationship is required' })}
                        error={!!errors.primary_guardian?.relationship}
                        helperText={errors.primary_guardian?.relationship?.message}
                      >
                        <MenuItem value="">Select relationship</MenuItem>
                        {relationships.map((rel) => (
                          <MenuItem key={rel} value={rel}>{rel}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        label="Phone *"
                        fullWidth
                        {...register('primary_guardian.phone', { required: 'Phone number is required' })}
                        error={!!errors.primary_guardian?.phone}
                        helperText={errors.primary_guardian?.phone?.message}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField label="Email" fullWidth {...register('primary_guardian.email')} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField label="Occupation" fullWidth {...register('primary_guardian.occupation')} />
                    </Grid>
                  </Grid>
                </Box>

                <Grid container spacing={2}>
                  <Grid size={12}>
                    <TextField label="Medical Conditions" fullWidth multiline rows={2} {...register('medical_conditions')} />
                  </Grid>
                  <Grid size={12}>
                    <TextField label="How did you hear about us?" fullWidth {...register('how_did_you_hear')} />
                  </Grid>
                </Grid>

                <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                  <FormControlLabel
                    control={<Checkbox {...register('terms_accepted', { required: 'You must accept the terms' })} />}
                    label={<Typography variant="body2">I accept the Terms and Conditions *</Typography>}
                  />
                  {errors.terms_accepted && <FormHelperText error>{errors.terms_accepted.message}</FormHelperText>}
                  <FormControlLabel
                    control={<Checkbox {...register('data_privacy_accepted', { required: 'You must accept the data privacy policy' })} />}
                    label={<Typography variant="body2">I accept the Data Privacy Policy *</Typography>}
                  />
                  {errors.data_privacy_accepted && <FormHelperText error>{errors.data_privacy_accepted.message}</FormHelperText>}
                </Box>
              </Box>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
              {step > 0 ? (
                <Button variant="outlined" onClick={prevStep} startIcon={<ArrowBackIcon />}>Previous</Button>
              ) : <Box />}
              {step < 2 ? (
                <Button variant="contained" onClick={nextStep} endIcon={<ArrowForwardIcon />}>Next</Button>
              ) : (
                <Button type="submit" variant="contained" endIcon={<SendIcon />} disabled={mutation.isPending}>
                  {mutation.isPending ? 'Submitting...' : 'Submit Application'}
                </Button>
              )}
            </Box>

            {mutation.isError && (
              <Alert severity="error" sx={{ mt: 2 }}>Failed to submit application. Please try again.</Alert>
            )}
          </CardContent>
        </Card>
      </form>
    </Box>
  )
}
