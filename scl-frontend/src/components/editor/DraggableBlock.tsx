import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ContentBlock } from '../../types'
import RichTextEditor from './RichTextEditor'

const BLOCK_LABELS: Record<string, string> = {
  header: 'Paper Header',
  instructions: 'Instructions',
  section_title: 'Section Title',
  question: 'Question',
  text: 'Text Block',
  image: 'Image',
  divider: 'Divider',
}

const BLOCK_COLORS: Record<string, string> = {
  header: 'border-l-blue-500 bg-blue-50/30',
  instructions: 'border-l-amber-500 bg-amber-50/30',
  section_title: 'border-l-purple-500 bg-purple-50/30',
  question: 'border-l-green-500 bg-green-50/30',
  text: 'border-l-gray-400 bg-gray-50/30',
  image: 'border-l-pink-500 bg-pink-50/30',
  divider: 'border-l-gray-300 bg-gray-50/30',
}

const BLOCK_ICONS: Record<string, string> = {
  header: '📄',
  instructions: '📋',
  section_title: '📌',
  question: '❓',
  text: '📝',
  image: '🖼️',
  divider: '➖',
}

interface DraggableBlockProps {
  block: ContentBlock
  isEditable: boolean
  onContentChange: (id: string, content: string) => void
  onMetadataChange: (id: string, field: string, value: unknown) => void
  onRemove: (id: string) => void
  onDuplicate: (id: string) => void
}

export default function DraggableBlock({
  block,
  isEditable,
  onContentChange,
  onMetadataChange,
  onRemove,
  onDuplicate,
}: DraggableBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

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
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group border-l-4 rounded-lg border border-gray-200 shadow-sm transition-all ${
        BLOCK_COLORS[block.type] || 'border-l-gray-400'
      } ${isDragging ? 'opacity-50 shadow-lg ring-2 ring-primary-300' : ''}`}
    >
      {/* Block header bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-white/70 rounded-t-lg border-b border-gray-100">
        <div className="flex items-center gap-2">
          {/* Drag handle */}
          {isEditable && (
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 touch-none"
              title="Drag to reorder"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="5" cy="3" r="1.5" />
                <circle cx="11" cy="3" r="1.5" />
                <circle cx="5" cy="8" r="1.5" />
                <circle cx="11" cy="8" r="1.5" />
                <circle cx="5" cy="13" r="1.5" />
                <circle cx="11" cy="13" r="1.5" />
              </svg>
            </button>
          )}

          {/* Block type label */}
          <span className="text-xs font-medium text-gray-500">
            {BLOCK_ICONS[block.type]} {BLOCK_LABELS[block.type] || block.type}
          </span>

          {/* Position badge */}
          <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
            #{block.position + 1}
          </span>
        </div>

        {/* Block actions */}
        {isEditable && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onDuplicate(block.id)}
              className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 text-xs"
              title="Duplicate block"
            >
              ⧉
            </button>
            <button
              onClick={() => onRemove(block.id)}
              className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 text-xs"
              title="Remove block"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Block body */}
      <div className="p-3">
        {/* Question metadata row */}
        {block.type === 'question' && (
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-medium text-gray-500">Q#</label>
              <input
                type="number"
                min={1}
                value={block.metadata?.questionNumber ?? ''}
                onChange={(e) =>
                  onMetadataChange(block.id, 'questionNumber', Number(e.target.value))
                }
                disabled={!isEditable}
                className="w-16 rounded border-gray-300 text-sm py-0.5 px-1.5 disabled:bg-gray-100"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-medium text-gray-500">Marks</label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={block.metadata?.marks ?? ''}
                onChange={(e) =>
                  onMetadataChange(block.id, 'marks', Number(e.target.value))
                }
                disabled={!isEditable}
                className="w-20 rounded border-gray-300 text-sm py-0.5 px-1.5 disabled:bg-gray-100"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-medium text-gray-500">Type</label>
              <select
                value={block.metadata?.questionType ?? 'descriptive'}
                onChange={(e) =>
                  onMetadataChange(block.id, 'questionType', e.target.value)
                }
                disabled={!isEditable}
                className="rounded border-gray-300 text-sm py-0.5 px-1.5 disabled:bg-gray-100"
              >
                <option value="mcq">MCQ</option>
                <option value="short_answer">Short Answer</option>
                <option value="long_answer">Long Answer</option>
                <option value="descriptive">Descriptive</option>
                <option value="fill_in_blank">Fill in the Blank</option>
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-medium text-gray-500">Section</label>
              <input
                type="text"
                value={block.metadata?.section ?? ''}
                onChange={(e) =>
                  onMetadataChange(block.id, 'section', e.target.value)
                }
                disabled={!isEditable}
                placeholder="A"
                className="w-16 rounded border-gray-300 text-sm py-0.5 px-1.5 disabled:bg-gray-100"
              />
            </div>
          </div>
        )}

        {/* Divider block – just renders a line */}
        {block.type === 'divider' ? (
          <hr className="border-gray-300 my-2" />
        ) : (
          <RichTextEditor
            content={block.content}
            onChange={(html) => onContentChange(block.id, html)}
            placeholder={placeholderMap[block.type] || 'Start typing…'}
            editable={isEditable}
            compact={block.type === 'section_title'}
          />
        )}
      </div>
    </div>
  )
}
