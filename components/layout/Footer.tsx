import Link from "next/link";
import { Youtube, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

const pages = ["Blog", "Library", "Events", "Suppliers", "Services"];
const company = ["About Us", "Terms of Use", "Privacy Policy"];
const socials = [
  { icon: Youtube, href: "#", label: "YouTube" },
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
];

function FooterLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="15" stroke="white" strokeWidth="2" fill="none" />
      <circle cx="16" cy="16" r="8" stroke="white" strokeWidth="1.5" fill="none" />
      <circle cx="16" cy="16" r="3" fill="white" />
      <line x1="16" y1="1" x2="16" y2="7" stroke="white" strokeWidth="1.5" />
      <line x1="16" y1="25" x2="16" y2="31" stroke="white" strokeWidth="1.5" />
      <line x1="1" y1="16" x2="7" y2="16" stroke="white" strokeWidth="1.5" />
      <line x1="25" y1="16" x2="31" y2="16" stroke="white" strokeWidth="1.5" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="bg-[#5C1515] text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Links grid */}
        <div className="flex gap-24 mb-12">
          <div>
            <p className="text-xs font-semibold tracking-wider text-white/60 uppercase mb-4">Pages</p>
            <ul className="space-y-2.5">
              {pages.map((page) => (
                <li key={page}>
                  <Link
                    href={`/${page.toLowerCase().replace(" ", "-")}`}
                    className="text-sm text-white/80 hover:text-white transition-colors"
                  >
                    {page}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wider text-white/60 uppercase mb-4">Company</p>
            <ul className="space-y-2.5">
              {company.map((item) => (
                <li key={item}>
                  <Link
                    href={`/${item.toLowerCase().replace(" ", "-")}`}
                    className="text-sm text-white/80 hover:text-white transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom row */}
        <div className="border-t border-white/20 pt-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <FooterLogo />
              <span className="font-bold text-sm tracking-widest">MOLD N DIE</span>
            </div>
            <div className="flex items-center gap-4">
              {socials.map(({ icon: Icon, href, label }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <Icon size={18} />
                </Link>
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
