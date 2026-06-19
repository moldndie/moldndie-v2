import { getSiteSettings } from "@/services/siteSettings.service"

export const metadata = { title: "Terms & Conditions" };

const sections = [
  {
    title: "1. Acceptance of Terms",
    body: "By accessing or using our platform, you agree to be bound by these Terms and Conditions. If you do not agree to all of these terms, you may not use our services. We reserve the right to update these terms at any time, and continued use of the platform constitutes acceptance of the revised terms.",
  },
  {
    title: "2. User Accounts",
    body: "You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate and complete information when registering. You agree to notify us immediately of any unauthorized use of your account.",
  },
  {
    title: "3. Use of the Platform",
    body: "You agree to use the platform only for lawful purposes. You must not use the platform in any way that causes, or may cause, damage to the platform or impairment of its availability. You must not use the platform to transmit any unsolicited or unauthorized advertising or promotional material.",
  },
  {
    title: "4. Intellectual Property",
    body: "All content on this platform, including but not limited to text, graphics, logos, and software, is the property of the company and is protected by applicable intellectual property laws. You may not reproduce, distribute, or create derivative works without explicit written permission.",
  },
  {
    title: "5. Privacy Policy",
    body: "Your use of the platform is also governed by our Privacy Policy. By using the platform, you consent to the collection and use of your information as described in the Privacy Policy. We are committed to protecting your personal data in accordance with applicable data protection laws.",
  },
  {
    title: "6. Limitation of Liability",
    body: "To the fullest extent permitted by law, the company shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of, or inability to use, the platform. Our total liability to you for any claim shall not exceed the amount paid by you for the service in the preceding twelve months.",
  },
  {
    title: "7. Termination",
    body: "We reserve the right to suspend or terminate your account at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users, us, third parties, or for any other reason. Upon termination, your right to use the platform will immediately cease.",
  },
  {
    title: "8. Governing Law",
    body: "These Terms shall be governed by and construed in accordance with applicable laws. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the competent courts. If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force.",
  },
];

export default async function TermsPage() {
  let contactEmail = "moldndie.eg@gmail.com"
  try {
    const settings = await getSiteSettings()
    if (settings.contact_email) contactEmail = settings.contact_email
  } catch {
    // graceful fallback
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-zinc-900">Terms &amp; Conditions</h1>
          <p className="mt-2 text-sm text-zinc-500">Last updated: March 2026</p>
          <p className="mt-4 text-sm text-zinc-600 leading-relaxed">
            Please read these Terms and Conditions carefully before using our platform. These terms
            govern your access to and use of our services.
          </p>
        </div>

        <div className="space-y-8">
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="text-base font-semibold text-zinc-900 mb-2">{section.title}</h2>
              <p className="text-sm text-zinc-600 leading-relaxed">{section.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-200">
          <p className="text-sm text-zinc-500">
            If you have any questions about these Terms &amp; Conditions, please contact us at{" "}
            <a href={`mailto:${contactEmail}`} className="text-[#7C2020] hover:underline">
              {contactEmail}
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
