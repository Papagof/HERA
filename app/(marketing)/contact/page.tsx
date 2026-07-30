import { ContactForm } from "./ContactForm";

export default function ContactPage() {
  return (
    <div className="px-5 py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Contact Us</h1>
        <p className="mt-3 text-slate-500 dark:text-slate-400">
          Have a question for the estate management team? Send us a message and we&apos;ll get
          back to you.
        </p>

        <ContactForm />
      </div>
    </div>
  );
}
