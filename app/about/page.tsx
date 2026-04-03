import type { Metadata } from "next"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import { Award, Layers, TrendingUp, GitBranch } from "lucide-react"

export const metadata: Metadata = {
  title: "About Us | MoldNdie",
  description: "Learn about MoldNdie — the world's most comprehensive platform for mold and die professionals.",
}

const coreValues = [
  {
    icon: Award,
    title: "Real-World Expertise",
    desc: "Our content and services are built on hands-on industry experience. Every resource is crafted to solve real engineering challenges faced by tooling professionals in production environments.",
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
    desc: "We cover the full tooling lifecycle — from design and validation through production and supplier sourcing — giving you a seamless, integrated professional workflow.",
  },
]

const offerings = [
  { label: "Blog", desc: "Expert articles and practical guides covering mold and die fundamentals, advanced techniques, and industry innovations." },
  { label: "Academy", desc: "Action-oriented tooling design courses covering the full workflow from DFM to final design, with real case studies and downloadable files." },
  { label: "Library", desc: "A growing library of proven 3D mold and die designs based on real case studies — ready-to-use CAD models for accelerated tooling development." },
  { label: "Events", desc: "A global calendar of key mold and die events including conferences, trade shows, workshops, and summits." },
  { label: "Suppliers", desc: "A verified global directory of trusted mold and die suppliers, organized by location and specialization." },
  { label: "Services", desc: "A vertically integrated suite of engineering services — from product validation and DFM analysis to multi-disciplinary tooling design and turnkey project management." },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 space-y-16">

          {/* ── Introduction ── */}
          <section>
            <h1 className="text-3xl font-extrabold text-zinc-900 mb-4">About MoldNdie</h1>
            <p className="text-zinc-600 leading-relaxed">
              MoldNdie is the world&apos;s most comprehensive platform for mold and die professionals.
              Built by engineers, for engineers, we bring together specialized knowledge, curated
              resources, and industry connections under one roof — empowering designers, toolmakers,
              and manufacturers to achieve excellence in plastic injection molding, metal die-casting,
              and sheet metal die production.
            </p>
            <p className="mt-4 text-zinc-600 leading-relaxed">
              Whether you are an experienced tooling engineer, a recent graduate entering the
              manufacturing world, or a company looking for reliable technical resources and
              suppliers, MoldNdie provides everything you need in a single, structured, and
              continuously updated platform.
            </p>
          </section>

          {/* ── Vision ── */}
          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-3 pb-2 border-b border-zinc-100">
              Our Vision
            </h2>
            <p className="text-zinc-600 leading-relaxed">
              To become the global reference point for the mold and die industry — a platform where
              every professional, from apprentice to seasoned expert, finds the tools, knowledge, and
              connections they need to excel. We envision a world where engineering knowledge is
              accessible, actionable, and continuously evolving alongside the industry it serves.
            </p>
          </section>

          {/* ── Mission ── */}
          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-3 pb-2 border-b border-zinc-100">
              Our Mission
            </h2>
            <p className="text-zinc-600 leading-relaxed">
              To accelerate the growth of mold and die professionals worldwide by delivering
              specialized, action-oriented knowledge, professional-grade resources, and a trusted
              ecosystem of services and suppliers — all in one integrated platform. We exist to
              reduce friction for professionals who need reliable references, structured learning,
              and a trusted network, without sorting through scattered or generic content.
            </p>
          </section>

          {/* ── Core Values ── */}
          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-6 pb-2 border-b border-zinc-100">
              Core Values
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {coreValues.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="bg-zinc-50 rounded-xl border border-zinc-100 p-5 flex flex-col gap-3"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon size={18} className="text-primary" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900">{title}</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Story ── */}
          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-3 pb-2 border-b border-zinc-100">
              Our Story
            </h2>
            <div className="space-y-4 text-zinc-600 leading-relaxed">
              <p>
                MoldNdie was founded with a clear purpose: to close the knowledge gap in the
                specialized world of mold and die manufacturing. We recognized that tooling
                professionals across the globe often work in isolation — without access to structured
                learning, reliable technical references, or verified supplier networks.
              </p>
              <p>
                What started as a focused initiative to document and share proven tooling know-how
                grew into a full-scale platform that serves engineers, designers, students, and
                manufacturers across multiple continents. We built MoldNdie around the belief that
                quality engineering knowledge should be accessible — and that the mold and die
                community deserves a dedicated, specialized home.
              </p>
              <p>
                Today, MoldNdie continues to grow — expanding its course library, enriching its
                mold design database, curating its supplier directory, and delivering new services
                that meet the evolving needs of the global tooling industry.
              </p>
            </div>
          </section>

          {/* ── What We Offer ── */}
          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-6 pb-2 border-b border-zinc-100">
              What We Offer
            </h2>
            <ul className="space-y-4">
              {offerings.map(({ label, desc }) => (
                <li key={label} className="flex gap-3">
                  <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-primary" />
                  <span className="text-zinc-600 text-sm leading-relaxed">
                    <strong className="text-zinc-900 font-semibold">{label}</strong> — {desc}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* ── Contact ── */}
          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-3 pb-2 border-b border-zinc-100">
              Get in Touch
            </h2>
            <p className="text-zinc-600 text-sm leading-relaxed">
              Have questions, collaboration proposals, or want to learn more? Reach us at{" "}
              <a href="mailto:moldndie.eg@gmail.com" className="text-primary hover:underline font-medium">
                moldndie.eg@gmail.com
              </a>
            </p>
          </section>

        </div>
      </main>
      <Footer />
    </div>
  )
}
