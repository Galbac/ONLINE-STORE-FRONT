import { cn } from "@/shared/config";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
}

export const Button = ({
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) => {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold tracking-wide transition-all duration-200 ease-out active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2",
        variant === "primary" &&
          "bg-emerald-600 text-white shadow-sm shadow-emerald-900/10 hover:bg-emerald-700 hover:shadow-md hover:shadow-emerald-700/20",
        variant === "secondary" &&
          "border border-slate-200 bg-white text-slate-800 shadow-sm hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-700",
        variant === "ghost" &&
          "text-slate-700 hover:bg-emerald-50/70 hover:text-emerald-700",
        className,
      )}
      type={type}
      {...props}
    />
  );
};
