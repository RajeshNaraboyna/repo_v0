import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import { useEffect } from 'react'
import { Box, IconButton, Tooltip, Divider } from '@mui/material'

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
  editable?: boolean
  compact?: boolean
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <Tooltip title={title} arrow>
      <span>
        <IconButton
          size="small"
          onClick={onClick}
          disabled={disabled}
          sx={{
            borderRadius: 1,
            fontSize: 12,
            fontWeight: 600,
            px: 0.8,
            py: 0.5,
            bgcolor: active ? 'primary.50' : 'transparent',
            color: active ? 'primary.main' : 'text.secondary',
            '&:hover': { bgcolor: active ? 'primary.100' : 'grey.100' },
          }}
        >
          {children}
        </IconButton>
      </span>
    </Tooltip>
  )
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = 'Start typing…',
  editable = true,
  compact = false,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4] } }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image.configure({ inline: false, allowBase64: true }),
      Placeholder.configure({ placeholder }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content,
    editable,
    onUpdate: ({ editor: ed }) => onChange(ed.getHTML()),
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false })
    }
  }, [content]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (editor) editor.setEditable(editable)
  }, [editable, editor])

  if (!editor) return null

  return (
    <Box sx={{ border: 1, borderColor: 'grey.300', borderRadius: 2, overflow: 'hidden', bgcolor: '#fff', '&:focus-within': { borderColor: 'primary.main', boxShadow: '0 0 0 2px rgba(37,99,235,0.15)' } }}>
      {/* Toolbar */}
      {editable && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.3, borderBottom: 1, borderColor: 'grey.200', bgcolor: 'grey.50', px: compact ? 1 : 1.5, py: compact ? 0.5 : 0.75 }}>
          <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold (Ctrl+B)"><strong>B</strong></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic (Ctrl+I)"><em>I</em></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline (Ctrl+U)"><span style={{ textDecoration: 'underline' }}>U</span></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough"><span style={{ textDecoration: 'line-through' }}>S</span></ToolbarButton>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">H2</ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">H3</ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} active={editor.isActive('heading', { level: 4 })} title="Heading 4">H4</ToolbarButton>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">• List</ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered List">1. List</ToolbarButton>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align Left">⇤</ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align Center">↔</ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align Right">⇥</ToolbarButton>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Block Quote">""</ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code Block">{'</>'}</ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule">―</ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Insert Table">▦ Table</ToolbarButton>
          <ToolbarButton onClick={() => { const url = window.prompt('Image URL:'); if (url) editor.chain().focus().setImage({ src: url }).run() }} title="Insert Image">📷 Img</ToolbarButton>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">↩</ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">↪</ToolbarButton>
        </Box>
      )}

      {/* Editor content */}
      <Box sx={{ minHeight: compact ? 60 : 120, p: compact ? 1 : 1.5, '& .ProseMirror': { outline: 'none', minHeight: 'inherit' }, '& .ProseMirror p.is-editor-empty:first-child::before': { color: '#9ca3af', content: 'attr(data-placeholder)', float: 'left', height: 0, pointerEvents: 'none' } }}>
        <EditorContent editor={editor} />
      </Box>
    </Box>
  )
}
