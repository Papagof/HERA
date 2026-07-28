import type { InputHTMLAttributes } from "react";
import { cx } from "@/lib/cx";
import { fieldClass } from "./fieldStyles";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(fieldClass, className)} {...props} />;
}
