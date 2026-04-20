import { useState, useCallback } from 'react'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import DraggableBlock from './DraggableBlock'
import type { ContentBlock } from '../../types'
import { Box, Typography, Button, Chip, ToggleButton } from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import EditIcon from '@mui/icons-material/Edit'

interface QuestionPaperDesignerProps {
  blocks: ContentBlock[]
  onChange: (blocks: ContentBlock[]) => void
  editable?: boolean
}

let _blockIdCounter = 0
function generateBlockId(): string {
  _blockIdCounter += 1
  return `block-${Date.now()}-${_blockIdCounter}`
}

const BLOCK_TYPES: { type: ContentBlock['type']; label: string; icon: string }[] = [
  { type: 'header', label: 'Header', icon: '📄' },
  { type: 'instructions', label: 'Instructions', icon: '📋' },
  { type: 'section_title', label: 'Section', icon: '📌' },
  { type: 'question', label: 'Question', icon: '❓' },
  { type: 'text', label: 'Text', icon: '📝' },
  { type: 'image', label: 'Image', icon: '🖼️' },
  { type: 'divider', label: 'Divider', icon: '➖' },
]

const DEFAULT_CONTENT: Record<string, string> = {
  header: '<h2 style="text-align: center">School Name</h2><p style="text-align: center"><strong>Subject — Exam Name</strong></p><p style="text-align: center">Class: __ &nbsp; | &nbsp; Time: __ min &nbsp; | &nbsp; Max Marks: __</p>',
  instructions: '<p><strong>General Instructions:</strong></p><ol><li>All questions are compulsory.</li><li>Write neat and legible answers.</li><li>Marks are indicated against each question.</li></ol>',
  section_title: '<h3>Section A — Objective Questions</h3>',
  question: '<p>Enter your question here.</p>',
  text: '<p></p>',
  image: '<p><em>[Image placeholder – paste URL via toolbar]</em></p>',
  divider: '',
}

export default function QuestionPaperDesigner({ blocks, onChange, editable = true }: QuestionPaperDesignerProps) {
  const [previewMode, setPreviewMode] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = blocks.findIndex((b) => b.id === active.id)
    const newIndex = blocks.findIndex((b) => b.id === over.id)
    const reordered = arrayMove(blocks, oldIndex, newIndex).map((b, i) => ({ ...b, position: i }))
    onChange(reordered)
  }, [blocks, onChange])

  const addBlock = useCallback((type: ContentBlock['type']) => {
    const newBlock: ContentBlock = {
      id: generateBlockId(), type, content: DEFAULT_CONTENT[type] || '', position: blocks.length,
      metadata: type === 'question' ? { questionNumber: blocks.filter((b) => b.type === 'question').length + 1, marks: 5, questionType: 'descriptive', section: '' } : undefined,
    }
    onChange([...blocks, newBlock])
  }, [blocks, onChange])

  const updateContent = useCallback((id: string, content: string) => {
    onChange(blocks.map((b) => (b.id === id ? { ...b, content } : b)))
  }, [blocks, onChange])

  const updateMetadata = useCallback((id: string, field: string, value: unknown) => {
    onChange(blocks.map((b) => b.id === id ? { ...b, metadata: { ...b.metadata, [field]: value } } : b))
  }, [blocks, onChange])

  const removeBlock = useCallback((id: string) => {
    onChange(blocks.filter((b) => b.id !== id).map((b, i) => ({ ...b, position: i })))
  }, [blocks, onChange])

  const duplicateBlock = useCallback((id: string) => {
    const idx = blocks.findIndex((b) => b.id === id)
    if (idx === -1) return
    const source = blocks[idx]
    const dup: ContentBlock = { ...source, id: generateBlockId(), metadata: source.metadata ? { ...source.metadata } : undefined }
    const updated = [...blocks]
    updated.splice(idx + 1, 0, dup)
    onChange(updated.map((b, i) => ({ ...b, position: i })))
  }, [blocks, onChange])

  const questionBlocks = blocks.filter((b) => b.type === 'question')
  const totalMarks = questionBlocks.reduce((sum, b) => sum + (Number(b.metadata?.marks) || 0), 0)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Top controls bar */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, bgcolor: '#fff', borderRadius: 3, boxShadow: 1, border: 1, borderColor: 'grey.100', p: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mr: 0.5 }}>Add Block:</Typography>
          {BLOCK_TYPES.map((bt) => (
            <Button key={bt.type} size="small" variant="outlined" onClick={() => addBlock(bt.type)} disabled={!editable || previewMode}
              sx={{ textTransform: 'none', fontSize: 12, px: 1.5, py: 0.5, borderColor: 'grey.300', color: 'text.secondary', '&:hover': { borderColor: 'grey.400', bgcolor: 'grey.50' } }}
            >
              {bt.icon} {bt.label}
            </Button>
          ))}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="caption" color="text.secondary">
            {questionBlocks.length} questions · {totalMarks} marks · {blocks.length} blocks
          </Typography>
          <ToggleButton value="preview" selected={previewMode} onChange={() => setPreviewMode(!previewMode)} size="small"
            sx={{ textTransform: 'none', fontSize: 12, px: 1.5 }}
          >
            {previewMode ? <><EditIcon sx={{ fontSize: 14, mr: 0.5 }} /> Edit</> : <><VisibilityIcon sx={{ fontSize: 14, mr: 0.5 }} /> Preview</>}
          </ToggleButton>
        </Box>
      </Box>

      {/* Block list */}
      {blocks.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, bgcolor: '#fff', borderRadius: 3, border: '2px dashed', borderColor: 'grey.300' }}>
          <Typography color="text.disabled" variant="h6" sx={{ mb: 1 }}>No content blocks yet</Typography>
          <Typography color="text.disabled" variant="body2">Use the "Add Block" buttons above to start designing.</Typography>
        </Box>
      ) : previewMode ? (
        /* Preview mode */
        <Box sx={{ bgcolor: '#fff', borderRadius: 3, boxShadow: 1, border: 1, borderColor: 'grey.100', p: 4, maxWidth: 800, mx: 'auto' }}>
          {blocks.map((block) => (
            <Box key={block.id} sx={{ mb: 2 }}>
              {block.type === 'divider' ? (
                <Box component="hr" sx={{ border: 0, borderTop: 1, borderColor: 'grey.300', my: 2 }} />
              ) : block.type === 'question' ? (
                <Box sx={{ mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                    <Typography variant="body2" color="text.primary" sx={{ fontWeight: 700 }}>
                      Q{block.metadata?.questionNumber || '?'}.
                      {block.metadata?.section ? ` [Section ${block.metadata.section}]` : ''}
                    </Typography>
                    <Chip label={`${block.metadata?.marks ?? 0} marks`} size="small" variant="outlined" />
                  </Box>
                  <Box dangerouslySetInnerHTML={{ __html: block.content }} sx={{ fontSize: 14, lineHeight: 1.7, color: 'text.primary' }} />
                </Box>
              ) : (
                <Box dangerouslySetInnerHTML={{ __html: block.content }} sx={{ fontSize: 14, lineHeight: 1.7, color: 'text.primary' }} />
              )}
            </Box>
          ))}
        </Box>
      ) : (
        /* Edit mode with drag-and-drop */
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {blocks.map((block) => (
                <DraggableBlock key={block.id} block={block} isEditable={editable} onContentChange={updateContent} onMetadataChange={updateMetadata} onRemove={removeBlock} onDuplicate={duplicateBlock} />
              ))}
            </Box>
          </SortableContext>
        </DndContext>
      )}
    </Box>
  )
}
