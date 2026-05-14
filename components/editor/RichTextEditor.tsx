"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import Image from "@tiptap/extension-image"
import Youtube from "@tiptap/extension-youtube"
import { Table } from "@tiptap/extension-table"
import TableRow from "@tiptap/extension-table-row"
import TableCell from "@tiptap/extension-table-cell"
import TableHeader from "@tiptap/extension-table-header"
import Placeholder from "@tiptap/extension-placeholder"
import { TextStyle } from "@tiptap/extension-text-style"
import Color from "@tiptap/extension-color"
import { useEffect, useCallback, useState } from "react"
import { cn } from "@/lib/utils"

// ——— Toolbar button ———
function ToolBtn({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      title={title}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded text-xs font-medium transition-colors",
        active
          ? "bg-zinc-900 text-white"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
      )}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="mx-1 h-5 w-px bg-zinc-200 shrink-0" />
}

interface RichTextEditorProps {
  value?: Record<string, unknown> | null
  onChange: (value: Record<string, unknown>) => void
  placeholder?: string
  minHeight?: number
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Start writing…",
  minHeight = 400,
}: RichTextEditorProps) {
  const [linkUrl, setLinkUrl] = useState("")
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [showImageInput, setShowImageInput] = useState(false)
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [showYoutubeInput, setShowYoutubeInput] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        link: false,
        underline: false,
      }),
      Underline,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-primary underline" } }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image.configure({ inline: false, allowBase64: false }),
      Youtube.configure({ width: 840, height: 472, nocookie: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      TextStyle,
      Color,
      Placeholder.configure({ placeholder }),
    ],
    content: value ?? undefined,
    editorProps: {
      attributes: {
        class: "cms-editor focus:outline-none",
        style: `min-height: ${minHeight}px; padding: 1rem;`,
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getJSON() as Record<string, unknown>)
    },
  })

  // Sync external value changes (e.g. on page load)
  useEffect(() => {
    if (!editor || !value) return
    const current = editor.getJSON()
    if (JSON.stringify(current) !== JSON.stringify(value)) {
      editor.commands.setContent(value as Parameters<typeof editor.commands.setContent>[0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor])

  const insertLink = useCallback(() => {
    if (!editor || !linkUrl) return
    if (linkUrl === "") {
      editor.chain().focus().unsetLink().run()
    } else {
      editor.chain().focus().setLink({ href: linkUrl }).run()
    }
    setLinkUrl("")
    setShowLinkInput(false)
  }, [editor, linkUrl])

  const insertImage = useCallback(() => {
    if (!editor || !imageUrl) return
    editor.chain().focus().setImage({ src: imageUrl }).run()
    setImageUrl("")
    setShowImageInput(false)
  }, [editor, imageUrl])

  const insertYoutube = useCallback(() => {
    if (!editor || !youtubeUrl) return
    editor.commands.setYoutubeVideo({ src: youtubeUrl })
    setYoutubeUrl("")
    setShowYoutubeInput(false)
  }, [editor, youtubeUrl])

  const insertTable = useCallback(() => {
    if (!editor) return
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }, [editor])

  if (!editor) return null

  return (
    <div className="rounded-lg border border-zinc-200 overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-zinc-200 bg-zinc-50 p-1.5">
        {/* Headings */}
        <ToolBtn title="Heading 1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })}>H1</ToolBtn>
        <ToolBtn title="Heading 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })}>H2</ToolBtn>
        <ToolBtn title="Heading 3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })}>H3</ToolBtn>
        <ToolBtn title="Heading 4" onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} active={editor.isActive("heading", { level: 4 })}>H4</ToolBtn>

        <Divider />

        {/* Inline formatting */}
        <ToolBtn title="Bold" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")}><strong>B</strong></ToolBtn>
        <ToolBtn title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")}><em>I</em></ToolBtn>
        <ToolBtn title="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")}><span className="underline">U</span></ToolBtn>
        <ToolBtn title="Strikethrough" onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")}><s>S</s></ToolBtn>
        <ToolBtn title="Inline code" onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")}><code className="text-[10px]">{"`"}</code></ToolBtn>

        <Divider />

        {/* Block formatting */}
        <ToolBtn title="Blockquote" onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")}>&#8220;</ToolBtn>
        <ToolBtn title="Code block" onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")}><span className="text-[9px] font-mono">{"{}"}</span></ToolBtn>
        <ToolBtn title="Horizontal rule" onClick={() => editor.chain().focus().setHorizontalRule().run()}>&#8212;</ToolBtn>

        <Divider />

        {/* Lists */}
        <ToolBtn title="Bullet list" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")}>&#8226;&#8212;</ToolBtn>
        <ToolBtn title="Ordered list" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")}>1.</ToolBtn>

        <Divider />

        {/* Alignment */}
        <ToolBtn title="Align left" onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })}><AlignLeftIcon /></ToolBtn>
        <ToolBtn title="Align center" onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })}><AlignCenterIcon /></ToolBtn>
        <ToolBtn title="Align right" onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })}><AlignRightIcon /></ToolBtn>
        <ToolBtn title="Justify" onClick={() => editor.chain().focus().setTextAlign("justify").run()} active={editor.isActive({ textAlign: "justify" })}><AlignJustifyIcon /></ToolBtn>

        <Divider />

        {/* Link */}
        <div className="relative">
          <ToolBtn
            title="Insert link"
            onClick={() => { setShowImageInput(false); setShowYoutubeInput(false); setShowLinkInput((v) => !v) }}
            active={editor.isActive("link") || showLinkInput}
          >
            <LinkIcon />
          </ToolBtn>
          {showLinkInput && (
            <div className="absolute top-8 left-0 z-10 flex gap-1 rounded-lg border border-zinc-200 bg-white p-1.5 shadow-lg">
              <input
                autoFocus
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && insertLink()}
                placeholder="https://…"
                className="w-48 rounded border border-zinc-200 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
              <button type="button" onClick={insertLink} className="rounded bg-primary px-2 py-1 text-xs text-white hover:bg-primary/90">Add</button>
              <button type="button" onClick={() => { editor.chain().focus().unsetLink().run(); setShowLinkInput(false) }} className="rounded px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100">Remove</button>
            </div>
          )}
        </div>

        {/* Image */}
        <div className="relative">
          <ToolBtn
            title="Insert image"
            onClick={() => { setShowLinkInput(false); setShowYoutubeInput(false); setShowImageInput((v) => !v) }}
            active={showImageInput}
          >
            <ImageIcon />
          </ToolBtn>
          {showImageInput && (
            <div className="absolute top-8 left-0 z-10 flex gap-1 rounded-lg border border-zinc-200 bg-white p-1.5 shadow-lg">
              <input
                autoFocus
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && insertImage()}
                placeholder="https://… image URL"
                className="w-52 rounded border border-zinc-200 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
              <button type="button" onClick={insertImage} className="rounded bg-primary px-2 py-1 text-xs text-white hover:bg-primary/90">Insert</button>
            </div>
          )}
        </div>

        {/* YouTube */}
        <div className="relative">
          <ToolBtn
            title="Embed YouTube video"
            onClick={() => { setShowLinkInput(false); setShowImageInput(false); setShowYoutubeInput((v) => !v) }}
            active={showYoutubeInput}
          >
            <YoutubeIcon />
          </ToolBtn>
          {showYoutubeInput && (
            <div className="absolute top-8 left-0 z-10 flex gap-1 rounded-lg border border-zinc-200 bg-white p-1.5 shadow-lg">
              <input
                autoFocus
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && insertYoutube()}
                placeholder="YouTube URL or ID"
                className="w-52 rounded border border-zinc-200 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
              <button type="button" onClick={insertYoutube} className="rounded bg-primary px-2 py-1 text-xs text-white hover:bg-primary/90">Embed</button>
            </div>
          )}
        </div>

        {/* Table */}
        <ToolBtn title="Insert table" onClick={insertTable}><TableIcon /></ToolBtn>
        {editor.isActive("table") && (
          <>
            <ToolBtn title="Add column after" onClick={() => editor.chain().focus().addColumnAfter().run()}><span className="text-[9px]">+col</span></ToolBtn>
            <ToolBtn title="Add row after" onClick={() => editor.chain().focus().addRowAfter().run()}><span className="text-[9px]">+row</span></ToolBtn>
            <ToolBtn title="Delete table" onClick={() => editor.chain().focus().deleteTable().run()}><span className="text-[9px] text-red-500">✕tbl</span></ToolBtn>
          </>
        )}

        <Divider />

        {/* Undo / Redo */}
        <ToolBtn title="Undo" onClick={() => editor.chain().focus().undo().run()}>&#8630;</ToolBtn>
        <ToolBtn title="Redo" onClick={() => editor.chain().focus().redo().run()}>&#8631;</ToolBtn>
      </div>

      {/* Editor area */}
      <EditorContent editor={editor} className="bg-white" />
    </div>
  )
}

// ——— Inline SVG icons ———
function AlignLeftIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="currentColor">
      <path d="M2 3.5h12v1H2zm0 3h8v1H2zm0 3h12v1H2zm0 3h8v1H2z" />
    </svg>
  )
}
function AlignCenterIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="currentColor">
      <path d="M2 3.5h12v1H2zm2 3h8v1H4zm-2 3h12v1H2zm2 3h8v1H4z" />
    </svg>
  )
}
function AlignRightIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="currentColor">
      <path d="M2 3.5h12v1H2zm4 3h8v1H6zm-4 3h12v1H2zm4 3h8v1H6z" />
    </svg>
  )
}
function AlignJustifyIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="currentColor">
      <path d="M2 3.5h12v1H2zm0 3h12v1H2zm0 3h12v1H2zm0 3h8v1H2z" />
    </svg>
  )
}
function LinkIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 10l4-4M9.5 4.5l1-1a2.5 2.5 0 013.5 3.5l-2 2a2.5 2.5 0 01-3.5 0M6.5 11.5l-1 1a2.5 2.5 0 01-3.5-3.5l2-2a2.5 2.5 0 013.5 0" />
    </svg>
  )
}
function ImageIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="3" width="12" height="10" rx="1" />
      <circle cx="5.5" cy="6.5" r="1" />
      <path d="M2 11l3.5-3.5 2.5 2.5 2-2L14 11" />
    </svg>
  )
}
function YoutubeIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="currentColor">
      <path d="M15 4.5s-.2-1.3-.7-1.8c-.7-.7-1.5-.7-1.8-.8C10.8 2 8 2 8 2s-2.8 0-4.5.2c-.4 0-1.1 0-1.8.8-.6.5-.7 1.8-.7 1.8S1 6 1 7.5v1.4c0 1.5.2 3 .2 3s.2 1.3.7 1.8c.7.7 1.6.7 2 .8C5.2 14.7 8 14.7 8 14.7s2.8 0 4.5-.2c.4 0 1.1 0 1.8-.8.6-.5.7-1.8.7-1.8s.2-1.5.2-3V7.5c0-1.5-.2-3-.2-3zM6.5 10.5v-5l4.5 2.5-4.5 2.5z" />
    </svg>
  )
}
function TableIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="3" width="12" height="10" rx="1" />
      <path d="M2 7h12M6 3v10M10 3v10" />
    </svg>
  )
}
