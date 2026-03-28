"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import {
  BookOpen,
  GraduationCap,
  FolderOpen,
  CalendarDays,
  Globe,
} from "lucide-react"
import HomeAccordion from "@/components/home/HomeAccordion"
import { Button } from "@/components/ui/button"

// ── Shared variants ────────────────────────────────────────────────────
const fadeUp = {
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
  transition: { duration: 0.35, ease: "easeOut" },
}

// ── Wireframe Cube ─────────────────────────────────────────────────────
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
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.25 }}
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

// ── Offer cards data ───────────────────────────────────────────────────
const offerCards = [
  {
    icon: BookOpen,
    title: "BLOG: Updated Knowledge for Mold & Die Professionals",
    desc: "Expert articles and practical guides covering mold and die fundamentals, advanced techniques, and industry innovations — designed to support engineers at every stage while meeting modern tooling standards.",
  },
  {
    icon: GraduationCap,
    title: "ACADEMY: Specialized, End-to-End Tooling Design Courses",
    desc: "Action-oriented tooling design courses covering the full workflow from DFM to final design, delivered through real case studies with downloadable PDFs, native CAD files, and optional step-by-step videos.",
  },
  {
    icon: FolderOpen,
    title: "LIBRARY: Downloadable Molds & Dies Designs",
    desc: "A growing library of proven 3D mold and die designs based on real case studies. Ready-to-use CAD models help accelerate tooling development with accuracy and efficiency.",
  },
  {
    icon: CalendarDays,
    title: "EVENTS: Mold & Die Events Calendar",
    desc: "A global calendar of key mold and die events, including conferences, trade shows, workshops, and summits — helping you stay informed, learn from experts, and expand your industry network.",
  },
  {
    icon: Globe,
    title: "SUPPLIERS: Mold & Die Industry Global Database",
    desc: "A verified global directory of trusted mold and die suppliers, organized by location and specialization, covering machines, materials, components, software, and tooling services.",
  },
]

// ── Card component ─────────────────────────────────────────────────────
const cardItem = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
}

function OfferCard({ icon: Icon, title, desc }: typeof offerCards[0]) {
  return (
    <motion.div
      variants={cardItem}
      whileHover={{ scale: 1.02, boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}
      transition={{ duration: 0.18 }}
      className="bg-white rounded-xl border border-zinc-100 p-6 flex flex-col gap-3 cursor-default"
    >
      <Icon size={36} className="text-primary" strokeWidth={1.5} />
      <h3 className="text-sm font-bold text-primary leading-snug">{title}</h3>
      <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
    </motion.div>
  )
}

// ── Main client component ──────────────────────────────────────────────
export default function HomeClient() {
  return (
    <main className="flex-1">
      {/* ── Hero ── */}
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

      {/* ── Description ── */}
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

      {/* ── What We Offer ── */}
      <section className="bg-zinc-50 py-20 px-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Row 1: heading + first 2 cards */}
          <motion.div
            variants={stagger(0.05)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <motion.div variants={fadeUp} className="flex items-center">
              <h2 className="text-5xl md:text-7xl font-black text-primary uppercase leading-none">
                What
                <br />
                We
                <br />
                Offer
              </h2>
            </motion.div>
            {offerCards.slice(0, 2).map((card) => (
              <OfferCard key={card.title} {...card} />
            ))}
          </motion.div>

          {/* Row 2: last 3 cards */}
          <motion.div
            variants={stagger(0.05)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {offerCards.slice(2).map((card) => (
              <OfferCard key={card.title} {...card} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Accordion ── */}
      <motion.section
        {...scrollReveal}
        className="max-w-4xl mx-auto px-6 py-20"
      >
        <HomeAccordion />
      </motion.section>

      {/* ── Join Community ── */}
      <motion.section
        {...scrollReveal}
        className="bg-zinc-50 py-20 px-6 text-center"
      >
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-900">Join our Community</h2>
          <p className="mt-4 text-sm text-zinc-500 leading-relaxed">
            Sign up today for exclusive access to new blog posts those mentioning the tooling
            industry updates, downloadable files, upcoming events, and tooling industry suppliers.
            Stay informed, stay ahead.
          </p>
          <motion.div
            className="mt-8 inline-block"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15 }}
          >
            <Button
              asChild
              className="px-12 py-3 h-auto rounded-full text-sm font-semibold tracking-widest uppercase"
            >
              <Link href="/signup">Sign Up</Link>
            </Button>
          </motion.div>
        </div>
      </motion.section>
    </main>
  )
}
