import Link from "next/link";
import {
  BookOpen,
  GraduationCap,
  FolderOpen,
  CalendarDays,
  Globe,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HomeAccordion from "@/components/home/HomeAccordion";
import { Button } from "@/components/ui/button";

/* ─── Wireframe Cube SVG ─────────────────────────────────── */
function WireframeCube() {
  const s = "#9B2C2C";
  const w = "1.5";
  const gw = "1";
  const go = "0.45";
  return (
    <svg
      viewBox="30 10 180 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-56 h-56 md:w-72 md:h-72"
    >
      {/* Faces */}
      <polygon points="120,20 200,60 120,100 40,60" stroke={s} strokeWidth={w} />
      <polygon points="40,60 120,100 120,180 40,140" stroke={s} strokeWidth={w} />
      <polygon points="120,100 200,60 200,140 120,180" stroke={s} strokeWidth={w} />

      {/* Top face grid */}
      <line x1="93" y1="33" x2="173" y2="73" stroke={s} strokeWidth={gw} opacity={go} />
      <line x1="67" y1="47" x2="147" y2="87" stroke={s} strokeWidth={gw} opacity={go} />
      <line x1="147" y1="33" x2="67" y2="73" stroke={s} strokeWidth={gw} opacity={go} />
      <line x1="173" y1="47" x2="93" y2="87" stroke={s} strokeWidth={gw} opacity={go} />

      {/* Left face grid */}
      <line x1="40" y1="87" x2="120" y2="127" stroke={s} strokeWidth={gw} opacity={go} />
      <line x1="40" y1="113" x2="120" y2="153" stroke={s} strokeWidth={gw} opacity={go} />
      <line x1="67" y1="73" x2="67" y2="153" stroke={s} strokeWidth={gw} opacity={go} />
      <line x1="93" y1="87" x2="93" y2="167" stroke={s} strokeWidth={gw} opacity={go} />

      {/* Right face grid */}
      <line x1="120" y1="127" x2="200" y2="87" stroke={s} strokeWidth={gw} opacity={go} />
      <line x1="120" y1="153" x2="200" y2="113" stroke={s} strokeWidth={gw} opacity={go} />
      <line x1="147" y1="87" x2="147" y2="167" stroke={s} strokeWidth={gw} opacity={go} />
      <line x1="173" y1="73" x2="173" y2="153" stroke={s} strokeWidth={gw} opacity={go} />
    </svg>
  );
}

/* ─── What We Offer cards ────────────────────────────────── */
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
];

/* ─── Page ───────────────────────────────────────────────── */
export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="text-center px-6 pt-20 pb-12 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-extrabold text-primary uppercase leading-tight tracking-tight">
            Start Your Journey with MoldNdie
          </h1>
          <p className="mt-4 text-xs md:text-sm font-semibold tracking-widest text-zinc-400 uppercase max-w-2xl mx-auto">
            The ultimate resource for plastic injection mold, metal die-casting mold, and sheet
            metal die design and manufacture know-how
          </p>
          <div className="flex justify-center mt-10">
            <WireframeCube />
          </div>
        </section>

        {/* ── Description ── */}
        <section className="max-w-4xl mx-auto px-6 pb-20 text-center">
          <p className="text-sm md:text-base text-zinc-600 leading-relaxed">
            We provide educational content, updated know-how, professional resources, and action
            oriented training, specifically for the key areas of manufacturing: Plastic Injection
            Molds, Metal Pressure Die-casting Molds, and Sheet Metal Dies.
          </p>
        </section>

        {/* ── What We Offer ── */}
        <section className="bg-zinc-50 py-20 px-6">
          <div className="max-w-7xl mx-auto">
            {/* Row 1: big heading + first 2 cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="flex items-center">
                <h2 className="text-5xl md:text-7xl font-black text-primary uppercase leading-none">
                  What
                  <br />
                  We
                  <br />
                  Offer
                </h2>
              </div>
              {offerCards.slice(0, 2).map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.title}
                    className="bg-white rounded-xl border border-zinc-100 p-6 flex flex-col gap-3"
                  >
                    <Icon size={36} className="text-primary" strokeWidth={1.5} />
                    <h3 className="text-sm font-bold text-primary leading-snug">{card.title}</h3>
                    <p className="text-xs text-zinc-500 leading-relaxed">{card.desc}</p>
                  </div>
                );
              })}
            </div>

            {/* Row 2: last 3 cards full-width */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {offerCards.slice(2).map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.title}
                    className="bg-white rounded-xl border border-zinc-100 p-6 flex flex-col gap-3"
                  >
                    <Icon size={36} className="text-primary" strokeWidth={1.5} />
                    <h3 className="text-sm font-bold text-primary leading-snug">{card.title}</h3>
                    <p className="text-xs text-zinc-500 leading-relaxed">{card.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Accordion ── */}
        <section className="max-w-4xl mx-auto px-6 py-20">
          <HomeAccordion />
        </section>

        {/* ── Join Community ── */}
        <section className="bg-zinc-50 py-20 px-6 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900">Join our Community</h2>
            <p className="mt-4 text-sm text-zinc-500 leading-relaxed">
              Sign up today for exclusive access to new blog posts those mentioning the tooling
              industry updates, downloadable files, upcoming events, and tooling industry suppliers.
              Stay informed, stay ahead.
            </p>
            <Button
              asChild
              className="mt-8 px-12 py-3 h-auto rounded-full text-sm font-semibold tracking-widest uppercase hover:opacity-90 cursor-pointer"
            >
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
