import type { Metadata } from "next"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about MoldNDie — the platform for mold designers, engineers, and manufacturing professionals.",
}

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
          <h1 className="text-3xl font-extrabold text-zinc-900 mb-2">About MoldNDie</h1>
          <p className="text-sm text-zinc-400 mb-10">Your platform for mold design and manufacturing knowledge</p>

          <div className="space-y-10 text-zinc-700 leading-relaxed">
            <section>
              <h2 className="text-lg font-bold text-zinc-900 mb-3">Who We Are</h2>
              <p>
                MoldNDie is a specialized platform built for mold designers, tooling engineers, and manufacturing
                professionals. We bring together a library of mold files, expert-led courses, industry news, and a
                community of suppliers — all in one place.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-zinc-900 mb-3">What You Can Do Here</h2>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <span className="mt-1 shrink-0 w-1.5 h-1.5 rounded-full bg-primary" />
                  <span><strong className="text-zinc-900">Mold Library</strong> — Browse and download 2D drawings, 3D CAD files, and PDF references created by engineers worldwide.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 shrink-0 w-1.5 h-1.5 rounded-full bg-primary" />
                  <span><strong className="text-zinc-900">Academy</strong> — Enroll in courses on mold design, manufacturing processes, and tooling best practices.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 shrink-0 w-1.5 h-1.5 rounded-full bg-primary" />
                  <span><strong className="text-zinc-900">Blog</strong> — Stay up to date with articles, guides, and insights from the mold and die industry.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 shrink-0 w-1.5 h-1.5 rounded-full bg-primary" />
                  <span><strong className="text-zinc-900">Events</strong> — Discover trade shows, exhibitions, and industry conferences relevant to manufacturing.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 shrink-0 w-1.5 h-1.5 rounded-full bg-primary" />
                  <span><strong className="text-zinc-900">Suppliers</strong> — Find verified material suppliers, toolmakers, and equipment vendors.</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-zinc-900 mb-3">Our Mission</h2>
              <p>
                We believe that quality engineering knowledge should be accessible. MoldNDie exists to reduce friction
                for professionals who need reliable references, structured learning, and a trusted network — without
                sorting through scattered sources or generic content.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-zinc-900 mb-3">Get in Touch</h2>
              <p>
                Have questions or want to collaborate? Reach us at{" "}
                <a href="mailto:mold.n.diee@gmail.com" className="text-primary hover:underline font-medium">
                  mold.n.diee@gmail.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
