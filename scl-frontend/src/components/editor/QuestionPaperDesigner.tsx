import { useState, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import DraggableBlock from './DraggableBlock'
import type { ContentBlock } from '../../types'

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
  { type: 'header', label: 'Paper Header', icon: '📄' },
  { type: 'instructions', label: 'Instructions', icon: '📋' },
  { type: 'section_title', label: 'Section Title', icon: '📌' },
  { type: 'question', label: 'Question', icon: '❓' },
  { type: 'text', label: 'Text Block', icon: '📝' },
  { type: 'image', label: 'Image', icon: '🖼️' },
  { type: 'divider', label: 'Divider', icon: '➖' },
]

const DEFAULT_CONTENT: Record<string, string> = {
  header:
    '<h2 style="text-align: center">School Name</h2><p style="text-align: center"><strong>Subject — Exam Name</strong></p><p style="text-align: center">Class: __ &nbsp; | &nbsp; Time: __ min &nbsp; | &nbsp; Max Marks: __</p>',
  instructions:
    '<p><strong>General Instructions:</strong></p><ol><li>All questions are compulsory.</li><li>Write neat and legible answers.</li><li>Marks are indicated against each question.</li></ol>',
  section_title: '<h3>Section A — Objective Questions</h3>',
  question: '<p>Enter your question here.</p>',
  text: '<p></p>',
  image: '<p><em>[Image placeholder – paste URL via toolbar]</em></p>',
  divider: '',
}

export default function QuestionPaperDesigner({
  blocks,
  onChange,
  editable = true,
}: QuestionPaperDesignerProps) {
  const [previewMode, setPreviewMode] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // ── Reorder after drag-and-drop ───────────────────────────
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIndex = blocks.findIndex((b) => b.id === active.id)
      const newIndex = blocks.findIndex((b) => b.id === over.id)
      const reordered = arrayMove(blocks, oldIndex, newIndex).map((b, i) => ({
        ...b,
        position: i,
      }))
      onChange(reordered)
    },
    [blocks, onChange]
  )

  // ── Add a new block ───────────────────────────────────────
  const addBlock = useCallback(
    (type: ContentBlock['type']) => {
      const newBlock: ContentBlock = {
        id: generateBlockId(),
        type,
        content: DEFAULT_CONTENT[type] || '',
        position: blocks.length,
        metadata:
          type === 'question'
            ? {
                questionNumber: blocks.filter((b) => b.type === 'question').length + 1,
                marks: 5,
                questionType: 'descriptive',
                section: '',
              }
            : undefined,
      }
      onChange([...blocks, newBlock])
    },
    [blocks, onChange]
  )

  // ── Update block content ──────────────────────────────────
  const updateContent = useCallback(
    (id: string, content: string) => {
      onChange(blocks.map((b) => (b.id === id ? { ...b, content } : b)))
    },
    [blocks, onChange]
  )

  // ── Update block metadata ─────────────────────────────────
  const updateMetadata = useCallback(
    (id: string, field: string, value: unknown) => {
      onChange(
        blocks.map((b) =>
          b.id === id
            ? { ...b, metadata: { ...b.metadata, [field]: value } }
            : b
        )
      )
    },
    [blocks, onChange]
  )

  // ── Remove block ──────────────────────────────────────────
  const removeBlock = useCallback(
    (id: string) => {
      onChange(
        blocks
          .filter((b) => b.id !== id)
          .map((b, i) => ({ ...b, position: i }))
      )
    },
    [blocks, onChange]
  )

  // ── Duplicate block ───────────────────────────────────────
  const duplicateBlock = useCallback(
    (id: string) => {
      const idx = blocks.findIndex((b) => b.id === id)
      if (idx === -1) return
      const source = blocks[idx]
      const duplicate: ContentBlock = {
        ...source,
        id: generateBlockId(),
        metadata: source.metadata ? { ...source.metadata } : undefined,
      }
      const updated = [...blocks]
      updated.splice(idx + 1, 0, duplicate)
      onChange(updated.map((b, i) => ({ ...b, position: i })))
    },
    [blocks, onChange]
  )

  // ── Compute question stats ────────────────────────────────
  const questionBlocks = blocks.filter((b) => b.type === 'question')
  const totalMarks = questionBlocks.reduce(
    (sum, b) => sum + (Number(b.metadata?.marks) || 0),
    0
  )

  return (
    <div className="space-y-4">
      {/* Top controls bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-lg shadow-sm border p-4">
        {/* Add block buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-600 mr-1">Add Block:</span>
          {BLOCK_TYPES.map((bt) => (
            <button
              key={bt.type}
              onClick={() => addBlock(bt.type)}
              disabled={!editable || previewMode}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {bt.icon} {bt.label}
            </button>
          ))}
        </div>

        {/* Stats + preview toggle */}
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-500">
            {questionBlocks.length} questions &middot; {totalMarks} marks &middot;{' '}
            {blocks.length} blocks
          </span>
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
              previewMode
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {previewMode ? '✏️ Edit Mode' : '👁️ Preview'}
          </button>
        </div>
      </div>

      {/* Block list – drag-and-drop zone */}
      {blocks.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-400 text-lg mb-2">No content blocks yet</p>
          <p className="text-gray-400 text-sm">
            Use the &ldquo;Add Block&rdquo; buttons above to start designing the question paper.
          </p>
        </div>
      ) : previewMode ? (
        /* ── Preview mode ── */
        <div className="bg-white rounded-lg shadow-sm border p-8 space-y-4 max-w-3xl mx-auto print:shadow-none print:border-none">
          {blocks.map((block) => (
            <div key={block.id}>
              {block.type === 'divider' ? (
                <hr className="border-gray-300 my-4" />
              ) : block.type === 'question' ? (
                <div className="mb-3">
                  <div className="flex justify-between items-start text-sm mb-1">
                    <span className="font-semibold text-gray-700">
                      Q{block.metadata?.questionNumber || '?'}.
                      {block.metadata?.section
                        ? ` [Section ${block.metadata.section}]`
                        : ''}
                    </span>
                    <span className="text-gray-500 text-xs">
                      [{block.metadata?.marks ?? 0} marks]
                    </span>
                  </div>
                  <div
                    className="prose prose-sm max-w-none text-gray-800"
                    dangerouslySetInnerHTML={{ __html: block.content }}
                  />
                </div>
              ) : (
                <div
                  className="prose prose-sm max-w-none text-gray-800"
                  dangerouslySetInnerHTML={{ __html: block.content }}
                />
              )}
            </div>
          ))}
        </div>
      ) : (
        /* ── Edit mode with drag-and-drop ── */
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={blocks.map((b) => b.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {blocks.map((block) => (
                <DraggableBlock
                  key={block.id}
                  block={block}
                  isEditable={editable}
                  onContentChange={updateContent}
                  onMetadataChange={updateMetadata}
                  onRemove={removeBlock}
                  onDuplicate={duplicateBlock}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}
