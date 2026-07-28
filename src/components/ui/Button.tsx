import type { ButtonHTMLAttributes, JSX } from "react";

type ButtonVariant = "default" | "quiet" | "danger" | "danger-solid";

const variantClass: Record<ButtonVariant, string> = {
  default: "",
  quiet: "quiet-action",
  danger: "danger-action",
  "danger-solid": "danger-action danger-action--solid",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  Readonly<{ variant?: ButtonVariant }>;

export function Button({
  variant = "default",
  className = "",
  type = "button",
  ...props
}: ButtonProps): JSX.Element {
  const classes = [variantClass[variant], className].filter(Boolean).join(" ");
  return <button className={classes || undefined} type={type} {...props} />;
}
