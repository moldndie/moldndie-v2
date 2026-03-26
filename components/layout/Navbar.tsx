import Link from "next/link";
import NavbarUserMenu from "@/components/layout/NavbarUserMenu";

const navLinks = ["Blogs", "Library", "Events", "Suppliers", "Services"];

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
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <LogoIcon />
          <span className="font-bold text-sm tracking-widest text-zinc-900">MOLD N DIE</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link}
              href={`/${link.toLowerCase()}`}
              className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              {link}
            </Link>
          ))}
        </nav>

        {/* Auth */}
        <NavbarUserMenu />
      </div>
    </header>
  );
}
