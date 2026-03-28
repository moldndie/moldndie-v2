import type { Metadata } from "next"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Learn how MoldNDie collects, uses, and protects your personal data.",
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
          <h1 className="text-3xl font-extrabold text-zinc-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-zinc-400 mb-10">Last updated: March 2026</p>

          <div className="space-y-10 text-zinc-700 leading-relaxed">
            <section>
              <h2 className="text-lg font-bold text-zinc-900 mb-3">1. Information We Collect</h2>
              <p className="mb-3">
                When you create an account or interact with MoldNDie, we may collect the following information:
              </p>
              <ul className="space-y-2 list-disc list-inside text-zinc-600">
                <li><strong className="text-zinc-800">Account data</strong> — name, email address, and password (stored securely via Supabase Auth).</li>
                <li><strong className="text-zinc-800">Usage data</strong> — pages visited, content downloaded, courses enrolled.</li>
                <li><strong className="text-zinc-800">Payment data</strong> — order totals and status. Card details are handled exclusively by our payment processor (Paymob) and are never stored on our servers.</li>
                <li><strong className="text-zinc-800">Communications</strong> — messages or support requests you send to us.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-zinc-900 mb-3">2. How We Use Your Information</h2>
              <ul className="space-y-2 list-disc list-inside text-zinc-600">
                <li>To provide and improve the MoldNDie platform.</li>
                <li>To process purchases and grant access to paid content.</li>
                <li>To send account-related notifications (e.g. purchase receipts).</li>
                <li>To ensure security and prevent fraudulent activity.</li>
              </ul>
              <p className="mt-3">We do not sell your personal data to third parties.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-zinc-900 mb-3">3. Cookies</h2>
              <p className="mb-3">
                MoldNDie uses cookies and similar technologies to maintain your session and remember preferences.
                These are essential cookies required for the platform to function. We do not use third-party
                advertising cookies.
              </p>
              <p>
                You can disable cookies in your browser settings, but some features of the platform may not work
                correctly without them.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-zinc-900 mb-3">4. Data Storage & Security</h2>
              <p>
                Your data is stored on secure servers via Supabase with row-level security (RLS) policies in place.
                We use industry-standard encryption (TLS) for data in transit. We retain your data for as long as
                your account is active, or as required by law.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-zinc-900 mb-3">5. Third-Party Services</h2>
              <p className="mb-3">We work with the following third-party services:</p>
              <ul className="space-y-2 list-disc list-inside text-zinc-600">
                <li><strong className="text-zinc-800">Supabase</strong> — authentication and database.</li>
                <li><strong className="text-zinc-800">Cloudflare R2</strong> — file and image storage.</li>
                <li><strong className="text-zinc-800">Paymob</strong> — payment processing.</li>
              </ul>
              <p className="mt-3">Each service operates under its own privacy policy.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-zinc-900 mb-3">6. Your Rights</h2>
              <p className="mb-3">You have the right to:</p>
              <ul className="space-y-2 list-disc list-inside text-zinc-600">
                <li>Access the personal data we hold about you.</li>
                <li>Request correction or deletion of your data.</li>
                <li>Withdraw consent for data processing at any time.</li>
              </ul>
              <p className="mt-3">
                To exercise these rights, contact us at{" "}
                <a href="mailto:mold.n.diee@gmail.com" className="text-primary hover:underline font-medium">
                  mold.n.diee@gmail.com
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-zinc-900 mb-3">7. Contact</h2>
              <p>
                If you have questions about this Privacy Policy, please reach out at{" "}
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
