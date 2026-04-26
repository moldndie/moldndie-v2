"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Save, Phone, Mail, MapPin, Clock, Globe, MessageCircle, Share2, Type, BarChart3 } from "lucide-react"
import { upsertSiteSettings } from "@/services/siteSettings.service"
import type { SiteSettings } from "@/services/siteSettings.service"
import { cn } from "@/lib/utils"

const TABS = [
  { id: "contact",  label: "Contact Info" },
  { id: "social",   label: "Social Links" },
  { id: "homepage", label: "Homepage" },
  { id: "counters", label: "Counters" },
] as const

type TabId = (typeof TABS)[number]["id"]

interface FieldProps {
  label: string
  icon?: React.ReactNode
  name: keyof SiteSettings
  value: string
  onChange: (k: keyof SiteSettings, v: string) => void
  placeholder?: string
  hint?: string
  type?: string
}

function Field({ label, icon, name, value, onChange, placeholder, hint, type = "text" }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-sm font-medium text-zinc-700">
        {icon && <span className="text-zinc-400">{icon}</span>}
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
      />
      {hint && <p className="text-xs text-zinc-400">{hint}</p>}
    </div>
  )
}

function TextareaField({ label, icon, name, value, onChange, placeholder, hint }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-sm font-medium text-zinc-700">
        {icon && <span className="text-zinc-400">{icon}</span>}
        {label}
      </label>
      <textarea
        rows={3}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none"
      />
      {hint && <p className="text-xs text-zinc-400">{hint}</p>}
    </div>
  )
}

interface Props {
  initialSettings: SiteSettings
}

export default function SiteContentClient({ initialSettings }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("contact")
  const [settings, setSettings] = useState<SiteSettings>(initialSettings)
  const [isPending, startTransition] = useTransition()

  function handleChange(key: keyof SiteSettings, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  function handleSave() {
    startTransition(async () => {
      try {
        await upsertSiteSettings(settings)
        toast.success("Settings saved and live.")
      } catch (e) {
        toast.error((e as Error).message || "Failed to save settings.")
      }
    })
  }

  const v = (key: keyof SiteSettings) => settings[key] ?? ""

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
              activeTab === tab.id
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        {activeTab === "contact" && (
          <div className="space-y-5">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wide">Contact Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field
                label="Phone Number"
                icon={<Phone className="size-3.5" />}
                name="contact_phone"
                value={v("contact_phone")}
                onChange={handleChange}
                placeholder="+20 1XX XXX XXXX"
              />
              <Field
                label="Email Address"
                icon={<Mail className="size-3.5" />}
                name="contact_email"
                value={v("contact_email")}
                onChange={handleChange}
                placeholder="moldndie.eg@gmail.com"
                type="email"
              />
              <Field
                label="WhatsApp Number"
                icon={<MessageCircle className="size-3.5" />}
                name="contact_whatsapp"
                value={v("contact_whatsapp")}
                onChange={handleChange}
                placeholder="+20 1XX XXX XXXX"
                hint="Include country code for WhatsApp links"
              />
              <Field
                label="Working Hours"
                icon={<Clock className="size-3.5" />}
                name="contact_hours"
                value={v("contact_hours")}
                onChange={handleChange}
                placeholder="Mon – Fri, 9am – 6pm EET"
              />
            </div>
            <TextareaField
              label="Address"
              icon={<MapPin className="size-3.5" />}
              name="contact_address"
              value={v("contact_address")}
              onChange={handleChange}
              placeholder="Full mailing address"
            />
            <Field
              label="Google Maps Link"
              icon={<Globe className="size-3.5" />}
              name="contact_maps_link"
              value={v("contact_maps_link")}
              onChange={handleChange}
              placeholder="https://maps.google.com/..."
              hint="Paste the full Google Maps share URL"
            />
          </div>
        )}

        {activeTab === "social" && (
          <div className="space-y-5">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wide">Social Media Links</h3>
            <p className="text-xs text-zinc-400">Leave blank to hide the icon. Include full URL (https://...).</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field
                label="Facebook"
                icon={<Share2 className="size-3.5" />}
                name="social_facebook"
                value={v("social_facebook")}
                onChange={handleChange}
                placeholder="https://facebook.com/moldndie"
              />
              <Field
                label="Instagram"
                icon={<Share2 className="size-3.5" />}
                name="social_instagram"
                value={v("social_instagram")}
                onChange={handleChange}
                placeholder="https://instagram.com/moldndie.eg"
              />
              <Field
                label="YouTube"
                icon={<Share2 className="size-3.5" />}
                name="social_youtube"
                value={v("social_youtube")}
                onChange={handleChange}
                placeholder="https://youtube.com/@MoldDie"
              />
              <Field
                label="Pinterest"
                icon={<Share2 className="size-3.5" />}
                name="social_pinterest"
                value={v("social_pinterest")}
                onChange={handleChange}
                placeholder="https://pinterest.com/moldndie"
              />
              <Field
                label="LinkedIn"
                icon={<Share2 className="size-3.5" />}
                name="social_linkedin"
                value={v("social_linkedin")}
                onChange={handleChange}
                placeholder="https://linkedin.com/company/moldndie"
              />
              <Field
                label="X / Twitter"
                icon={<Share2 className="size-3.5" />}
                name="social_twitter"
                value={v("social_twitter")}
                onChange={handleChange}
                placeholder="https://x.com/moldndie"
              />
            </div>
          </div>
        )}

        {activeTab === "homepage" && (
          <div className="space-y-5">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wide">Homepage Content</h3>
            <Field
              label="Hero Title"
              icon={<Type className="size-3.5" />}
              name="hero_title"
              value={v("hero_title")}
              onChange={handleChange}
              placeholder="Start Your Journey with MoldNdie"
              hint="Main headline shown in the hero section"
            />
            <TextareaField
              label="Hero Subtitle"
              icon={<Type className="size-3.5" />}
              name="hero_subtitle"
              value={v("hero_subtitle")}
              onChange={handleChange}
              placeholder="The ultimate resource for plastic injection mold…"
              hint="Short tagline below the hero title"
            />
            <Field
              label="Footer CTA Text"
              icon={<Type className="size-3.5" />}
              name="footer_cta_text"
              value={v("footer_cta_text")}
              onChange={handleChange}
              placeholder="Join Our Community"
              hint="Heading text in the 'Join Community' section"
            />
            <TextareaField
              label="Footer Tagline"
              icon={<Type className="size-3.5" />}
              name="footer_tagline"
              value={v("footer_tagline")}
              onChange={handleChange}
              placeholder="The ultimate resource for mold and die engineering professionals."
              hint="Short tagline shown in the footer brand column"
            />
            <div className="pt-2 border-t border-zinc-100">
              <h4 className="text-xs font-bold text-zinc-600 uppercase tracking-wide mb-3">Why Choose Us Section</h4>
              <div className="space-y-4">
                <Field
                  label="Section Title"
                  icon={<Type className="size-3.5" />}
                  name="why_title"
                  value={v("why_title")}
                  onChange={handleChange}
                  placeholder="Why Choose Us"
                />
                <TextareaField
                  label="Section Body"
                  icon={<Type className="size-3.5" />}
                  name="why_body"
                  value={v("why_body")}
                  onChange={handleChange}
                  placeholder="Brief description shown below the Why Choose Us heading…"
                  hint="Optional paragraph beneath the section title"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "counters" && (
          <div className="space-y-5">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wide">Social Proof Counters</h3>
            <p className="text-xs text-zinc-400">
              These numbers are displayed on the homepage. Leave blank to hide that counter.
              Use a suffix like &ldquo;+&rdquo; (e.g. &ldquo;500+&rdquo;) or an exact number.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field
                label="Library Toolings"
                icon={<BarChart3 className="size-3.5" />}
                name="counter_toolings"
                value={v("counter_toolings")}
                onChange={handleChange}
                placeholder="200+"
                hint="e.g. number of 3D files & PDFs"
              />
              <Field
                label="Academy Courses"
                icon={<BarChart3 className="size-3.5" />}
                name="counter_courses"
                value={v("counter_courses")}
                onChange={handleChange}
                placeholder="50+"
              />
              <Field
                label="Registered Users"
                icon={<BarChart3 className="size-3.5" />}
                name="counter_users"
                value={v("counter_users")}
                onChange={handleChange}
                placeholder="1,000+"
              />
              <Field
                label="Industry Events"
                icon={<BarChart3 className="size-3.5" />}
                name="counter_events"
                value={v("counter_events")}
                onChange={handleChange}
                placeholder="30+"
              />
            </div>
          </div>
        )}
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors"
        >
          <Save className="size-4" />
          {isPending ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  )
}
