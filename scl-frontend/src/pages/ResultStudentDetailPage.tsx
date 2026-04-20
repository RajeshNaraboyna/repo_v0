import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import resultService from '../services/resultService'
import type { StudentResultResponse } from '../types'
import {
  Box, Typography, Card, CardContent, Breadcrumbs, CircularProgress, Alert, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton,
} from '@mui/material'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import SearchIcon from '@mui/icons-material/Search'

export default function ResultStudentDetailPage() {
  const { examId, className, studentId } = useParams<{ examId: string; className: string; studentId: string }>()
  const numericExamId = Number(examId)
  const decodedClass = decodeURIComponent(className || '')
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [showModal, setShowModal] = useState(false)
  const [formSubject, setFormSubject] = useState('')
  const [formMarks, setFormMarks] = useState('')
  const [formMaxMarks, setFormMaxMarks] = useState('100')
  const [formGrade, setFormGrade] = useState('')
  const [formRemarks, setFormRemarks] = useState('')
  const [uploadSubject, setUploadSubject] = useState('')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadResultId, setUploadResultId] = useState<number | null>(null)
  const [ragStatus, setRagStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [ragMessage, setRagMessage] = useState('')

  const qk = ['student-results', numericExamId, decodedClass, studentId]

  const { data: results = [], isLoading, error } = useQuery({
    queryKey: qk,
    queryFn: () => resultService.getStudentResults(numericExamId, decodedClass, studentId || ''),
    enabled: !!numericExamId && !!decodedClass && !!studentId,
  })

  const upsertMutation = useMutation({
    mutationFn: () => resultService.upsertResult({ exam_id: numericExamId, student_id: studentId || '', class_name: decodedClass, subject: formSubject, marks_obtained: formMarks !== '' ? Number(formMarks) : undefined, max_marks: Number(formMaxMarks) || 100, grade: formGrade || undefined, remarks: formRemarks || undefined }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: qk }); setShowModal(false); resetForm() },
  })

  const uploadPdfMutation = useMutation({
    mutationFn: ({ file, subject }: { file: File; subject: string }) => resultService.uploadPdf(numericExamId, studentId || '', decodedClass, subject, file),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: qk }); setShowUploadModal(false) },
  })

  const uploadToExistingMutation = useMutation({
    mutationFn: ({ file, resultId }: { file: File; resultId: number }) => resultService.uploadPdfToResult(resultId, file),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: qk }); setShowUploadModal(false) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => resultService.deleteResult(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk }),
  })

  const ragIndexMutation = useMutation({
    mutationFn: () => resultService.indexToRag(numericExamId, decodedClass, studentId || ''),
    onSuccess: (data) => { setRagStatus('success'); setRagMessage(data.message); setTimeout(() => setRagStatus('idle'), 5000) },
    onError: (err: Error) => { setRagStatus('error'); setRagMessage(err.message || 'Failed'); setTimeout(() => setRagStatus('idle'), 5000) },
  })

  const resetForm = () => { setFormSubject(''); setFormMarks(''); setFormMaxMarks('100'); setFormGrade(''); setFormRemarks('') }

  const openEditModal = (r: StudentResultResponse) => {
    setFormSubject(r.subject); setFormMarks(r.marks_obtained != null ? String(r.marks_obtained) : ''); setFormMaxMarks(String(r.max_marks)); setFormGrade(r.grade || ''); setFormRemarks(r.remarks || ''); setShowModal(true)
  }

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    if (file.type !== 'application/pdf') { alert('Only PDF files accepted'); return }
    if (uploadResultId) uploadToExistingMutation.mutate({ file, resultId: uploadResultId })
    else if (uploadSubject) uploadPdfMutation.mutate({ file, subject: uploadSubject })
  }

  const handleViewPdf = (r: StudentResultResponse) => {
    const token = localStorage.getItem('access_token')
    window.open(`${resultService.getPdfUrl(r.id)}?token=${token}`, '_blank')
  }

  const totalObtained = results.reduce((s, r) => s + (r.marks_obtained ?? 0), 0)
  const totalMax = results.reduce((s, r) => s + r.max_marks, 0)

  return (
    <Box className="fade-in">
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
        <Typography component={Link} to="/results" color="text.secondary" sx={{ textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>Results</Typography>
        <Typography component={Link} to={`/results/${examId}`} color="text.secondary" sx={{ textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>Exam #{examId}</Typography>
        <Typography component={Link} to={`/results/${examId}/class/${encodeURIComponent(decodedClass)}`} color="text.secondary" sx={{ textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>Class {decodedClass}</Typography>
        <Typography color="text.primary" sx={{ fontWeight: 600 }}>{studentId}</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h1">Student Results</Typography>
          <Typography variant="subtitle1">Student <code>{studentId}</code> · Class {decodedClass}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant={ragStatus === 'success' ? 'outlined' : 'contained'}
            color={ragStatus === 'error' ? 'error' : ragStatus === 'success' ? 'success' : 'secondary'}
            startIcon={<SearchIcon />}
            onClick={() => { setRagStatus('loading'); ragIndexMutation.mutate() }}
            disabled={ragIndexMutation.isPending || results.length === 0}
            size="small"
          >
            {ragIndexMutation.isPending ? 'Indexing...' : ragStatus === 'success' ? 'Indexed' : 'Index to RAG'}
          </Button>
          <Button variant="contained" color="success" size="small" startIcon={<UploadFileIcon />} onClick={() => { setUploadResultId(null); setUploadSubject(''); setShowUploadModal(true) }}>
            Upload PDF
          </Button>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => { resetForm(); setShowModal(true) }}>
            Add Result
          </Button>
        </Box>
      </Box>

      {ragStatus !== 'idle' && ragMessage && (
        <Alert severity={ragStatus === 'success' ? 'success' : ragStatus === 'error' ? 'error' : 'info'} sx={{ mb: 2 }}>{ragMessage}</Alert>
      )}

      {isLoading && <Box sx={{ textAlign: 'center', py: 8 }}><CircularProgress /></Box>}
      {error && <Alert severity="error">Failed to load results</Alert>}

      {!isLoading && !error && (
        <Card>
          <CardContent>
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Subject</TableCell><TableCell>Marks</TableCell><TableCell>Grade</TableCell>
                    <TableCell>Remarks</TableCell><TableCell>PDF</TableCell><TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {results.length === 0 ? (
                    <TableRow><TableCell colSpan={6} sx={{ textAlign: 'center', py: 6 }}><Typography color="text.secondary">No results yet</Typography></TableCell></TableRow>
                  ) : (
                    <>
                      {results.map((r: StudentResultResponse) => (
                        <TableRow key={r.id}>
                          <TableCell sx={{ fontWeight: 600 }}>{r.subject}</TableCell>
                          <TableCell>{r.marks_obtained != null ? `${r.marks_obtained} / ${r.max_marks}` : '—'}</TableCell>
                          <TableCell>{r.grade || '—'}</TableCell>
                          <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.remarks || '—'}</TableCell>
                          <TableCell>
                            {r.has_pdf ? (
                              <Button size="small" color="success" startIcon={<PictureAsPdfIcon />} onClick={() => handleViewPdf(r)}>View</Button>
                            ) : (
                              <Button size="small" onClick={() => { setUploadResultId(r.id); setUploadSubject(r.subject); setShowUploadModal(true) }} startIcon={<UploadFileIcon />}>Upload</Button>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <IconButton size="small" onClick={() => openEditModal(r)}><EditIcon fontSize="small" /></IconButton>
                            <IconButton size="small" color="error" onClick={() => { if (confirm('Delete this result?')) deleteMutation.mutate(r.id) }}><DeleteIcon fontSize="small" /></IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                      {results.length > 0 && (
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>{totalObtained} / {totalMax}</TableCell>
                          <TableCell colSpan={4} />
                        </TableRow>
                      )}
                    </>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Result Dialog */}
      <Dialog open={showModal} onClose={() => setShowModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{formSubject ? `Edit: ${formSubject}` : 'Add Result'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Subject *" fullWidth value={formSubject} onChange={(e) => setFormSubject(e.target.value)} />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Marks Obtained" type="number" fullWidth value={formMarks} onChange={(e) => setFormMarks(e.target.value)} />
              <TextField label="Max Marks" type="number" fullWidth value={formMaxMarks} onChange={(e) => setFormMaxMarks(e.target.value)} />
            </Box>
            <TextField label="Grade" fullWidth value={formGrade} onChange={(e) => setFormGrade(e.target.value)} />
            <TextField label="Remarks" fullWidth multiline rows={2} value={formRemarks} onChange={(e) => setFormRemarks(e.target.value)} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => upsertMutation.mutate()} disabled={upsertMutation.isPending}>
            {upsertMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload PDF Dialog */}
      <Dialog open={showUploadModal} onClose={() => setShowUploadModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Result PDF</DialogTitle>
        <DialogContent>
          {!uploadResultId && (
            <TextField label="Subject *" fullWidth value={uploadSubject} onChange={(e) => setUploadSubject(e.target.value)} sx={{ mt: 1, mb: 2 }} />
          )}
          <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileSelected} style={{ display: 'none' }} />
          <Button variant="outlined" fullWidth startIcon={<UploadFileIcon />} onClick={() => fileInputRef.current?.click()}
            disabled={(!uploadResultId && !uploadSubject) || uploadPdfMutation.isPending || uploadToExistingMutation.isPending}
          >
            {uploadPdfMutation.isPending || uploadToExistingMutation.isPending ? 'Uploading...' : 'Select PDF File'}
          </Button>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setShowUploadModal(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
