// src/components/admin/rich-text-editor.tsx
'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { useEffect } from 'react'

type RichTextEditorProps = {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Viết nội dung...',
  disabled = false,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false, // Fix SSR hydration error
    extensions: [
      StarterKit.configure({
        // StarterKit includes link by default
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4',
      },
    },
  })

  // Update editor content when value changes externally
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  if (!editor) {
    return null
  }

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
      {/* Toolbar */}
      {!disabled && (
        <div className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-2 flex items-center gap-1 flex-wrap">
          {/* Text formatting */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
              editor.isActive('bold') ? 'bg-slate-200 dark:bg-slate-700' : ''
            }`}
            title="Bold (Ctrl+B)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
              editor.isActive('italic') ? 'bg-slate-200 dark:bg-slate-700' : ''
            }`}
            title="Italic (Ctrl+I)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
              editor.isActive('strike') ? 'bg-slate-200 dark:bg-slate-700' : ''
            }`}
            title="Strikethrough"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h18M9 5v14m6-14v14" />
            </svg>
          </button>

          <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

          {/* Headings */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
              editor.isActive('heading', { level: 2 }) ? 'bg-slate-200 dark:bg-slate-700' : ''
            }`}
            title="Heading 2"
          >
            <span className="text-sm font-bold">H2</span>
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
              editor.isActive('heading', { level: 3 }) ? 'bg-slate-200 dark:bg-slate-700' : ''
            }`}
            title="Heading 3"
          >
            <span className="text-sm font-bold">H3</span>
          </button>

          <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

          {/* Lists */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
              editor.isActive('bulletList') ? 'bg-slate-200 dark:bg-slate-700' : ''
            }`}
            title="Bullet List"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
              editor.isActive('orderedList') ? 'bg-slate-200 dark:bg-slate-700' : ''
            }`}
            title="Numbered List"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

          {/* Quote & Code */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
              editor.isActive('blockquote') ? 'bg-slate-200 dark:bg-slate-700' : ''
            }`}
            title="Quote"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
              editor.isActive('codeBlock') ? 'bg-slate-200 dark:bg-slate-700' : ''
            }`}
            title="Code Block"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </button>

          <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

          {/* Link */}
          <button
            type="button"
            onClick={() => {
              const previousUrl = editor.getAttributes('link').href
              const url = window.prompt('Enter URL:', previousUrl)
              
              // cancelled
              if (url === null) {
                return
              }

              // empty
              if (url === '') {
                editor.chain().focus().extendMarkRange('link').unsetLink().run()
                return
              }

              // update link
              editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
            }}
            className={`p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
              editor.isActive('link') ? 'bg-slate-200 dark:bg-slate-700' : ''
            }`}
            title="Insert Link"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </button>

          {editor.isActive('link') && (
            <button
              type="button"
              onClick={() => editor.chain().focus().unsetLink().run()}
              className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
              title="Remove Link"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

          {/* Undo/Redo */}
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Undo (Ctrl+Z)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Redo (Ctrl+Y)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
            </svg>
          </button>
        </div>
      )}

      {/* Editor */}
      <div className="bg-white dark:bg-slate-900">
        <EditorContent editor={editor} />
      </div>

      {/* Character count */}
      <div className="bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-4 py-2 text-xs text-slate-500">
        {editor.storage.characterCount?.characters() || 0} characters
      </div>
    </div>
  )
}