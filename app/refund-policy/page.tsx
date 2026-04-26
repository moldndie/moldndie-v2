import type { Metadata } from "next"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"

export const metadata: Metadata = {
  title: "Refund & Replacement Policy | MoldNDie",
  description:
    "Understand MoldNDie's replacement, cancellation, and refund policy for digital content.",
}

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
          <h1 className="text-3xl font-extrabold text-zinc-900 mb-2">
            Replacement, Cancellation, and Refund Policy
          </h1>
          <p className="text-sm text-zinc-400 mb-10">Last updated: April 2026</p>

          <div className="space-y-10 text-zinc-700 leading-relaxed">
            <p>
              At moldndie.com, we strive to provide world-class training materials. Because our
              offerings are digital content, the following terms apply:
            </p>

            <section>
              <h2 className="text-lg font-bold text-zinc-900 mb-4">
                1. LIBRARY and ACADEMY Pages Materials
              </h2>
              <p className="mb-3 text-sm text-zinc-500 italic">
                (for example, 3D Files, PDFs, Video Courses, etc.)
              </p>
              <p className="mb-4">
                Due to the nature of digital content, all sales of downloadable files and video
                access are final.
              </p>
              <ul className="space-y-4 list-none">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-primary font-bold shrink-0">•</span>
                  <span>
                    <strong className="text-zinc-900">No Replacement or Refunds:</strong> Once a
                    file is downloaded or a video is accessed, we cannot &ldquo;reclaim&rdquo; the
                    product; therefore, we do not offer either replacements or refunds.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-primary font-bold shrink-0">•</span>
                  <span>
                    <strong className="text-zinc-900">File Integrity:</strong> If you experience
                    technical issues or a file corrupted, please contact us within{" "}
                    <strong>7 days of purchase</strong>. We will ensure you receive a functional
                    replacement immediately.
                  </span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-zinc-900 mb-4">
                2. How to Request a Refund or Support
              </h2>
              <p className="mb-4">
                To initiate a discussion regarding a service refund or a technical issue with a
                download, please follow these steps:
              </p>
              <ul className="space-y-3 list-none">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-primary font-bold shrink-0">*</span>
                  <span>
                    <strong className="text-zinc-900">Email:</strong>{" "}
                    <a
                      href="mailto:moldndie.eg@gmail.com"
                      className="text-primary hover:underline"
                    >
                      moldndie.eg@gmail.com
                    </a>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-primary font-bold shrink-0">*</span>
                  <span>
                    <strong className="text-zinc-900">Subject Line:</strong> Refund Request
                    &mdash; [Your Order Number/Project Name]
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-primary font-bold shrink-0">*</span>
                  <span>
                    <strong className="text-zinc-900">Details:</strong> Please include a brief
                    description of why you are seeking a refund or the specific technical issue you
                    are facing.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-primary font-bold shrink-0">*</span>
                  <span>
                    <strong className="text-zinc-900">Note:</strong> Refunds will be processed via
                    the original payment method (Bank Transfer, Credit Card, Instapay, etc.) within{" "}
                    <strong>14 business days</strong> of approval through our payment gateway
                    (Paymob).
                  </span>
                </li>
              </ul>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
