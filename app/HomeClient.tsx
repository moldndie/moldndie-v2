"use client"

import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { motion, useInView, type Variants } from "framer-motion"
import { Layers, BookOpen, Users, Calendar, Globe } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import HeroCarousel from "@/components/home/HeroCarousel"
import type { HeroSlide } from "@/services/heroSlides.service"
import type { HomeOfferItem } from "@/services/homeOfferItems.service"
import type { HomeWhyCard } from "@/services/homeWhyCards.service"
import type { SiteSettings } from "@/services/siteSettings.service"
import { isValidImageUrl } from "@/lib/heroSlides.constants"
import { DynamicIcon } from "@/lib/icons"

// ── Animation variants ─────────────────────────────────────────────────────
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
}

const stagger = (delay = 0) => ({
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: delay } },
})

const scrollReveal = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" } as const,
  transition: { duration: 0.35, ease: "easeOut" as const },
}

// ── Wireframe Cube ─────────────────────────────────────────────────────────
function WireframeCube() {
  const s = "#9B2C2C"
  const w = "1.5"
  const gw = "1"
  const go = "0.45"
  return (
    <motion.svg
      viewBox="30 10 180 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-56 h-56 md:w-72 md:h-72"
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" as const, delay: 0.25 }}
    >
      <polygon points="120,20 200,60 120,100 40,60" stroke={s} strokeWidth={w} />
      <polygon points="40,60 120,100 120,180 40,140" stroke={s} strokeWidth={w} />
      <polygon points="120,100 200,60 200,140 120,180" stroke={s} strokeWidth={w} />
      <line x1="93" y1="33" x2="173" y2="73" stroke={s} strokeWidth={gw} opacity={go} />
      <line x1="67" y1="47" x2="147" y2="87" stroke={s} strokeWidth={gw} opacity={go} />
      <line x1="147" y1="33" x2="67" y2="73" stroke={s} strokeWidth={gw} opacity={go} />
      <line x1="173" y1="47" x2="93" y2="87" stroke={s} strokeWidth={gw} opacity={go} />
      <line x1="40" y1="87" x2="120" y2="127" stroke={s} strokeWidth={gw} opacity={go} />
      <line x1="40" y1="113" x2="120" y2="153" stroke={s} strokeWidth={gw} opacity={go} />
      <line x1="67" y1="73" x2="67" y2="153" stroke={s} strokeWidth={gw} opacity={go} />
      <line x1="93" y1="87" x2="93" y2="167" stroke={s} strokeWidth={gw} opacity={go} />
      <line x1="120" y1="127" x2="200" y2="87" stroke={s} strokeWidth={gw} opacity={go} />
      <line x1="120" y1="153" x2="200" y2="113" stroke={s} strokeWidth={gw} opacity={go} />
      <line x1="147" y1="87" x2="147" y2="167" stroke={s} strokeWidth={gw} opacity={go} />
      <line x1="173" y1="73" x2="173" y2="153" stroke={s} strokeWidth={gw} opacity={go} />
    </motion.svg>
  )
}

// ── Card animation variant ─────────────────────────────────────────────────
const cardItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
}

// ── Offer Card ─────────────────────────────────────────────────────────────
function OfferCard({ item }: { item: HomeOfferItem }) {
  const content = (
    <motion.div variants={cardItem}>
      <div className="group bg-white rounded-xl border border-zinc-100 p-6 flex flex-col gap-3 hover:shadow-md hover:border-zinc-200 transition-all duration-200 h-full">
        <DynamicIcon name={item.icon} size={36} strokeWidth={1.5} className="text-primary" />
        <h3 className="text-sm font-bold text-primary leading-snug uppercase tracking-wide">{item.title}</h3>
        {item.description && (
          <p className="text-xs text-zinc-500 leading-relaxed">{item.description}</p>
        )}
        {item.button_text && (
          <span className="mt-auto pt-1 text-xs font-semibold text-primary/70 group-hover:text-primary transition-colors">
            {item.button_text} →
          </span>
        )}
      </div>
    </motion.div>
  )

  if (item.button_url) {
    return <Link href={item.button_url}>{content}</Link>
  }
  return content
}

// ── Why Card ───────────────────────────────────────────────────────────────
function WhyCard({ card }: { card: HomeWhyCard }) {
  return (
    <motion.div
      variants={cardItem}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.18 }}
      className="bg-white rounded-xl border border-zinc-100 p-6 flex flex-col gap-3"
    >
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <DynamicIcon name={card.icon} size={20} strokeWidth={1.5} className="text-primary" />
      </div>
      <h3 className="text-sm font-bold text-zinc-900">{card.title}</h3>
      {card.description && (
        <p className="text-xs text-zinc-500 leading-relaxed">{card.description}</p>
      )}
    </motion.div>
  )
}

// ── Counter helpers ─────────────────────────────────────────────────────────
const statIcons: Record<string, React.ElementType> = {
  toolings: Layers,
  courses:  BookOpen,
  users:    Users,
  events:   Calendar,
  visitors: Globe,
}

function parseCounter(raw: string): { num: number; suffix: string } {
  const clean = raw.replace(/,/g, "")
  const m = clean.match(/^(\d+)(.*)$/)
  return m ? { num: parseInt(m[1], 10), suffix: m[2] } : { num: 0, suffix: raw }
}

function useCountUp(end: number, active: boolean, duration = 1600) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!active || end === 0) return
    let raf: number
    const t0 = performance.now()
    const tick = (now: number) => {
      const p  = Math.min((now - t0) / duration, 1)
      const ep = 1 - Math.pow(1 - p, 3)        // easeOutCubic
      setVal(Math.round(ep * end))
      if (p < 1) raf = requestAnimationFrame(tick)
      else setVal(end)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [end, active, duration])
  return val
}

function StatItem({
  statKey, value, label, delay,
}: {
  statKey: string; value: string; label: string; delay: number
}) {
  const ref    = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })
  const Icon   = statIcons[statKey] ?? Globe
  const { num, suffix } = parseCounter(value)
  const displayed = useCountUp(num, inView)

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className="flex flex-col items-center gap-3 px-8 py-6"
    >
      <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.12)", boxShadow: "0 0 0 1px rgba(255,255,255,0.15)" }}>
        <Icon size={18} strokeWidth={1.5} style={{ color: "rgba(255,220,200,0.75)" }} />
      </div>
      <div className="text-center">
        <p className="text-4xl md:text-5xl font-black tabular-nums tracking-tight leading-none" style={{ color: "#FFD9C8" }}>
          {displayed.toLocaleString()}{suffix}
        </p>
        <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.45)" }}>{label}</p>
      </div>
    </motion.div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
interface HomeClientProps {
  counters?: {
    toolings?: string
    courses?:  string
    users?:    string
    events?:   string
    visitors?: string
  }
  heroSlides?: HeroSlide[]
  offerItems?: HomeOfferItem[]
  whyCards?: HomeWhyCard[]
  settings?: SiteSettings
}

export default function HomeClient({
  counters = {},
  heroSlides = [],
  offerItems = [],
  whyCards = [],
  settings = {},
}: HomeClientProps) {
  const validSlides = heroSlides.filter((s) => isValidImageUrl(s.image_url))

  const counterEntries = [
    { key: "toolings", label: "Toolings",   value: counters.toolings },
    { key: "courses",  label: "Courses",    value: counters.courses  },
    { key: "users",    label: "Members",    value: counters.users    },
    { key: "events",   label: "Events",     value: counters.events   },
    { key: "visitors", label: "Visitors",   value: counters.visitors },
  ].filter((c) => c.value && c.value.trim() !== "")

  const heroTitle       = settings.hero_title       || "Start Your Journey with MoldNdie"
  const heroSubtitle    = settings.hero_subtitle     || "The ultimate resource for plastic injection mold, metal die-casting mold, and sheet metal die design and manufacture know-how"
  const heroDescription = settings.hero_description  || "We provide educational content, updated know-how, professional resources, and action oriented training, specifically for the key areas of manufacturing: Plastic Injection Molds, Metal Pressure Die-casting Molds, and Sheet Metal Dies."

  const offerTitle    = settings.offer_section_title    || "What We Offer"
  const offerSubtitle = settings.offer_section_subtitle || "Everything a mold and die professional needs — in one place."

  const whyTitle    = settings.why_title    || "Why Choose Us"
  const whySubtitle = settings.why_subtitle || "Built by industry professionals, for industry professionals."

  const joinTitle       = settings.join_title       || settings.footer_cta_text || "Join Our Community"
  const joinDescription = settings.join_description || "Sign up today for exclusive access to new blog posts covering tooling industry updates, downloadable files, upcoming events, and a verified global supplier network. Stay informed, stay ahead — connect with thousands of mold and die professionals worldwide."

  return (
    <main className="flex-1">
      {/* ── Hero ── */}
      {validSlides.length > 0 ? (
        <HeroCarousel slides={validSlides} />
      ) : (
        <section className="text-center px-6 pt-20 pb-12 max-w-4xl mx-auto">
          <motion.div
            variants={stagger(0)}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center"
          >
            <motion.h1
              variants={fadeUp}
              className="text-4xl md:text-6xl font-extrabold text-primary uppercase leading-tight tracking-tight"
            >
              {heroTitle}
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-4 text-xs md:text-sm font-semibold tracking-widest text-zinc-400 uppercase max-w-2xl mx-auto"
            >
              {heroSubtitle}
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="flex justify-center mt-10"
            >
              <WireframeCube />
            </motion.div>
          </motion.div>
        </section>
      )}

      {/* ── Description (fallback only) ── */}
      {validSlides.length === 0 && (
        <motion.section
          {...scrollReveal}
          className="max-w-4xl mx-auto px-6 pb-20 text-center"
        >
          <p className="text-sm md:text-base text-zinc-600 leading-relaxed">
            {heroDescription}
          </p>
        </motion.section>
      )}

      {/* ── What We Offer ── */}
      {offerItems.length > 0 && (
        <section className="bg-zinc-50 py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div {...scrollReveal} className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-black text-primary uppercase leading-none tracking-tight">
                {offerTitle}
              </h2>
              {offerSubtitle && (
                <p className="mt-3 text-sm text-zinc-500 max-w-xl mx-auto">
                  {offerSubtitle}
                </p>
              )}
            </motion.div>

            <motion.div
              variants={stagger(0.05)}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {offerItems.map((item) => (
                <OfferCard key={item.id} item={item} />
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* ── Why Choose Us ── */}
      {whyCards.length > 0 && (
        <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div {...scrollReveal} className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-extrabold text-zinc-900 uppercase tracking-tight">
                {whyTitle}
              </h2>
              {whySubtitle && (
                <p className="mt-3 text-sm text-zinc-500 max-w-xl mx-auto">
                  {whySubtitle}
                </p>
              )}
            </motion.div>

            <motion.div
              variants={stagger(0.07)}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {whyCards.map((card) => (
                <WhyCard key={card.id} card={card} />
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* ── Counters / Social Proof ── */}
      {counterEntries.length > 0 && (
        <section
          className="relative overflow-hidden py-20 px-6"
          style={{ background: "linear-gradient(135deg, #5C1515 0%, #3d0f0f 55%, #1a0404 100%)" }}
        >
          {/* dot-grid texture */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          {/* soft top glow */}
          <div
            aria-hidden
            className="absolute -top-32 left-1/2 -translate-x-1/2 w-150 h-75 rounded-full blur-3xl pointer-events-none"
            style={{ background: "rgba(255,255,255,0.06)" }}
          />

          <div className="relative max-w-5xl mx-auto">
            {/* heading */}
            <motion.div {...scrollReveal} className="text-center mb-14">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 mb-3">
                Trusted by professionals worldwide
              </p>
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                By the Numbers
              </h2>
              <div className="mt-4 mx-auto w-10 h-0.5 rounded-full bg-white/20" />
            </motion.div>

            {/* stats row */}
            <div className={`flex flex-wrap justify-center ${
              counterEntries.length > 2 ? "divide-x divide-white/10" : "gap-8"
            }`}>
              {counterEntries.map((c, i) => (
                <StatItem
                  key={c.key}
                  statKey={c.key}
                  value={c.value!}
                  label={c.label}
                  delay={i * 0.1}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Join Community ── */}
      <motion.section
        {...scrollReveal}
        className="bg-zinc-50 py-20 px-6 text-center"
      >
        <div className="max-w-2xl mx-auto">
          <Link href="/login" className="inline-block group">
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 group-hover:text-primary transition-colors">
              {joinTitle}
            </h2>
          </Link>
          {joinDescription && (
            <p className="mt-4 text-sm text-zinc-500 leading-relaxed">
              {joinDescription}
            </p>
          )}

          <motion.div
            className="mt-8 inline-block"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15 }}
          >
            <Link
              href="/login"
              className={buttonVariants({ className: "px-12 py-3 h-auto rounded-full text-sm font-semibold tracking-widest uppercase" })}
            >
              Join Now
            </Link>
          </motion.div>
        </div>
      </motion.section>
    </main>
  )
}
