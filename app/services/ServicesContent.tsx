"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  CheckCircle,
  ChevronDown,
  Loader2,
  FolderKanban,
  Send,
  Mail,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { PublicBreadcrumb } from "@/components/layout/PublicBreadcrumb"
import { docToText } from "@/lib/richtext"
import type { ServiceOffering } from "@/services/service.service"
import type { ServiceProcessStep } from "@/services/serviceProcessSteps.service"

const reveal = {
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" } as const,
  transition: { duration: 0.3, ease: "easeOut" as const },
}

type FormState = {
  name: string
  email: string
  phone: string
  service_type: string
  message: string
  _hp: string
}

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  phone: "",
  service_type: "",
  message: "",
  _hp: "",
}

const inputClass =
  "w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"

// ── Service card — same shape as the Blog/Library/Academy cards ─────────────
function ServiceCard({ service }: { service: ServiceOffering }) {
  // Blank entries in the repeater would otherwise render as a bare tick icon.
  const highlights: string[] = (service.highlights ?? []).filter((h) => h.trim())

  return (
    <motion.div {...reveal} className="flex">
    <Link
      href={`/services/${service.slug}`}
      className="group flex flex-col flex-1 rounded-2xl overflow-hidden border border-zinc-100 bg-white shadow-sm hover:shadow-md transition-all duration-200"
    >
      <div className="aspect-video relative bg-white overflow-hidden">
        {service.image ? (
          <Image
            src={service.image}
            alt={service.title}
            fill
            className="object-contain group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-50">
            <FolderKanban size={56} className="text-primary/20" strokeWidth={0.8} />
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1 gap-2">
        <h3 className="text-base font-bold text-zinc-900 group-hover:text-primary transition-colors">
          {service.title}
        </h3>
        {service.tagline && (
          <span className="self-start rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
            {service.tagline}
          </span>
        )}
        {/* Flattened teaser, not rich text: the whole card is a link, and an
            anchor inside an anchor is invalid. The full description with its
            working links lives on /services/[slug]. */}
        {docToText(service.description) && (
          <p className="text-sm text-zinc-600 line-clamp-3">{docToText(service.description)}</p>
        )}
        {highlights.length > 0 && (
          <ul className="mt-1 space-y-2">
            {highlights.map((h) => (
              <li key={h} className="flex items-start gap-2 text-sm text-zinc-600">
                <CheckCircle size={14} className="text-primary mt-0.5 shrink-0" strokeWidth={2} />
                {h}
              </li>
            ))}
          </ul>
        )}
        <span className="mt-auto pt-2 text-xs font-bold uppercase tracking-wider text-primary">
          View examples &rarr;
        </span>
      </div>
    </Link>
    </motion.div>
  )
}

// ── Main Content ──────────────────────────────────────────────────────────
export default function ServicesContent({
  services,
  processSteps,
}: {
  services: ServiceOffering[]
  processSteps: ServiceProcessStep[]
}) {
  const serviceTypes = services.map((s) => s.title)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/service-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.")
        return
      }
      setSuccess(true)
      setForm(EMPTY_FORM)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
      {/* ── Heading ── */}
      <div>
        <PublicBreadcrumb crumbs={[{ label: "Services" }]} />
        <h1 className="mt-3 text-3xl md:text-4xl font-extrabold text-zinc-900 uppercase tracking-tight">
          Services
        </h1>
        <p className="mt-1 text-sm text-zinc-500 max-w-2xl">
          A vertically integrated suite of engineering services for the mold and die
          industry — concept, mid-production, or scale-up.
        </p>
        <p className="mt-3 inline-block rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs font-medium text-amber-800">
          Services are currently available in Egypt only.
        </p>
      </div>

      {/* ── Process ── */}
      {processSteps.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-zinc-900 uppercase tracking-wide mb-4">
            How It Works
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {processSteps.map((step, i) => (
              <div
                key={step.id}
                className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm"
              >
                <span className="inline-flex size-8 items-center justify-center rounded-full bg-primary text-white text-xs font-bold mb-3">
                  {i + 1}
                </span>
                <h3 className="text-sm font-bold text-zinc-900">{step.label}</h3>
                {step.description && (
                  <p className="text-xs text-zinc-500 mt-1">{step.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Services ── */}
      {services.length > 0 && (
        <div id="our-services">
          <h2 className="text-base font-bold text-zinc-900 uppercase tracking-wide mb-4">
            What We Do
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </div>
      )}

      {/* ── Request Form ── */}
      <div id="request-form">
        <h2 className="text-base font-bold text-zinc-900 uppercase tracking-wide mb-4">
          Request a Service
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm space-y-5">
            <p className="text-sm text-zinc-500 leading-relaxed">
              Fill in the form and our engineering team will review your requirements and
              get back to you shortly with a tailored proposal.
            </p>

            {services.map((s) => (
              <div key={s.id} className="flex items-start gap-3">
                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <FolderKanban size={16} className="text-primary" strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-zinc-900">{s.title}</p>
                  {s.tagline && <p className="text-xs text-zinc-500">{s.tagline}</p>}
                </div>
              </div>
            ))}

            <p className="rounded-xl bg-zinc-50 border border-zinc-100 p-4 text-xs text-zinc-500 leading-relaxed">
              <span className="font-semibold text-zinc-700">Response time:</span> we typically
              respond within 24 hours on business days. For urgent requests, reach us at{" "}
              <a
                href="mailto:moldndie.eg@gmail.com"
                className="text-primary font-medium hover:underline"
              >
                moldndie.eg@gmail.com
              </a>
            </p>
          </div>

          {/* Right column — form */}
          <div className="lg:col-span-3 rounded-2xl border border-zinc-100 bg-white shadow-sm p-6">
            {success ? (
              <div className="flex flex-col items-center text-center py-12">
                <div className="size-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                  <CheckCircle size={32} className="text-emerald-500" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 mb-2">Request sent</h3>
                <p className="text-sm text-zinc-500 mb-6 max-w-xs">
                  We&apos;ve received your request and will reach out within 24 hours.
                </p>
                <button
                  onClick={() => setSuccess(false)}
                  className="text-sm text-primary font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity"
                >
                  Submit another request
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1.5" htmlFor="name">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="name" name="name" type="text" required
                      value={form.name} onChange={handleChange}
                      placeholder="Your full name"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1.5" htmlFor="email">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="email" name="email" type="email" required
                      value={form.email} onChange={handleChange}
                      placeholder="you@example.com"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1.5" htmlFor="phone">
                      Phone <span className="text-zinc-400 font-normal">(optional)</span>
                    </label>
                    <input
                      id="phone" name="phone" type="tel"
                      value={form.phone} onChange={handleChange}
                      placeholder="+20 1XX XXX XXXX"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1.5" htmlFor="service_type">
                      Service Type
                    </label>
                    <div className="relative">
                      <select
                        id="service_type" name="service_type"
                        value={form.service_type} onChange={handleChange}
                        className={`${inputClass} appearance-none pr-10 bg-white`}
                      >
                        <option value="">Select a service…</option>
                        {serviceTypes.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <ChevronDown
                        size={16}
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Honeypot */}
                <input
                  type="text" name="_hp" value={form._hp} onChange={handleChange}
                  tabIndex={-1} autoComplete="off" aria-hidden="true"
                  style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px", opacity: 0 }}
                />

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5" htmlFor="message">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="message" name="message" required rows={5}
                    value={form.message} onChange={handleChange}
                    placeholder="Describe your project requirements, timeline, and any specific needs…"
                    className={`${inputClass} resize-none`}
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-7 py-3 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoading ? (
                      <><Loader2 size={16} className="animate-spin" /> Sending…</>
                    ) : (
                      <><Send size={15} /> Send Request</>
                    )}
                  </button>
                  <a
                    href="mailto:moldndie.eg@gmail.com"
                    className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-7 py-3 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
                  >
                    <Mail size={15} />
                    Email us
                  </a>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
