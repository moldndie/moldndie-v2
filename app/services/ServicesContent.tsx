"use client"

import { useState } from "react"
import { motion, type Variants, AnimatePresence } from "framer-motion"
import {
  CheckCircle,
  ChevronDown,
  Loader2,
  FolderKanban,
  ArrowRight,
  Send,
  Sparkles,
  Mail,
} from "lucide-react"
import { PublicBreadcrumb } from "@/components/layout/PublicBreadcrumb"
import type { ServiceOffering } from "@/services/service.service"

// ── Animations ────────────────────────────────────────────────────────────
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
}

const stagger = (delay = 0) => ({
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: delay } },
})

const scrollReveal = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" } as const,
  transition: { duration: 0.4, ease: "easeOut" as const },
}

// ── Data ──────────────────────────────────────────────────────────────────

const processSteps = [
  { label: "Consult", desc: "Share your project requirements" },
  { label: "Analyze", desc: "We evaluate feasibility & design" },
  { label: "Design", desc: "Precision tooling engineering" },
  { label: "Deliver", desc: "On-time, production-ready results" },
]

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

// ── Service Card ──────────────────────────────────────────────────────────
function ServiceCard({ service, index }: { service: ServiceOffering; index: number }) {
  const isEven = index % 2 === 0
  const step = String(index + 1).padStart(2, "0")
  const highlights: string[] = service.highlights ?? []

  return (
    <motion.div
      variants={fadeUp}
      className={`grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center ${
        !isEven ? "lg:direction-rtl" : ""
      }`}
    >
      <div className={!isEven ? "lg:order-2 lg:text-left" : ""}>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl font-black text-primary/15 select-none">{step}</span>
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <FolderKanban size={20} className="text-primary" strokeWidth={1.5} />
          </div>
        </div>
        <h3 className="text-xl md:text-2xl font-extrabold text-zinc-900 mb-1">{service.title}</h3>
        {service.tagline && (
          <p className="text-sm font-medium text-primary mb-4">{service.tagline}</p>
        )}
        {service.description && (
          <p className="text-sm text-zinc-600 leading-relaxed mb-6">{service.description}</p>
        )}
        {highlights.length > 0 && (
          <ul className="space-y-2.5">
            {highlights.map((h) => (
              <li key={h} className="flex items-start gap-2.5 text-sm text-zinc-600">
                <CheckCircle size={15} className="text-primary mt-0.5 shrink-0" strokeWidth={2} />
                {h}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={`${!isEven ? "lg:order-1" : ""}`}>
        <div className="relative rounded-2xl bg-gradient-to-br from-primary/5 via-zinc-50 to-primary/10 border border-zinc-100 p-10 md:p-14 flex items-center justify-center aspect-square max-w-sm mx-auto">
          <FolderKanban size={80} className="text-primary/20" strokeWidth={0.8} />
          <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_50%_50%,transparent_40%,white_100%)]" />
        </div>
      </div>
    </motion.div>
  )
}

// ── Main Content ──────────────────────────────────────────────────────────
export default function ServicesContent({ services }: { services: ServiceOffering[] }) {
  // Show only Turnkey Project Management; backend stays fully dynamic
  const visibleServices = services.filter((s) =>
    s.title.toLowerCase().includes("turnkey")
  )
  const serviceTypes = visibleServices.map((s) => s.title)
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
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-zinc-950 text-white">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }} />

        <div className="relative max-w-5xl mx-auto px-6 py-20 md:py-28">
          <div className="mb-6">
            <PublicBreadcrumb crumbs={[{ label: "Services" }]} />
          </div>

          <motion.div variants={stagger(0)} initial="hidden" animate="visible" className="max-w-3xl">
            <motion.div variants={fadeUp} className="flex items-center gap-2 mb-5">
              <Sparkles size={16} className="text-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                Engineering Services
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-3xl md:text-5xl lg:text-6xl font-black uppercase leading-[1.1] tracking-tight"
            >
              Precision Engineering,{" "}
              <span className="text-primary">End to End</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-5 text-sm md:text-base text-zinc-400 leading-relaxed max-w-2xl"
            >
              We offer a vertically integrated suite of engineering services designed
              specifically for the mold and die industry. Whether you are at the concept
              stage, mid-production, or scaling up — our expert team delivers precise,
              reliable, and efficient solutions tailored to your project.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
              <a
                href="#request-form"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold text-sm px-7 py-3 rounded-xl transition-colors"
              >
                Get Started <ArrowRight size={15} />
              </a>
              <a
                href="#our-services"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white font-semibold text-sm px-7 py-3 rounded-xl transition-colors"
              >
                Explore Services
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Egypt-only notice ── */}
      <div className="bg-amber-50 border-b border-amber-200 py-3 px-6">
        <p className="text-center text-sm font-medium text-amber-800">
          Services are currently available in Egypt only.
        </p>
      </div>

      {/* ── Process Steps ── */}
      <section className="bg-white border-b border-zinc-100 py-14 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            variants={stagger(0.08)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {processSteps.map(({ label, desc }, i) => (
              <motion.div key={label} variants={fadeUp} className="relative text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white text-sm font-bold mb-3">
                  {i + 1}
                </div>
                {i < processSteps.length - 1 && (
                  <div className="hidden md:block absolute top-5 left-[calc(50%+28px)] w-[calc(100%-56px)] h-px bg-zinc-200" />
                )}
                <h3 className="text-sm font-bold text-zinc-900">{label}</h3>
                <p className="text-xs text-zinc-400 mt-1">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Services Detail ── */}
      <section id="our-services" className="py-20 md:py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div {...scrollReveal} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-zinc-900 uppercase tracking-tight">
              What We Do
            </h2>
            <p className="mt-3 text-sm text-zinc-500 max-w-lg mx-auto">
              End-to-end project delivery for your tooling needs.
            </p>
          </motion.div>

          <motion.div
            variants={stagger(0.15)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="space-y-20 md:space-y-28"
          >
            {visibleServices.map((service, i) => (
              <ServiceCard key={service.id} service={service} index={i} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <motion.section {...scrollReveal} className="bg-primary py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white uppercase tracking-tight">
            Ready to start your project?
          </h2>
          <p className="mt-3 text-sm text-white/70 max-w-lg mx-auto">
            Tell us what you need and our engineering team will get back to you within 24 hours.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href="#request-form"
              className="inline-flex items-center gap-2 bg-white text-primary font-bold text-sm px-8 py-3 rounded-xl hover:bg-zinc-50 transition-colors"
            >
              <Send size={15} />
              Request a Service
            </a>
            <a
              href="mailto:moldndie.eg@gmail.com"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white font-semibold text-sm px-8 py-3 rounded-xl transition-colors"
            >
              <Mail size={15} />
              moldndie.eg@gmail.com
            </a>
          </div>
        </div>
      </motion.section>

      {/* ── Request Form ── */}
      <section id="request-form" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16">

            {/* Left column */}
            <motion.div {...scrollReveal} className="lg:col-span-2">
              <h2 className="text-2xl md:text-3xl font-extrabold text-zinc-900 uppercase tracking-tight mb-3">
                Request a Service
              </h2>
              <p className="text-sm text-zinc-500 leading-relaxed mb-8">
                Fill in the form and our engineering team will review your requirements and
                get back to you shortly with a tailored proposal.
              </p>

              <div className="space-y-5">
                {visibleServices.map((s) => (
                  <div key={s.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <FolderKanban size={16} className="text-primary" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-900">{s.title}</p>
                      {s.tagline && <p className="text-xs text-zinc-400">{s.tagline}</p>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                <p className="text-xs text-zinc-500 leading-relaxed">
                  <span className="font-semibold text-zinc-700">Response time:</span> We typically
                  respond within 24 hours on business days. For urgent requests, reach us directly
                  at{" "}
                  <a href="mailto:moldndie.eg@gmail.com" className="text-primary font-medium hover:underline">
                    moldndie.eg@gmail.com
                  </a>
                </p>
              </div>
            </motion.div>

            {/* Right column — form */}
            <motion.div {...scrollReveal} className="lg:col-span-3">
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 md:p-8">
                <AnimatePresence mode="wait">
                  {success ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex flex-col items-center text-center py-12"
                    >
                      <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                        <CheckCircle size={32} className="text-emerald-500" strokeWidth={1.5} />
                      </div>
                      <h3 className="text-xl font-bold text-zinc-900 mb-2">Request Sent!</h3>
                      <p className="text-sm text-zinc-500 mb-6 max-w-xs">
                        We&apos;ve received your request and will reach out within 24 hours.
                      </p>
                      <button
                        onClick={() => setSuccess(false)}
                        className="text-sm text-primary font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity"
                      >
                        Submit another request
                      </button>
                    </motion.div>
                  ) : (
                    <motion.form
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onSubmit={handleSubmit}
                      className="space-y-5"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-medium text-zinc-700 mb-1.5" htmlFor="name">
                            Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="name" name="name" type="text" required
                            value={form.name} onChange={handleChange}
                            placeholder="Your full name"
                            className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
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
                            className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
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
                            className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
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
                              className="w-full appearance-none border border-zinc-200 rounded-xl px-4 py-3 pr-10 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition bg-white"
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
                          className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none"
                        />
                      </div>

                      {error && (
                        <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                          {error}
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm px-8 py-3.5 rounded-xl transition-colors"
                      >
                        {isLoading ? (
                          <><Loader2 size={16} className="animate-spin" /> Sending…</>
                        ) : (
                          <><Send size={15} /> Send Request</>
                        )}
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

          </div>
        </div>
      </section>
    </>
  )
}
