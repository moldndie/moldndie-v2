import type { Metadata } from "next"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Read the terms and conditions governing your use of the MoldNDie platform.",
}

export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
          <h1 className="text-3xl font-extrabold text-zinc-900 mb-2">Terms of Use</h1>
          <p className="text-sm text-zinc-400 mb-10">Last updated: March 2026</p>

          <div className="space-y-10 text-zinc-700 leading-relaxed">
            <section>
              <h2 className="text-lg font-bold text-zinc-900 mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing or using MoldNDie (the &quot;Platform&quot;), you agree to be bound by these Terms of
                Use. If you do not agree, you must not use the Platform.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-zinc-900 mb-3">2. Eligibility</h2>
              <p>
                You must be at least 18 years old to create an account and purchase content on MoldNDie. By
                registering, you confirm that you meet this requirement.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-zinc-900 mb-3">3. Permitted Use</h2>
              <p className="mb-3">You may use the Platform to:</p>
              <ul className="space-y-2 list-disc list-inside text-zinc-600">
                <li>Browse, download, and reference files in the Mold Library for personal or professional use.</li>
                <li>Enroll in and complete courses for educational purposes.</li>
                <li>Read and share blog content with attribution.</li>
              </ul>
              <p className="mt-3">You may not redistribute, resell, or sublicense any paid content obtained through MoldNDie.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-zinc-900 mb-3">4. Purchases & Payment</h2>
              <p className="mb-3">
                All purchases are processed through Paymob. Prices are displayed in the local currency at checkout.
                By completing a purchase, you authorize MoldNDie to charge the stated amount.
              </p>
              <p>
                You will receive a confirmation email upon successful payment. Access to purchased content is
                granted immediately after payment is confirmed.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-zinc-900 mb-3">5. Replacement, Cancellation, and Refund Policy</h2>
              <p className="mb-6">
                At moldndie.com, we strive to provide world-class training materials. Because our offerings are
                digital content, the following terms apply:
              </p>

              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-semibold text-zinc-800 mb-2">
                    5.1 Library and Academy Materials
                  </h3>
                  <p className="text-sm text-zinc-500 italic mb-3">
                    (for example, 3D Files, PDFs, Video Courses, etc.)
                  </p>
                  <p className="mb-3">
                    Due to the nature of digital content, all sales of downloadable files and video access are final.
                  </p>
                  <ul className="space-y-3 list-none">
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 text-primary font-bold shrink-0">•</span>
                      <span>
                        <strong className="text-zinc-900">No Replacement or Refunds:</strong> Once a file is
                        downloaded or a video is accessed, we cannot &ldquo;reclaim&rdquo; the product; therefore,
                        we do not offer either replacements or refunds.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 text-primary font-bold shrink-0">•</span>
                      <span>
                        <strong className="text-zinc-900">File Integrity:</strong> If you experience technical
                        issues or a corrupted file, please contact us within{" "}
                        <strong>7 days of purchase</strong>. We will ensure you receive a functional replacement
                        immediately.
                      </span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-zinc-800 mb-3">
                    5.2 How to Request a Refund or Support
                  </h3>
                  <p className="mb-3">
                    To initiate a discussion regarding a service refund or a technical issue with a download, please
                    follow these steps:
                  </p>
                  <ul className="space-y-3 list-none">
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 text-primary font-bold shrink-0">*</span>
                      <span>
                        <strong className="text-zinc-900">Email:</strong>{" "}
                        <a href="mailto:moldndie.eg@gmail.com" className="text-primary hover:underline font-medium">
                          moldndie.eg@gmail.com
                        </a>
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 text-primary font-bold shrink-0">*</span>
                      <span>
                        <strong className="text-zinc-900">Subject Line:</strong> Refund Request &mdash; [Your Order
                        Number/Project Name]
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 text-primary font-bold shrink-0">*</span>
                      <span>
                        <strong className="text-zinc-900">Details:</strong> Please include a brief description of
                        why you are seeking a refund or the specific technical issue you are facing.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 text-primary font-bold shrink-0">*</span>
                      <span>
                        <strong className="text-zinc-900">Note:</strong> Refunds will be processed via the original
                        payment method (Bank Transfer, Credit Card, Instapay, etc.) within{" "}
                        <strong>14 business days</strong> of approval through our payment gateway (Paymob).
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-zinc-900 mb-3">6. User-Generated Content</h2>
              <p>
                Content uploaded by users (files, comments, etc.) remains the intellectual property of the
                original creator. By uploading content, you grant MoldNDie a non-exclusive license to host and
                display that content on the Platform. MoldNDie does not claim ownership of user-uploaded materials.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-zinc-900 mb-3">7. Prohibited Conduct</h2>
              <ul className="space-y-2 list-disc list-inside text-zinc-600">
                <li>Uploading content that infringes third-party intellectual property rights.</li>
                <li>Attempting to reverse-engineer, scrape, or reproduce the Platform.</li>
                <li>Using the Platform for illegal or fraudulent purposes.</li>
                <li>Creating multiple accounts to circumvent access restrictions.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-zinc-900 mb-3">8. Disclaimer</h2>
              <p>
                All digital content on MoldNDie is created and uploaded by third-party users. MoldNDie does not
                guarantee the accuracy, completeness, or fitness for a particular purpose of any file or material.
                Use all content at your own professional discretion.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-zinc-900 mb-3">9. Changes to These Terms</h2>
              <p>
                MoldNDie reserves the right to update these Terms at any time. Continued use of the Platform after
                changes are posted constitutes your acceptance of the revised Terms.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-zinc-900 mb-3">10. Contact</h2>
              <p>
                For any questions regarding these Terms, contact us at{" "}
                <a href="mailto:moldndie.eg@gmail.com" className="text-primary hover:underline font-medium">
                  moldndie.eg@gmail.com
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
