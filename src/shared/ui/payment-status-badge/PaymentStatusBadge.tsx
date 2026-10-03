import { cn } from "@/shared/config";
import { formatPaymentStatus } from "@/shared/lib/format";

export const PAYMENT_STATUS_STYLES: Record<
  string,
  { bg: string; text: string; border: string; dot: string; pulse?: boolean }
> = {
  unpaid: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200/90",
    dot: "bg-amber-500",
  },
  pending: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200/90",
    dot: "bg-amber-500",
    pulse: true,
  },
  pending_payment: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200/90",
    dot: "bg-amber-500",
    pulse: true,
  },
  paid: {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200/90",
    dot: "bg-emerald-600",
  },
  succeeded: {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200/90",
    dot: "bg-emerald-600",
  },
  success: {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200/90",
    dot: "bg-emerald-600",
  },
  refunded: {
    bg: "bg-blue-50",
    text: "text-blue-800",
    border: "border-blue-200/90",
    dot: "bg-blue-500",
  },
  partial_refunded: {
    bg: "bg-blue-50",
    text: "text-blue-800",
    border: "border-blue-200/90",
    dot: "bg-blue-500",
  },
  refund_pending: {
    bg: "bg-blue-50",
    text: "text-blue-800",
    border: "border-blue-200/90",
    dot: "bg-blue-500",
    pulse: true,
  },
  cancelled: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200/90",
    dot: "bg-slate-400",
  },
  canceled: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200/90",
    dot: "bg-slate-400",
  },
  failed: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200/90",
    dot: "bg-rose-500",
  },
};

export const PaymentStatusBadge = ({
  status,
  className,
  size = "sm",
  showDot = true,
}: {
  status: string | null | undefined;
  className?: string;
  size?: "sm" | "md";
  showDot?: boolean;
}) => {
  if (!status) {
    return <span className="text-slate-400 text-xs">—</span>;
  }

  const normalized = status.trim().toLowerCase();
  const style = PAYMENT_STATUS_STYLES[normalized] || {
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-slate-400",
  };

  const label = formatPaymentStatus(status);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-bold rounded-lg border shadow-2xs transition-all whitespace-nowrap",
        style.bg,
        style.text,
        style.border,
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        className,
      )}
    >
      {showDot && (
        <span className="relative flex size-1.5 shrink-0">
          {style.pulse && (
            <span
              className={cn(
                "absolute inline-flex size-full animate-ping rounded-full opacity-75",
                style.dot,
              )}
            />
          )}
          <span className={cn("relative inline-flex size-1.5 rounded-full", style.dot)} />
        </span>
      )}
      <span>{label}</span>
    </span>
  );
};
