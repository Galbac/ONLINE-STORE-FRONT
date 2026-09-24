"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/shared/config";

interface ProductArticleCopyProps {
  article: string;
  className?: string;
}

export const ProductArticleCopy = ({ article, className }: ProductArticleCopyProps) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string): Promise<boolean> => {
    if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
      try {
        const writePromise = navigator.clipboard.writeText(text);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 200)
        );
        await Promise.race([writePromise, timeoutPromise]);
        return true;
      } catch (_) {
        // Fallback
      }
    }

    if (typeof document !== "undefined") {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "-9999px";
        textArea.setAttribute("readonly", "");
        document.body.appendChild(textArea);
        textArea.select();
        const success = document.execCommand("copy");
        document.body.removeChild(textArea);
        if (success) return true;
      } catch (_) {}
    }

    return false;
  };

  const handleCopy = async () => {
    console.log("[ProductArticleCopy] handleCopy clicked!");
    setCopied(true);
    void copyToClipboard(article);
    toast.success("Артикул «" + article + "» скопирован в буфер обмена");
    setTimeout(() => { console.log("[ProductArticleCopy] reset timer fired!"); setCopied(false); }, 15000);
  };

  return (
    <div className="relative inline-flex items-center gap-2.5">
      <button
        type="button"
        onClick={handleCopy}
        className={cn(
          "group inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold tracking-wide transition-all select-none shadow-2xs cursor-pointer",
          copied
            ? "bg-emerald-50 text-emerald-800 border border-emerald-300 ring-2 ring-emerald-500/20"
            : "bg-slate-100/90 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 active:scale-95 border border-slate-200/90",
          className,
        )}
        title="Нажмите, чтобы скопировать артикул"
        aria-label={"Скопировать артикул " + article}
      >
        <span>Арт. {article}</span>
        {copied ? (
          <Check size={14} className="text-emerald-600 animate-in zoom-in-75 duration-150 stroke-[2.5]" />
        ) : (
          <Copy size={14} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
        )}
      </button>

      {/* Плашка о том что скопировано */}
      {copied ? (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white shadow-xs animate-in fade-in-0 zoom-in-95 duration-200">
          <Check size={12} className="stroke-[3]" />
          Скопировано!
        </span>
      ) : null}
    </div>
  );
};
