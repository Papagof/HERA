"use client";

import { useEffect, useState, type ComponentType } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  Wrench,
  Trees,
  Sparkles,
  Users,
  CalendarDays,
  MapPin,
  Building,
  ArrowRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/Reveal";
import { buttonClasses } from "@/components/ui/Button";
import { useInView } from "@/lib/useInView";
import { useCountUp } from "@/lib/useCountUp";

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "24/7 Security & CCTV",
    description: "Round-the-clock monitoring and gated access keep every household safe.",
  },
  {
    icon: Wrench,
    title: "Well-Maintained Infrastructure",
    description: "Paved roads, street lighting, and reliable utilities, maintained year-round.",
  },
  {
    icon: Trees,
    title: "Recreational Spaces",
    description: "Green spaces and community facilities for residents of every age.",
  },
  {
    icon: Sparkles,
    title: "Regular Maintenance",
    description: "Proactive upkeep and cleaning across all shared estate areas.",
  },
  {
    icon: Users,
    title: "Efficient Management",
    description: "A dedicated executive team handling estate affairs transparently.",
  },
  {
    icon: CalendarDays,
    title: "Community Events",
    description: "Regular gatherings that keep neighbors connected year-round.",
  },
];

interface StatCardProps {
  icon: ComponentType<{ size?: number }>;
  value: number;
  label: string;
  delay: number;
}

function StatCard({ icon: Icon, value, label, delay }: StatCardProps) {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.4 });
  const displayValue = useCountUp(value, { start: inView, duration: 1400 });

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${inView ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}
      style={{ transitionDelay: inView ? `${delay}ms` : "0ms" }}
    >
      <Card className="h-full transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-900/10">
        <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
          <Icon size={20} />
        </div>
        <div className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
          {displayValue.toLocaleString()}
        </div>
        <div className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">{label}</div>
      </Card>
    </div>
  );
}

export default function HomePage() {
  // null until the fetch resolves - useCountUp only ever starts once (it
  // guards against re-animating), so mounting the stat cards with a
  // placeholder "0" before the real numbers arrive would lock them at 0
  // forever for anyone who scrolls into view before the RPC responds.
  const [stats, setStats] = useState<{
    residentCount: number;
    availableProperties: number;
    activeExecutives: number;
  } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .rpc("estate_public_stats")
      .single()
      .then(({ data }) => {
        if (!data) return;
        setStats({
          // Combined for this single "Residents & Landlords" stat card -
          // the dashboard shows these two as separate cards, both sourced
          // from this same function so the numbers always agree.
          residentCount: data.resident_count + data.landlord_count,
          availableProperties: data.available_properties,
          activeExecutives: data.active_executives,
        });
      });
  }, []);

  return (
    <div className="px-5 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 animate-blob rounded-full bg-indigo-300/30 blur-3xl dark:bg-indigo-500/10" />
          <div className="pointer-events-none absolute -top-16 right-0 h-72 w-72 animate-blob rounded-full bg-teal-300/30 blur-3xl [animation-delay:3s] dark:bg-teal-500/10" />

          <div className="relative grid items-center gap-12 pb-16 lg:grid-cols-2">
            <div>
              <Reveal>
                <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold tracking-wide text-indigo-700 uppercase dark:bg-indigo-500/10 dark:text-indigo-300">
                  Happyland Estate &middot; Oko-Ado &middot; Lekki-Epe Expressway, Lagos
                </span>
              </Reveal>
              <Reveal delay={100}>
                <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
                  Building more than homes
                  <span className="block bg-linear-to-r from-indigo-600 to-teal-500 bg-clip-text text-transparent">
                    creating thriving communities.
                  </span>
                </h1>
              </Reveal>
              <Reveal delay={200}>
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
                  Welcome to Happyland Estate — a premier residential community dedicated to
                  providing a safe, comfortable, and thriving environment for all our residents
                  and property owners.
                </p>
              </Reveal>
              <Reveal delay={300}>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href="/listings" className={`group ${buttonClasses("primary")}`}>
                    View Properties
                    <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                  <Link href="/login" className={buttonClasses("secondary")}>
                    Sign In
                  </Link>
                </div>
              </Reveal>
            </div>

            <Reveal delay={200} className="relative">
              <div className="relative h-80 w-full animate-float overflow-hidden rounded-3xl shadow-2xl shadow-indigo-900/20">
                <Image
                  src="/estate-gate.jpg"
                  alt="Happyland Estate entrance gate"
                  fill
                  sizes="(max-width: 1024px) 100vw, 560px"
                  style={{ objectFit: "cover" }}
                  priority
                />
              </div>
            </Reveal>
          </div>
        </section>

        {/* Stats */}
        {stats && (
          <section className="grid gap-5 sm:grid-cols-3">
            <StatCard icon={Users} value={stats.residentCount} label="Residents & Landlords" delay={0} />
            <StatCard icon={MapPin} value={stats.availableProperties} label="Available Properties" delay={100} />
            <StatCard icon={Building} value={stats.activeExecutives} label="Active Management" delay={200} />
          </section>
        )}

        {/* Features */}
        <section className="mt-16">
          <Reveal>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Estate Features</h2>
          </Reveal>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Reveal key={feature.title} delay={idx * 80}>
                  <Card className="h-full transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg hover:shadow-slate-900/10 dark:hover:border-indigo-800">
                    <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400">
                      <Icon size={18} />
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                      {feature.description}
                    </p>
                  </Card>
                </Reveal>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
