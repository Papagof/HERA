import type { TextareaHTMLAttributes } from "react";
import { cx } from "@/lib/cx";
import { fieldClass } from "./fieldStyles";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(fieldClass, className)} {...props} />;
}
