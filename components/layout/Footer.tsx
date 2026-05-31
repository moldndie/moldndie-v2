import Link from "next/link"
import Image from "next/image"
import { Phone, Mail, MapPin, Clock, MessageCircle, Youtube, Facebook, Instagram, Linkedin } from "lucide-react"
import { getSiteSettings } from "@/services/siteSettings.service"
import type { SiteSettings } from "@/services/siteSettings.service"

const pages = [
  { label: "Blog",              href: "/blogs" },
  { label: "Library",           href: "/molds" },
  { label: "Academy",           href: "/courses" },
  { label: "Events",            href: "/events" },
  { label: "Suppliers",         href: "/suppliers" },
  { label: "Engineering",       href: "/tools" },
  { label: "Services",          href: "/services" },
]

const company = [
  { label: "About Us",       href: "/about" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms of Use",   href: "/terms-of-use" },
]

function PinterestIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
    </svg>
  )
}

function ContactRow({
  href,
  icon: Icon,
  children,
  newTab,
}: {
  href?: string
  icon: React.ElementType
  children: React.ReactNode
  newTab?: boolean
}) {
  const inner = (
    <>
      <Icon size={14} className="mt-0.5 shrink-0 text-white/40 group-hover:text-white/70 transition-colors" />
      <span className="leading-snug">{children}</span>
    </>
  )

  if (href) {
    return (
      <a
        href={href}
        target={newTab ? "_blank" : undefined}
        rel={newTab ? "noopener noreferrer" : undefined}
        className="flex items-start gap-2.5 text-sm text-white/70 hover:text-white transition-colors group"
      >
        {inner}
      </a>
    )
  }

  return (
    <div className="flex items-start gap-2.5 text-sm text-white/70">
      {inner}
    </div>
  )
}

export default async function Footer() {
  let settings: SiteSettings = {}
  try {
    settings = await getSiteSettings()
  } catch {
    // graceful degradation if CMS unavailable
  }

  const s = settings as Record<string, string>

  const socialLinks = [
    { icon: Linkedin,      href: s.social_linkedin,  label: "LinkedIn",  hoverClass: "hover:text-[#0A66C2]" },
    { icon: Facebook,      href: s.social_facebook,  label: "Facebook",  hoverClass: "hover:text-[#1877F2]" },
    { icon: Youtube,       href: s.social_youtube,   label: "YouTube",   hoverClass: "hover:text-[#FF0000]" },
    { icon: PinterestIcon, href: s.social_pinterest, label: "Pinterest", hoverClass: "hover:text-[#BD081C]" },
    { icon: Instagram,     href: s.social_instagram, label: "Instagram", hoverClass: "hover:text-pink-500" },
  ].filter((item) => item.href)

  const hasContact =
    s.contact_phone || s.contact_email || s.contact_address || s.contact_hours

  return (
    <footer className="bg-[#5C1515] text-white">
      <div className="max-w-7xl mx-auto px-6 py-14">

        {/* Main 4-col grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">

          {/* ── Col 1: Brand ── */}
          <div className="space-y-4 sm:col-span-2 lg:col-span-1">
            <Image
              src={s.logo_footer || "/assets/logo-white-updated.png"}
              alt="Mold N Die"
              width={130}
              height={44}
              className="h-11 w-auto"
              unoptimized={!!s.logo_footer}
            />
            {s.footer_tagline && (
              <p className="text-sm text-white/60 leading-relaxed max-w-55">
                {s.footer_tagline}
              </p>
            )}
          </div>

          {/* ── Col 2: Pages ── */}
          <div>
            <p className="text-xs font-semibold tracking-wider text-white/50 uppercase mb-4">Pages</p>
            <ul className="space-y-2.5">
              {pages.map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-white/75 hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Col 3: Company ── */}
          <div>
            <p className="text-xs font-semibold tracking-wider text-white/50 uppercase mb-4">Company</p>
            <ul className="space-y-2.5">
              {company.map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-white/75 hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Col 4: Contact Info ── */}
          <div>
            <p className="text-xs font-semibold tracking-wider text-white/50 uppercase mb-4">Contact Us</p>

            {hasContact ? (
              <div className="space-y-3">
                {s.contact_phone && (
                  <ContactRow icon={Phone} href={`tel:${s.contact_phone}`}>
                    {s.contact_phone}
                  </ContactRow>
                )}
                <ContactRow
                  icon={MessageCircle}
                  href="https://wa.me/201120060658"
                  newTab
                >
                  WhatsApp
                </ContactRow>
                {s.contact_email && (
                  <ContactRow icon={Mail} href={`mailto:${s.contact_email}`}>
                    {s.contact_email}
                  </ContactRow>
                )}
                {s.contact_address && (
                  <ContactRow
                    icon={MapPin}
                    href={s.contact_maps_link || undefined}
                    newTab={!!s.contact_maps_link}
                  >
                    {s.contact_address}
                  </ContactRow>
                )}
                {s.contact_hours && (
                  <ContactRow icon={Clock}>
                    {s.contact_hours}
                  </ContactRow>
                )}
              </div>
            ) : (
              <p className="text-sm text-white/40 italic">Contact info coming soon.</p>
            )}

            {/* Social icons */}
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-3.5 mt-5">
                {socialLinks.map(({ icon: Icon, href, label, hoverClass }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-white/50 transition-colors ${hoverClass}`}
                  >
                    <Icon size={17} />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/15 pt-8">
          <p className="text-xs text-white/40 leading-relaxed max-w-4xl">
            Copyright © 2026 www.moldndie.com. All digital content on this website—including text, PDF files, MS Office
            documents, 2D Drawing files, 3D Computer-Aided Design (CAD) files, animations, simulations, photos, videos,
            and any other posted materials—is created, uploaded, managed, and owned by third party users. None of the
            digital content is sponsored by or affiliated with any company, organization, or real-world product, or
            service they may purport to portray.
          </p>
        </div>
      </div>
    </footer>
  )
}
