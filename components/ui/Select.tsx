import type { SelectHTMLAttributes } from "react";
import { cx } from "@/lib/cx";
import { fieldClass } from "./fieldStyles";

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cx(fieldClass, className)} {...props} />;
}
