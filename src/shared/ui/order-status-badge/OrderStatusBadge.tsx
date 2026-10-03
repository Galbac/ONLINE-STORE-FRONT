import { cn } from "@/shared/config";
import { formatOrderStatus } from "@/shared/lib/format";

export type OrderStatusType =
  | "created"
  | "new"
  | "pending_payment"
  | "paid"
  | "confirmed"
  | "awaiting_confirmation"
  | "assembling"
  | "assembled"
  | "ready_for_pickup"
  | "delivering"
  | "in_delivery"
  | "in_transit"
  | "on_the_way"
  | "delivered"
  | "completed"
  | "cancelled"
  | "canceled"
  | "rejected"
  | string;

interface OrderStatusBadgeProps {
  status: OrderStatusType | null | undefined;
  className?: string;
  size?: "sm" | "md";
  showDot?: boolean;
}

const STATUS_STYLES: Record<
  string,
  { bg: string; text: string; border: string; dot: string; pulse?: boolean }
> = {
  created: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200/90",
    dot: "bg-amber-500",
  },
  new: {
    bg: "bg-sky-50",
    text: "text-sky-800",
    border: "border-sky-200/90",
    dot: "bg-sky-500",
  },
  pending_payment: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-300/80",
    dot: "bg-amber-500",
    pulse: true,
  },
  awaiting_confirmation: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200/90",
    dot: "bg-amber-500",
  },
  paid: {
    bg: "bg-teal-50",
    text: "text-teal-800",
    border: "border-teal-200/90",
    dot: "bg-teal-500",
  },
  confirmed: {
    bg: "bg-blue-50",
    text: "text-blue-800",
    border: "border-blue-200/90",
    dot: "bg-blue-500",
  },
  assembling: {
    bg: "bg-indigo-50",
    text: "text-indigo-800",
    border: "border-indigo-200/90",
    dot: "bg-indigo-500",
    pulse: true,
  },
  assembled: {
    bg: "bg-violet-50",
    text: "text-violet-800",
    border: "border-violet-200/90",
    dot: "bg-violet-500",
  },
  ready_for_pickup: {
    bg: "bg-purple-50",
    text: "text-purple-800",
    border: "border-purple-200/90",
    dot: "bg-purple-500",
  },
  delivering: {
    bg: "bg-cyan-50",
    text: "text-cyan-800",
    border: "border-cyan-200/90",
    dot: "bg-cyan-500",
    pulse: true,
  },
  in_delivery: {
    bg: "bg-cyan-50",
    text: "text-cyan-800",
    border: "border-cyan-200/90",
    dot: "bg-cyan-500",
    pulse: true,
  },
  in_transit: {
    bg: "bg-cyan-50",
    text: "text-cyan-800",
    border: "border-cyan-200/90",
    dot: "bg-cyan-500",
    pulse: true,
  },
  on_the_way: {
    bg: "bg-cyan-50",
    text: "text-cyan-800",
    border: "border-cyan-200/90",
    dot: "bg-cyan-500",
    pulse: true,
  },
  delivered: {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200/90",
    dot: "bg-emerald-600",
  },
  completed: {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200/90",
    dot: "bg-emerald-600",
  },
  cancelled: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200/90",
    dot: "bg-rose-500",
  },
  canceled: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200/90",
    dot: "bg-rose-500",
  },
  rejected: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200/90",
    dot: "bg-rose-500",
  },
};

export const OrderStatusBadge = ({
  status,
  className,
  size = "sm",
  showDot = true,
}: OrderStatusBadgeProps) => {
  if (!status) {
    return <span className="text-slate-400 text-xs">—</span>;
  }

  const normalized = status.trim().toLowerCase();
  const style = STATUS_STYLES[normalized] || {
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-slate-400",
  };

  const label = formatOrderStatus(status);

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
