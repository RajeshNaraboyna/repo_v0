import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ContentBlock } from '../../types'
import RichTextEditor from './RichTextEditor'
import { Box, Typography, IconButton, Tooltip, TextField, MenuItem } from '@mui/material'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import CloseIcon from '@mui/icons-material/Close'

const BLOCK_LABELS: Record<string, string> = {
  header: 'Paper Header', instructions: 'Instructions', section_title: 'Section Title',
  question: 'Question', text: 'Text Block', image: 'Image', divider: 'Divider',
}

const BLOCK_BORDER_COLOR: Record<string, string> = {
  header: '#3b82f6', instructions: '#f59e0b', section_title: '#8b5cf6',
  question: '#22c55e', text: '#9ca3af', image: '#ec4899', divider: '#d1d5db',
}

const BLOCK_BG: Record<string, string> = {
  header: 'rgba(59,130,246,0.04)', instructions: 'rgba(245,158,11,0.04)',
  section_title: 'rgba(139,92,246,0.04)', question: 'rgba(34,197,94,0.04)',
  text: 'rgba(156,163,175,0.04)', image: 'rgba(236,72,153,0.04)', divider: 'rgba(209,213,219,0.04)',
}

const BLOCK_ICONS: Record<string, string> = {
  header: '📄', instructions: '📋', section_title: '📌',
  question: '❓', text: '📝', image: '🖼️', divider: '➖',
}

interface DraggableBlockProps {
  block: ContentBlock
  isEditable: boolean
  onContentChange: (id: string, content: string) => void
  onMetadataChange: (id: string, field: string, value: unknown) => void
  onRemove: (id: string) => void
  onDuplicate: (id: string) => void
}

export default function DraggableBlock({ block, isEditable, onContentChange, onMetadataChange, onRemove, onDuplicate }: DraggableBlockProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id })

  const style = { transform: CSS.Transform.toString(transform), transition }
  const borderColor = BLOCK_BORDER_COLOR[block.type] || '#9ca3af'
  const bgColor = BLOCK_BG[block.type] || 'transparent'

  const placeholderMap: Record<string, string> = {
    header: 'Enter paper title, school name, exam details…',
    instructions: 'Enter general instructions for the paper…',
    section_title: 'Section A – Objective Questions',
    question: 'Type the question here…',
    text: 'Enter any additional text…',
    image: 'Paste an image URL or describe the image…',
    divider: '',
  }

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        position: 'relative',
        borderLeft: `4px solid ${borderColor}`,
        border: 1,
        borderColor: 'grey.200',
        borderRadius: 2,
        bgcolor: bgColor,
        boxShadow: isDragging ? 4 : 1,
        opacity: isDragging ? 0.5 : 1,
        transition: 'box-shadow 0.2s, opacity 0.2s',
        '&:hover .block-actions': { opacity: 1 },
      }}
    >
      {/* Header bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.5, py: 0.75, bgcolor: 'rgba(255,255,255,0.7)', borderBottom: 1, borderColor: 'grey.100', borderRadius: '8px 8px 0 0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isEditable && (
            <Tooltip title="Drag to reorder">
              <IconButton size="small" {...attributes} {...listeners} sx={{ cursor: 'grab', '&:active': { cursor: 'grabbing' }, touchAction: 'none', color: 'grey.400', '&:hover': { color: 'grey.600' } }}>
                <DragIndicatorIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            {BLOCK_ICONS[block.type]} {BLOCK_LABELS[block.type] || block.type}
          </Typography>
          <Typography variant="caption" sx={{ px: 0.75, py: 0.25, bgcolor: 'grey.100', borderRadius: 1, fontSize: 10, color: 'text.disabled' }}>
            #{block.position + 1}
          </Typography>
        </Box>

        {isEditable && (
          <Box className="block-actions" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, opacity: 0, transition: 'opacity 0.15s' }}>
            <Tooltip title="Duplicate"><IconButton size="small" onClick={() => onDuplicate(block.id)} sx={{ color: 'grey.400', '&:hover': { color: 'primary.main', bgcolor: 'rgba(37,99,235,0.08)' } }}><ContentCopyIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
            <Tooltip title="Remove"><IconButton size="small" onClick={() => onRemove(block.id)} sx={{ color: 'grey.400', '&:hover': { color: 'error.main', bgcolor: 'rgba(239,68,68,0.08)' } }}><CloseIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
          </Box>
        )}
      </Box>

      {/* Block body */}
      <Box sx={{ p: 1.5 }}>
        {/* Question metadata row */}
        {block.type === 'question' && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
            <TextField label="Q#" type="number" size="small" value={block.metadata?.questionNumber ?? ''} onChange={(e) => onMetadataChange(block.id, 'questionNumber', Number(e.target.value))} disabled={!isEditable} sx={{ width: 80 }} slotProps={{ htmlInput: { min: 1 } }} />
            <TextField label="Marks" type="number" size="small" value={block.metadata?.marks ?? ''} onChange={(e) => onMetadataChange(block.id, 'marks', Number(e.target.value))} disabled={!isEditable} sx={{ width: 90 }} slotProps={{ htmlInput: { min: 0, step: 0.5 } }} />
            <TextField label="Type" size="small" select value={block.metadata?.questionType ?? 'descriptive'} onChange={(e) => onMetadataChange(block.id, 'questionType', e.target.value)} disabled={!isEditable} sx={{ minWidth: 140 }}>
              <MenuItem value="mcq">MCQ</MenuItem>
              <MenuItem value="short_answer">Short Answer</MenuItem>
              <MenuItem value="long_answer">Long Answer</MenuItem>
              <MenuItem value="descriptive">Descriptive</MenuItem>
              <MenuItem value="fill_in_blank">Fill in the Blank</MenuItem>
            </TextField>
            <TextField label="Section" size="small" value={block.metadata?.section ?? ''} onChange={(e) => onMetadataChange(block.id, 'section', e.target.value)} disabled={!isEditable} placeholder="A" sx={{ width: 80 }} />
          </Box>
        )}

        {block.type === 'divider' ? (
          <Box component="hr" sx={{ border: 0, borderTop: 1, borderColor: 'grey.300', my: 1 }} />
        ) : (
          <RichTextEditor
            content={block.content}
            onChange={(html) => onContentChange(block.id, html)}
            placeholder={placeholderMap[block.type] || 'Start typing…'}
            editable={isEditable}
            compact={block.type === 'section_title'}
          />
        )}
      </Box>
    </Box>
  )
}
