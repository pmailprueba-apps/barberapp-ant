import { ReactNode, ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center rounded-lg font-bold transition-opacity disabled:opacity-50";

  const variants = {
    primary: "bg-[var(--gold)] text-[var(--dark)] hover:opacity-90",
    secondary: "bg-[var(--card)] border border-[rgba(201,168,76,0.18)] text-[var(--white)] hover:border-[var(--gold)]",
    danger: "bg-[var(--red)] text-[var(--white)] hover:opacity-90",
    ghost: "text-[var(--muted)] hover:text-[var(--white)] hover:bg-[rgba(201,168,76,0.1)]",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
