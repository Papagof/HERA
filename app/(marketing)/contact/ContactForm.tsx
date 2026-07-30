"use client";

import { useState } from "react";
import { Send, CheckCircle2, MapPin, Mail, Phone, MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { labelClass } from "@/components/ui/fieldStyles";
import { submitContactMessage } from "./actions";

const emptyForm = { name: "", email: "", subject: "", message: "" };

const OFFICE_ADDRESS = "Happyland Estate Landlords and Residents Association, Oko-Ado, Lekki-Epe Expressway, Lagos";
const CONTACT_EMAIL = "contact@happylandestate.com";
const PHONE_NUMBER = "+2348023136685";
const WHATSAPP_LINK = "https://wa.me/2348023136685";

const CONTACT_DETAILS = [
  { icon: MapPin, label: "Office Address", value: OFFICE_ADDRESS },
  { icon: Mail, label: "Email", value: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` },
  { icon: Phone, label: "Phone", value: PHONE_NUMBER, href: `tel:${PHONE_NUMBER}` },
  { icon: MessageCircle, label: "WhatsApp", value: PHONE_NUMBER, href: WHATSAPP_LINK },
];

export function ContactForm() {
  const [formData, setFormData] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    setError("");
    setSubmitting(true);
    try {
      await submitContactMessage(formData);
      setSubmitted(true);
      setFormData(emptyForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Card className="mt-8">
        <div className="grid gap-5 sm:grid-cols-2">
          {CONTACT_DETAILS.map(({ icon: Icon, label, value, href }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                <Icon size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">{label}</div>
                {href ? (
                  <a
                    href={href}
                    target={href.startsWith("http") ? "_blank" : undefined}
                    rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="text-sm text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
                  >
                    {value}
                  </a>
                ) : (
                  <div className="text-sm text-slate-500 dark:text-slate-400">{value}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {submitted ? (
        <Card className="mt-8 animate-fade-in-up text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <CheckCircle2 size={24} />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Message sent</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Thanks for reaching out — the estate management team will get back to you soon.
          </p>
          <Button variant="secondary" className="mt-6" onClick={() => setSubmitted(false)}>
            Send another message
          </Button>
        </Card>
      ) : (
        <Card className="mt-8">
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div>
              <label className={labelClass}>Full Name *</label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Email Address *</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Subject</label>
              <Input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Message *</label>
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              />
            </div>
            {error && <div className="text-sm font-medium text-red-500">{error}</div>}
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Sending..." : (
                <>
                  <Send size={16} /> Send Message
                </>
              )}
            </Button>
          </form>
        </Card>
      )}
    </>
  );
}
