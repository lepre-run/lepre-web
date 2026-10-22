import type { ReactNode } from "react";
import { useCountUp } from "../../../hooks/useCountUp";

export function CountUp({
  value,
  format,
}: Readonly<{ value: number; format: (value: number) => string }>): ReactNode {
  const finalText = format(value);
  const text = format(useCountUp(value));
  if (text === finalText) return finalText;
  return (
    <>
      <span className="count-up" aria-hidden="true">
        {text}
      </span>
      <span className="visually-hidden">{finalText}</span>
    </>
  );
}
