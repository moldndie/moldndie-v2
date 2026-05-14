"use client"

import Link from "next/link"
import { motion, type Variants } from "framer-motion"
import {
  BookOpen,
  GraduationCap,
  FolderOpen,
  CalendarDays,
  Globe,
  Calculator,
  Award,
  Layers,
  TrendingUp,
  GitBranch,
} from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import HeroCarousel from "@/components/home/HeroCarousel"
import type { HeroSlide } from "@/services/heroSlides.service"
import { isValidImageUrl } from "@/lib/heroSlides.constants"

// ── Shared variants ────────────────────────────────────────────────────────
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

// ── Offer cards data ───────────────────────────────────────────────────────
const offerCards = [
  {
    icon: BookOpen,
    title: "BLOG",
    desc: "Expert articles and practical guides covering mold and die fundamentals, advanced techniques, and industry innovations — designed to support engineers at every stage while meeting modern tooling standards.",
    href: "/blogs",
  },
  {
    icon: GraduationCap,
    title: "ACADEMY",
    desc: "Action-oriented tooling design courses covering the full workflow from DFM to final design, delivered through real case studies with downloadable PDFs, native CAD files, and optional step-by-step videos.",
    href: "/courses",
  },
  {
    icon: FolderOpen,
    title: "LIBRARY",
    desc: "A growing library of proven 3D mold and die designs based on real case studies. Ready-to-use CAD models help accelerate tooling development with accuracy and efficiency.",
    href: "/molds",
  },
  {
    icon: CalendarDays,
    title: "EVENTS",
    desc: "A global calendar of key mold and die events, including conferences, trade shows, workshops, and summits — helping you stay informed, learn from experts, and expand your industry network.",
    href: "/events",
  },
  {
    icon: Globe,
    title: "SUPPLIERS",
    desc: "A verified global directory of trusted mold and die suppliers, organized by location and specialization, covering machines, materials, components, software, and tooling services.",
    href: "/suppliers",
  },
  {
    icon: Calculator,
    title: "ENGINEERING",
    desc: "Our Engineering Calculators section offers free, high-accuracy tools to streamline the design of injection molds, pressure die-casting molds, and sheet metal dies. By bridging the gap between theoretical design and shop-floor reality.",
    href: "/tools",
  },
]

// ── Why Choose Us data ─────────────────────────────────────────────────────
const whyCards = [
  {
    icon: Award,
    title: "Real-World Expertise",
    desc: "Our content and services are built on hands-on industry experience — not theory. Every resource is crafted to solve real challenges faced by tooling professionals in production environments.",
  },
  {
    icon: Layers,
    title: "Complete Tooling Ecosystem",
    desc: "From knowledge resources and structured training to verified suppliers and engineering services, everything you need for mold and die projects is available in one integrated platform.",
  },
  {
    icon: TrendingUp,
    title: "Always at the Forefront",
    desc: "We continuously update our content, publish new courses, and expand our databases to keep you ahead of industry trends and emerging manufacturing technologies.",
  },
  {
    icon: GitBranch,
    title: "End-to-End Vertical Integration",
    desc: "We cover the full tooling lifecycle — from design and validation through to production and supplier sourcing — giving you a seamless, fully integrated professional workflow.",
  },
]

// ── Card animation variant ─────────────────────────────────────────────────
const cardItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
}

// ── Offer Card ─────────────────────────────────────────────────────────────
function OfferCard({ icon: Icon, title, desc, href }: typeof offerCards[0]) {
  return (
    <motion.div variants={cardItem}>
      <Link
        href={href}
        className="group bg-white rounded-xl border border-zinc-100 p-6 flex flex-col gap-3 hover:shadow-md hover:border-zinc-200 transition-all duration-200 h-full"
      >
        <Icon size={36} className="text-primary" strokeWidth={1.5} />
        <h3 className="text-sm font-bold text-primary leading-snug uppercase tracking-wide">{title}</h3>
        <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
        <span className="mt-auto pt-1 text-xs font-semibold text-primary/70 group-hover:text-primary transition-colors">
          Explore →
        </span>
      </Link>
    </motion.div>
  )
}

// ── Why Card ───────────────────────────────────────────────────────────────
function WhyCard({ icon: Icon, title, desc }: typeof whyCards[0]) {
  return (
    <motion.div
      variants={cardItem}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.18 }}
      className="bg-white rounded-xl border border-zinc-100 p-6 flex flex-col gap-3"
    >
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Icon size={20} className="text-primary" strokeWidth={1.5} />
      </div>
      <h3 className="text-sm font-bold text-zinc-900">{title}</h3>
      <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
    </motion.div>
  )
}

// ── Counter chip ───────────────────────────────────────────────────────────
function CounterChip({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 px-8 py-6 bg-white rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md transition-shadow">
      <span className="text-3xl md:text-4xl font-black text-primary tabular-nums">{value}</span>
      <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">{label}</span>
    </div>
  )
}

// ── Main client component ──────────────────────────────────────────────────
interface HomeClientProps {
  counters?: {
    toolings?: string
    courses?:  string
    users?:    string
    events?:   string
  }
  heroSlides?: HeroSlide[]
}

export default function HomeClient({ counters = {}, heroSlides = [] }: HomeClientProps) {
  // Drop any slide whose image_url is not a real absolute/root-relative URL.
  // This prevents Next/Image errors from bare relative paths or stale DB values.
  const validSlides = heroSlides.filter((s) => isValidImageUrl(s.image_url))

  const counterEntries = [
    { key: "toolings", label: "Toolings",   value: counters.toolings },
    { key: "courses",  label: "Courses",    value: counters.courses  },
    { key: "users",    label: "Members",    value: counters.users    },
    { key: "events",   label: "Events",     value: counters.events   },
  ].filter((c) => c.value && c.value.trim() !== "")

  return (
    <main className="flex-1">
      {/* ── Hero: carousel when valid slides exist, fallback otherwise ── */}
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
              Start Your Journey with MoldNdie
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-4 text-xs md:text-sm font-semibold tracking-widest text-zinc-400 uppercase max-w-2xl mx-auto"
            >
              The ultimate resource for plastic injection mold, metal die-casting mold, and sheet
              metal die design and manufacture know-how
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

      {/* ── Description — only shown when no carousel images exist ── */}
      {validSlides.length === 0 && (
      <motion.section
        {...scrollReveal}
        className="max-w-4xl mx-auto px-6 pb-20 text-center"
      >
        <p className="text-sm md:text-base text-zinc-600 leading-relaxed">
          We provide educational content, updated know-how, professional resources, and action
          oriented training, specifically for the key areas of manufacturing: Plastic Injection
          Molds, Metal Pressure Die-casting Molds, and Sheet Metal Dies.
        </p>
      </motion.section>
      )}

      {/* ── What We Offer ── */}
      <section className="bg-zinc-50 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Centered title */}
          <motion.div
            {...scrollReveal}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-black text-primary uppercase leading-none tracking-tight">
              What We Offer
            </h2>
            <p className="mt-3 text-sm text-zinc-500 max-w-xl mx-auto">
              Everything a mold and die professional needs — in one place.
            </p>
          </motion.div>

          {/* Row 1: BLOG, ACADEMY, LIBRARY */}
          <motion.div
            variants={stagger(0.05)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6"
          >
            {offerCards.slice(0, 3).map((card) => (
              <OfferCard key={card.title} {...card} />
            ))}
          </motion.div>

          {/* Row 2: EVENTS, SUPPLIERS, SERVICES */}
          <motion.div
            variants={stagger(0.05)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {offerCards.slice(3).map((card) => (
              <OfferCard key={card.title} {...card} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Why Choose Us ── */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div {...scrollReveal} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-zinc-900 uppercase tracking-tight">
              Why Choose Us
            </h2>
            <p className="mt-3 text-sm text-zinc-500 max-w-xl mx-auto">
              Built by industry professionals, for industry professionals.
            </p>
          </motion.div>

          <motion.div
            variants={stagger(0.07)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {whyCards.map((card) => (
              <WhyCard key={card.title} {...card} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Counters / Social Proof ── */}
      {counterEntries.length > 0 && (
        <section className="bg-zinc-950 py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <motion.p
              {...scrollReveal}
              className="text-center text-xs font-bold uppercase tracking-widest text-zinc-500 mb-8"
            >
              By the numbers
            </motion.p>
            <motion.div
              variants={stagger(0.08)}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              className={`grid gap-4 ${
                counterEntries.length === 1 ? "grid-cols-1 max-w-xs mx-auto"
                : counterEntries.length === 2 ? "grid-cols-2 max-w-md mx-auto"
                : counterEntries.length === 3 ? "grid-cols-3"
                : "grid-cols-2 sm:grid-cols-4"
              }`}
            >
              {counterEntries.map((c) => (
                <motion.div key={c.key} variants={cardItem}>
                  <CounterChip value={c.value!} label={c.label} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* ── Join Community ── */}
      <motion.section
        {...scrollReveal}
        className="bg-zinc-50 py-20 px-6 text-center"
      >
        <div className="max-w-2xl mx-auto">
          <Link
            href="/login"
            className="inline-block group"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 group-hover:text-primary transition-colors">
              Join Our Community
            </h2>
          </Link>
          <p className="mt-4 text-sm text-zinc-500 leading-relaxed">
            Sign up today for exclusive access to new blog posts covering tooling industry updates,
            downloadable files, upcoming events, and a verified global supplier network.
            Stay informed, stay ahead — connect with thousands of mold and die professionals worldwide.
          </p>

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
