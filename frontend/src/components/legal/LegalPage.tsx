import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { COMPANY } from "@/lib/company";

const LINKS = [
  { href: "/about", label: "About Us" },
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/privacy", label: "Privacy Policy" },
];

/** Shared shell so About, Terms and Privacy stay visually consistent. */
export default function LegalPage({
  title,
  intro,
  eyebrow = "ConstroBID",
  children,
}: {
  title: string;
  intro?: string;
  eyebrow?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-[#4d0e27] text-white">
        {/* Soft light blooms, the same treatment the app's other headers use. */}
        <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-secondary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-white/5 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-6 py-7 sm:py-9">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur transition hover:bg-white/20 hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to {COMPANY.brandName}
          </Link>

          <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.24em] text-secondary">
            {eyebrow}
          </p>

          <h1 className="mt-1.5 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>

          {intro && (
            <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">{intro}</p>
          )}

          <span className="mt-4 inline-block rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/70 backdrop-blur">
            Last updated: {COMPANY.lastUpdated}
          </span>
        </div>

        {/* Curved base, so the header sits into the page rather than on top of it. */}
        <div className="h-6 rounded-b-[2rem] bg-gradient-to-br from-primary via-primary to-[#4d0e27]" />
      </header>

      <main className="mx-auto max-w-4xl px-6 pb-16 pt-10 sm:pt-14">
        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="legal-body divide-y divide-slate-100 text-[15px] leading-relaxed text-slate-700 sm:text-base">
            {children}
          </div>
        </article>

        <nav className="mt-8 grid gap-3 sm:grid-cols-3">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-700 transition hover:border-primary/30 hover:text-primary"
            >
              {link.label}
              <span className="mt-1.5 block h-0.5 w-0 rounded-full bg-secondary transition-all duration-300 group-hover:w-8" />
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
}

/** Consistent section heading inside a legal page. */
export function Section({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 py-7 first:pt-0 last:pb-0">
      <h2 className="flex items-center gap-3 text-lg font-bold text-primary sm:text-xl">
        <span className="h-5 w-1 rounded-full bg-secondary" />
        {heading}
      </h2>

      <div className="space-y-3">{children}</div>
    </section>
  );
}
