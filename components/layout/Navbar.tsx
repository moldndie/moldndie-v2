import Link from "next/link";
import NavbarUserMenu from "@/components/layout/NavbarUserMenu";
import NavbarMobileMenu from "@/components/layout/NavbarMobileMenu";

const navLinks = [
  { label: "Blogs",     href: "/blogs" },
  { label: "Library",   href: "/molds" },
  { label: "Academy",   href: "/courses" },
  { label: "Events",    href: "/events" },
  { label: "Suppliers", href: "/suppliers" },
  { label: "Services",  href: "/services" },
];

function LogoIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="15" stroke="#7C2020" strokeWidth="2" fill="none" />
      <circle cx="16" cy="16" r="8" stroke="#7C2020" strokeWidth="1.5" fill="none" />
      <circle cx="16" cy="16" r="3" fill="#7C2020" />
      <line x1="16" y1="1" x2="16" y2="7" stroke="#7C2020" strokeWidth="1.5" />
      <line x1="16" y1="25" x2="16" y2="31" stroke="#7C2020" strokeWidth="1.5" />
      <line x1="1" y1="16" x2="7" y2="16" stroke="#7C2020" strokeWidth="1.5" />
      <line x1="25" y1="16" x2="31" y2="16" stroke="#7C2020" strokeWidth="1.5" />
    </svg>
  );
}

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <LogoIcon />
          <span className="font-bold text-sm tracking-widest text-zinc-900 hidden sm:inline">MOLD N DIE</span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side: mobile menu + auth */}
        <div className="flex items-center gap-1">
          <NavbarMobileMenu />
          <NavbarUserMenu />
        </div>
      </div>
    </header>
  );
}
