"use client"

import { useState } from "react"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import { CheckCircle, ChevronDown, Loader2 } from "lucide-react"

const SERVICE_TYPES = [
  "Custom Mold Design",
  "3D Printing",
  "Mold Consultation",
  "Bulk Order",
  "Other",
]

type FormState = {
  name: string
  email: string
  phone: string
  service_type: string
  message: string
}

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  phone: "",
  service_type: "",
  message: "",
}

export default function ServicesPage() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
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
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-lg">
          <h1 className="text-3xl font-extrabold text-zinc-900 mb-2">Request a Service</h1>
          <p className="text-zinc-500 text-sm mb-10">
            Tell us what you need and we'll get back to you shortly.
          </p>

          {success ? (
            <div className="flex flex-col items-center text-center py-16">
              <CheckCircle size={56} className="text-emerald-500 mb-4" strokeWidth={1.5} />
              <h2 className="text-xl font-bold text-zinc-900 mb-2">Request Sent!</h2>
              <p className="text-zinc-500 text-sm mb-6">
                We've received your request and will reach out soon.
              </p>
              <button
                onClick={() => setSuccess(false)}
                className="text-sm text-primary underline underline-offset-2 hover:opacity-80 transition-opacity"
              >
                Submit another request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5" htmlFor="name">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5" htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5" htmlFor="phone">
                  Phone <span className="text-zinc-400 font-normal">(optional)</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+20 1XX XXX XXXX"
                  className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              </div>

              {/* Service Type */}
              <div>
                <label
                  className="block text-sm font-medium text-zinc-700 mb-1.5"
                  htmlFor="service_type"
                >
                  Service Type
                </label>
                <div className="relative">
                  <select
                    id="service_type"
                    name="service_type"
                    value={form.service_type}
                    onChange={handleChange}
                    className="w-full appearance-none border border-zinc-200 rounded-xl px-4 py-3 pr-10 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition bg-white"
                  >
                    <option value="">Select a service…</option>
                    {SERVICE_TYPES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <label
                  className="block text-sm font-medium text-zinc-700 mb-1.5"
                  htmlFor="message"
                >
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Describe what you need…"
                  className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none"
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm px-8 py-3 rounded-xl transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Sending…
                  </>
                ) : (
                  "Send Request"
                )}
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
