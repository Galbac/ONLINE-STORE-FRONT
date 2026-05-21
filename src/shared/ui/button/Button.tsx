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
        "inline-flex h-12 items-center justify-center rounded-lg px-5 text-sm font-bold transition",
        variant === "primary" && "bg-accent-primary text-accent-contrast hover:bg-accent-hover",
        variant === "secondary" &&
          "border-border bg-bg-primary text-text-primary hover:bg-bg-hover border",
        variant === "ghost" && "text-text-primary hover:text-accent-primary",
        className,
      )}
      type={type}
      {...props}
    />
  );
};
