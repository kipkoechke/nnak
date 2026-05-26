"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { useEffect, useRef, useState } from "react";
import {
  MdFormatBold,
  MdFormatItalic,
  MdFormatUnderlined,
  MdFormatStrikethrough,
  MdFormatListBulleted,
  MdFormatListNumbered,
  MdFormatQuote,
  MdLink,
  MdLinkOff,
  MdUndo,
  MdRedo,
  MdCode,
  MdHorizontalRule,
  MdImage,
  MdFormatAlignLeft,
  MdFormatAlignCenter,
  MdFormatAlignRight,
  MdFormatAlignJustify,
  MdFormatColorText,
} from "react-icons/md";
import { uploadService } from "@/services/upload.service";
import toast from "react-hot-toast";

interface RichTextEditorProps {
  label?: string;
  required?: boolean;
  disabled?: boolean;
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  error?: string;
  minHeight?: number;
  /** Custom upload function. Receives a File, must resolve to the public URL string. Defaults to the generic upload service. */
  onUploadImage?: (file: File) => Promise<string>;
}

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`p-1.5 rounded-md text-slate-700 hover:bg-primary-subtle hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed ${
        active ? "bg-primary-subtle text-primary" : ""
      }`}
    >
      {children}
    </button>
  );
}

function ColorButton({ editor }: { editor: Editor }) {
  const colorInputRef = useRef<HTMLInputElement>(null);
  const currentColor =
    (editor.getAttributes("textStyle").color as string | undefined) ??
    "#000000";

  return (
    <div className="relative flex items-center">
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => colorInputRef.current?.click()}
        title="Text color"
        aria-label="Text color"
        className="p-1.5 rounded-md text-slate-700 hover:bg-primary-subtle hover:text-primary flex flex-col items-center gap-0.5"
      >
        <MdFormatColorText className="w-4 h-4" />
        <span
          className="w-4 h-1 rounded-sm"
          style={{ backgroundColor: currentColor }}
        />
      </button>
      <input
        ref={colorInputRef}
        type="color"
        value={currentColor}
        className="absolute opacity-0 w-0 h-0 pointer-events-none"
        onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
      />
    </div>
  );
}

function Toolbar({
  editor,
  onUploadImage,
}: {
  editor: Editor;
  onUploadImage?: (file: File) => Promise<string>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  if (!editor) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate before upload
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed.");
      e.target.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10 MB.");
      e.target.value = "";
      return;
    }

    // Insert a local blob preview instantly so the image is visible immediately
    const localUrl = URL.createObjectURL(file);
    editor.chain().focus().setImage({ src: localUrl }).run();

    setUploading(true);
    try {
      const uploadFn =
        onUploadImage ??
        ((f: File) => uploadService.image(f).then((r) => r.url));
      const url = await uploadFn(file);

      // Swap the temporary blob URL with the permanent server URL
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === "image" && node.attrs.src === localUrl) {
          editor.view.dispatch(
            editor.state.tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              src: url,
            }),
          );
        }
      });

      URL.revokeObjectURL(localUrl);
    } catch {
      toast.error("Image upload failed. Please try again.");
      // Remove the preview node that failed to upload
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === "image" && node.attrs.src === localUrl) {
          editor.view.dispatch(
            editor.state.tr.delete(pos, pos + node.nodeSize),
          );
        }
      });
      URL.revokeObjectURL(localUrl);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Enter URL", previousUrl ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-slate-200 bg-slate-50/60">
      <select
        value={
          editor.isActive("heading", { level: 1 })
            ? "h1"
            : editor.isActive("heading", { level: 2 })
              ? "h2"
              : editor.isActive("heading", { level: 3 })
                ? "h3"
                : "p"
        }
        onChange={(e) => {
          const v = e.target.value;
          if (v === "p") {
            editor.chain().focus().setParagraph().run();
          } else {
            const level = Number(v.replace("h", "")) as 1 | 2 | 3;
            editor.chain().focus().toggleHeading({ level }).run();
          }
        }}
        className="text-xs px-2 py-1 rounded-md border border-slate-200 bg-white mr-1 focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <option value="p">Paragraph</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
      </select>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        title="Bold"
      >
        <MdFormatBold className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        title="Italic"
      >
        <MdFormatItalic className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive("underline")}
        title="Underline"
      >
        <MdFormatUnderlined className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive("strike")}
        title="Strikethrough"
      >
        <MdFormatStrikethrough className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        active={editor.isActive("code")}
        title="Inline code"
      >
        <MdCode className="w-4 h-4" />
      </ToolbarButton>

      <ColorButton editor={editor} />

      <span className="mx-1 h-5 w-px bg-slate-200" />

      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        active={editor.isActive({ textAlign: "left" })}
        title="Align left"
      >
        <MdFormatAlignLeft className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        active={editor.isActive({ textAlign: "center" })}
        title="Align center"
      >
        <MdFormatAlignCenter className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        active={editor.isActive({ textAlign: "right" })}
        title="Align right"
      >
        <MdFormatAlignRight className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign("justify").run()}
        active={editor.isActive({ textAlign: "justify" })}
        title="Justify"
      >
        <MdFormatAlignJustify className="w-4 h-4" />
      </ToolbarButton>

      <span className="mx-1 h-5 w-px bg-slate-200" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        title="Bullet list"
      >
        <MdFormatListBulleted className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        title="Numbered list"
      >
        <MdFormatListNumbered className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
        title="Quote"
      >
        <MdFormatQuote className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal rule"
      >
        <MdHorizontalRule className="w-4 h-4" />
      </ToolbarButton>

      <span className="mx-1 h-5 w-px bg-slate-200" />

      <ToolbarButton
        onClick={setLink}
        active={editor.isActive("link")}
        title="Link"
      >
        <MdLink className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().unsetLink().run()}
        disabled={!editor.isActive("link")}
        title="Remove link"
      >
        <MdLinkOff className="w-4 h-4" />
      </ToolbarButton>

      <span className="mx-1 h-5 w-px bg-slate-200" />

      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo"
      >
        <MdUndo className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo"
      >
        <MdRedo className="w-4 h-4" />
      </ToolbarButton>

      <span className="mx-1 h-5 w-px bg-slate-200" />

      <ToolbarButton
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        title={uploading ? "Uploading…" : "Insert image"}
      >
        <MdImage className="w-4 h-4" />
      </ToolbarButton>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
        onClick={(e) => {
          e.stopPropagation();
        }}
      />
    </div>
  );
}

export function RichTextEditor({
  label,
  required,
  disabled,
  value,
  onChange,
  placeholder,
  error,
  minHeight = 180,
  onUploadImage,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: false }),
      TextStyle,
      Color,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image.configure({
        inline: false,
        HTMLAttributes: {},
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class: "text-primary underline hover:opacity-80",
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || "Start writing...",
      }),
    ],
    content: value || "",
    editable: !disabled,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "rich-text tiptap focus:outline-none px-3 py-2 text-sm",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html === "<p></p>" ? "" : html);
    },
  });

  // Sync external value changes (e.g. when initial data loads)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const next = value || "";
    if (next && next !== current) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [value, editor]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  return (
    <div>
      {label && (
        <label className="text-gray-700 mb-2 flex text-xs sm:text-sm font-semibold">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}
      <div
        className={`rounded-md border bg-white overflow-hidden focus-within:ring-2 focus-within:ring-primary ${
          error ? "border-red-400" : "border-slate-300"
        } ${disabled ? "opacity-60" : ""}`}
      >
        {editor && <Toolbar editor={editor} onUploadImage={onUploadImage} />}
        <div style={{ minHeight, maxHeight: 320, overflowY: "auto" }}>
          <EditorContent editor={editor} />
        </div>
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

export default RichTextEditor;
