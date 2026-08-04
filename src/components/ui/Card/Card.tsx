import { createElement, type HTMLAttributes, type JSX } from "react";

type CardElement = "article" | "div" | "section";

export type CardProps = HTMLAttributes<HTMLElement> &
  Readonly<{
    as?: CardElement;
    tone?: string;
  }>;

export function Card({ as = "article", className = "", tone, ...props }: CardProps): JSX.Element {
  const classes = ["card", tone && `card--${tone}`, className].filter(Boolean).join(" ");
  return createElement(as, { className: classes, ...props });
}
