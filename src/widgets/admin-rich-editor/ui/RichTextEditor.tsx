"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FC,
} from "react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Eraser,
  Eye,
  FileText,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
  Unlink,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
}

type ViewMode = "visual" | "code" | "preview";

export const RichTextEditor: FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Введите текст документа...",
  minHeight = "420px",
  className = "",
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("visual");
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    insertUnorderedList: false,
    insertOrderedList: false,
    justifyLeft: false,
    justifyCenter: false,
    justifyRight: false,
    justifyFull: false,
  });
  const [blockFormat, setBlockFormat] = useState<string>("p");

  // Keep editor content in sync when value changes externally (e.g. document switch)
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      // Only replace innerHTML if difference is more than whitespace
      const currentTrimmed = editorRef.current.innerHTML.trim();
      const nextTrimmed = value.trim();
      if (currentTrimmed !== nextTrimmed) {
        editorRef.current.innerHTML = value;
      }
    }
  }, [value]);

  const updateActiveStates = useCallback(() => {
    if (typeof document === "undefined") return;
    try {
      setActiveFormats({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        strikeThrough: document.queryCommandState("strikeThrough"),
        insertUnorderedList: document.queryCommandState("insertUnorderedList"),
        insertOrderedList: document.queryCommandState("insertOrderedList"),
        justifyLeft: document.queryCommandState("justifyLeft"),
        justifyCenter: document.queryCommandState("justifyCenter"),
        justifyRight: document.queryCommandState("justifyRight"),
        justifyFull: document.queryCommandState("justifyFull"),
      });

      const block = document.queryCommandValue("formatBlock").toLowerCase();
      if (block) {
        setBlockFormat(block.replace(/[<>]/g, ""));
      }
    } catch {
      // Ignore queryCommandState errors in unsupported contexts
    }
  }, []);

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      onChange(html);
      updateActiveStates();
    }
  };

  const exec = (command: string, val: string | undefined = undefined) => {
    if (typeof document === "undefined") return;
    if (viewMode !== "visual") return;

    if (editorRef.current) {
      editorRef.current.focus();
    }

    document.execCommand(command, false, val);
    handleInput();
    updateActiveStates();
  };

  const handleBlockChange = (tag: string) => {
    if (tag === "p") {
      exec("formatBlock", "<p>");
    } else if (tag === "h2") {
      exec("formatBlock", "<h2>");
    } else if (tag === "h3") {
      exec("formatBlock", "<h3>");
    } else if (tag === "h4") {
      exec("formatBlock", "<h4>");
    } else if (tag === "blockquote") {
      exec("formatBlock", "<blockquote>");
    }
    setBlockFormat(tag);
  };

  const handleAddLink = () => {
    const url = window.prompt("Введите URL-ссылку:", "https://");
    if (url && url.trim()) {
      exec("createLink", url.trim());
    }
  };

  const wordCount = (val: string) => {
    const text = val.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    return text ? text.split(" ").length : 0;
  };

  const charCount = (val: string) => {
    return val.replace(/<[^>]*>/g, "").length;
  };

  return (
    <div
      className={`border-border bg-bg-primary shadow-soft flex flex-col rounded-xl border overflow-hidden transition-all ${className}`}
    >
      {/* Top Ribbon / Word-style Toolbar */}
      <div className="border-border bg-bg-secondary/70 border-b p-2 flex flex-wrap items-center gap-1 text-text-primary select-none">
        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 pr-1.5 border-r border-border">
          <ToolbarButton
            title="Отменить (Ctrl+Z)"
            onClick={() => exec("undo")}
            disabled={viewMode !== "visual"}
          >
            <Undo2 size={16} />
          </ToolbarButton>
          <ToolbarButton
            title="Повторить (Ctrl+Y)"
            onClick={() => exec("redo")}
            disabled={viewMode !== "visual"}
          >
            <Redo2 size={16} />
          </ToolbarButton>
        </div>

        {/* Heading / Block Style Dropdown */}
        <div className="px-1.5 border-r border-border">
          <select
            value={blockFormat}
            onChange={(e) => handleBlockChange(e.target.value)}
            disabled={viewMode !== "visual"}
            className="h-8 rounded-lg border border-border bg-bg-primary px-2.5 text-xs font-semibold text-text-primary outline-none hover:border-accent-primary focus:border-accent-primary transition"
          >
            <option value="p">Обычный текст (P)</option>
            <option value="h2">Заголовок 1 (H2)</option>
            <option value="h3">Заголовок 2 (H3)</option>
            <option value="h4">Заголовок 3 (H4)</option>
            <option value="blockquote">Цитата / Выделение</option>
          </select>
        </div>

        {/* Character Formatting: Bold, Italic, Underline, Strike */}
        <div className="flex items-center gap-0.5 px-1.5 border-r border-border">
          <ToolbarButton
            title="Жирный (Ctrl+B)"
            isActive={activeFormats.bold}
            onClick={() => exec("bold")}
            disabled={viewMode !== "visual"}
          >
            <Bold size={16} />
          </ToolbarButton>
          <ToolbarButton
            title="Курсив (Ctrl+I)"
            isActive={activeFormats.italic}
            onClick={() => exec("italic")}
            disabled={viewMode !== "visual"}
          >
            <Italic size={16} />
          </ToolbarButton>
          <ToolbarButton
            title="Подчёркнутый (Ctrl+U)"
            isActive={activeFormats.underline}
            onClick={() => exec("underline")}
            disabled={viewMode !== "visual"}
          >
            <Underline size={16} />
          </ToolbarButton>
          <ToolbarButton
            title="Зачёркнутый"
            isActive={activeFormats.strikeThrough}
            onClick={() => exec("strikeThrough")}
            disabled={viewMode !== "visual"}
          >
            <Strikethrough size={16} />
          </ToolbarButton>
          <ToolbarButton
            title="Очистить форматирование"
            onClick={() => exec("removeFormat")}
            disabled={viewMode !== "visual"}
          >
            <Eraser size={16} />
          </ToolbarButton>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-0.5 px-1.5 border-r border-border">
          <ToolbarButton
            title="Маркированный список"
            isActive={activeFormats.insertUnorderedList}
            onClick={() => exec("insertUnorderedList")}
            disabled={viewMode !== "visual"}
          >
            <List size={16} />
          </ToolbarButton>
          <ToolbarButton
            title="Нумерованный список"
            isActive={activeFormats.insertOrderedList}
            onClick={() => exec("insertOrderedList")}
            disabled={viewMode !== "visual"}
          >
            <ListOrdered size={16} />
          </ToolbarButton>
        </div>

        {/* Alignment */}
        <div className="flex items-center gap-0.5 px-1.5 border-r border-border">
          <ToolbarButton
            title="По левому краю"
            isActive={activeFormats.justifyLeft}
            onClick={() => exec("justifyLeft")}
            disabled={viewMode !== "visual"}
          >
            <AlignLeft size={16} />
          </ToolbarButton>
          <ToolbarButton
            title="По центру"
            isActive={activeFormats.justifyCenter}
            onClick={() => exec("justifyCenter")}
            disabled={viewMode !== "visual"}
          >
            <AlignCenter size={16} />
          </ToolbarButton>
          <ToolbarButton
            title="По правому краю"
            isActive={activeFormats.justifyRight}
            onClick={() => exec("justifyRight")}
            disabled={viewMode !== "visual"}
          >
            <AlignRight size={16} />
          </ToolbarButton>
          <ToolbarButton
            title="По ширине"
            isActive={activeFormats.justifyFull}
            onClick={() => exec("justifyFull")}
            disabled={viewMode !== "visual"}
          >
            <AlignJustify size={16} />
          </ToolbarButton>
        </div>

        {/* Links & Divider */}
        <div className="flex items-center gap-0.5 px-1.5 border-r border-border">
          <ToolbarButton
            title="Вставить ссылку"
            onClick={handleAddLink}
            disabled={viewMode !== "visual"}
          >
            <Link2 size={16} />
          </ToolbarButton>
          <ToolbarButton
            title="Удалить ссылку"
            onClick={() => exec("unlink")}
            disabled={viewMode !== "visual"}
          >
            <Unlink size={16} />
          </ToolbarButton>
          <ToolbarButton
            title="Горизонтальная линия (разделитель)"
            onClick={() => exec("insertHorizontalRule")}
            disabled={viewMode !== "visual"}
          >
            <Minus size={16} />
          </ToolbarButton>
        </div>

        {/* View mode switcher */}
        <div className="ml-auto flex items-center gap-1 bg-bg-primary border border-border p-0.5 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => setViewMode("visual")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition ${
              viewMode === "visual"
                ? "bg-accent-primary text-accent-contrast shadow-xs"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <FileText size={13} />
            Редактор
          </button>
          <button
            type="button"
            onClick={() => setViewMode("code")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition ${
              viewMode === "code"
                ? "bg-accent-primary text-accent-contrast shadow-xs"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <Code size={13} />
            HTML
          </button>
          <button
            type="button"
            onClick={() => setViewMode("preview")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition ${
              viewMode === "preview"
                ? "bg-accent-primary text-accent-contrast shadow-xs"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <Eye size={13} />
            Предпросмотр
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="relative flex-1 bg-bg-primary" style={{ minHeight }}>
        {/* 1. Visual WYSIWYG Mode */}
        <div
          ref={editorRef}
          contentEditable={viewMode === "visual"}
          onInput={handleInput}
          onKeyUp={updateActiveStates}
          onMouseUp={updateActiveStates}
          style={{ minHeight }}
          className={`rich-text-content w-full p-6 text-text-primary outline-none leading-relaxed transition ${
            viewMode === "visual" ? "block" : "hidden"
          }`}
          data-placeholder={placeholder}
        />

        {/* 2. Raw HTML Source Code Mode */}
        {viewMode === "code" && (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{ minHeight }}
            className="w-full p-6 font-mono text-xs leading-6 bg-slate-900 text-emerald-400 outline-none resize-y border-none selection:bg-emerald-700/50"
            placeholder="HTML-код документа..."
          />
        )}

        {/* 3. Real Store Preview Mode */}
        {viewMode === "preview" && (
          <div
            style={{ minHeight }}
            className="w-full p-6 md:p-8 bg-bg-secondary/40 overflow-y-auto"
          >
            <div className="max-w-3xl mx-auto rounded-xl border border-border bg-bg-primary p-6 md:p-8 shadow-sm">
              <div className="border-b border-border pb-4 mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-accent-primary">
                  Предпросмотр документа на сайте
                </span>
              </div>
              <div
                className="rich-text-content text-text-primary leading-relaxed"
                dangerouslySetInnerHTML={{ __html: value || "<p class=\"text-text-secondary italic\">Документ пуст</p>" }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Status / Word Count Bar */}
      <div className="border-border bg-bg-secondary/50 border-t px-4 py-2 flex items-center justify-between text-xs text-text-secondary">
        <div className="flex items-center gap-4">
          <span>
            Слов: <strong className="text-text-primary font-semibold">{wordCount(value)}</strong>
          </span>
          <span>
            Символов: <strong className="text-text-primary font-semibold">{charCount(value)}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Готов к сохранению</span>
        </div>
      </div>
    </div>
  );
};

interface ToolbarButtonProps {
  title: string;
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}

const ToolbarButton: FC<ToolbarButtonProps> = ({
  title,
  onClick,
  isActive = false,
  disabled = false,
  children,
}) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    disabled={disabled}
    className={`p-1.5 rounded-md transition-all flex items-center justify-center ${
      isActive
        ? "bg-accent-primary/20 text-accent-primary font-bold shadow-xs scale-105"
        : "text-text-secondary hover:text-text-primary hover:bg-bg-secondary active:scale-95"
    } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
  >
    {children}
  </button>
);
