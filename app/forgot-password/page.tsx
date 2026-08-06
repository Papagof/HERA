import Link from "next/link";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-4 inline-block text-sm text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
        >
          &larr; Back to home
        </Link>
        <h1 className="mb-6 text-center text-2xl font-semibold text-slate-900 dark:text-slate-100">
          HERA
        </h1>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
