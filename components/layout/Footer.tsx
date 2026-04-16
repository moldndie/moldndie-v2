import Link from "next/link";
import Image from "next/image";
import { Youtube, Facebook, Instagram } from "lucide-react";

const pages = [
  { label: "Blog",      href: "/blogs" },
  { label: "Library",   href: "/molds" },
  { label: "Events",    href: "/events" },
  { label: "Suppliers", href: "/suppliers" },
  { label: "Services",  href: "/services" },
];

const company = [
  { label: "About Us",        href: "/about" },
  { label: "Privacy Policy",  href: "/privacy-policy" },
  { label: "Terms of Use",    href: "/terms-of-use" },
];

// Pinterest doesn't have a lucide icon — using a minimal inline SVG
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
  );
}

const socials = [
  {
    icon: Facebook,
    href: "https://www.facebook.com/profile.php?id=61566861570946",
    label: "Facebook",
  },
  {
    icon: PinterestIcon,
    href: "https://pin.it/6mTZhYIcr",
    label: "Pinterest",
  },
  {
    icon: Youtube,
    href: "https://www.youtube.com/@MoldDie-u6d",
    label: "YouTube",
  },
  {
    icon: Instagram,
    href: "https://www.instagram.com/moldndie.eg/",
    label: "Instagram",
  },
];


export default function Footer() {
  return (
    <footer className="bg-[#5C1515] text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Links grid */}
        <div className="flex gap-24 mb-12">
          <div>
            <p className="text-xs font-semibold tracking-wider text-white/60 uppercase mb-4">Pages</p>
            <ul className="space-y-2.5">
              {pages.map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-white/80 hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wider text-white/60 uppercase mb-4">Company</p>
            <ul className="space-y-2.5">
              {company.map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-white/80 hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom row */}
        <div className="border-t border-white/20 pt-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Image src="/assets/logo-white.png" alt="Mold N Die" width={120} height={40} className="h-10 w-auto" />
            </div>
            <div className="flex items-center gap-4">
              {socials.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>
          <p className="text-xs text-white/50 leading-relaxed max-w-3xl">
            Copyright © 2026 www.moldndie.com. All digital content on this website—including text, PDF files, MS Office
            documents, 2D Drawing files, 3D Computer-Aided Design (CAD) files, animations, simulations, photos, videos,
            and any other posted materials—is created, uploaded, managed, and owned by third party users. None of the
            digital content is sponsored by or affiliated with any company, organization, or real-world product, or
            service they may purport to portray.
          </p>
        </div>
      </div>
    </footer>
  );
}
