import type { JSX } from "react";
import { Button } from "../Button/Button";

export function Pagination({
  previousLabel,
  nextLabel,
  pageLabel,
  previousDisabled,
  nextDisabled,
  onPrevious,
  onNext,
  className,
  ariaLabel,
}: Readonly<{
  previousLabel: string;
  nextLabel: string;
  pageLabel: string;
  previousDisabled: boolean;
  nextDisabled: boolean;
  onPrevious: () => void;
  onNext: () => void;
  className?: string;
  ariaLabel: string;
}>): JSX.Element {
  return (
    <nav className={className} aria-label={ariaLabel}>
      <Button variant="quiet" disabled={previousDisabled} onClick={onPrevious}>
        {previousLabel}
      </Button>
      <span>{pageLabel}</span>
      <Button variant="quiet" disabled={nextDisabled} onClick={onNext}>
        {nextLabel}
      </Button>
    </nav>
  );
}
