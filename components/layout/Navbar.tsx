import Link from "next/link";
import Image from "next/image";
import NavbarUserMenu from "@/components/layout/NavbarUserMenu";
import NavbarMobileMenu from "@/components/layout/NavbarMobileMenu";
import NavbarLinks from "@/components/layout/NavbarLinks";
import { CurrencySelector } from "@/components/layout/CurrencySelector";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center shrink-0">
          <Image src="/assets/logo-black-updated.png" alt="Mold N Die" width={120} height={40} className="h-10 w-auto" />
        </Link>

        {/* Desktop nav links */}
        <NavbarLinks />

        {/* Right side: currency + mobile menu + auth */}
        <div className="flex items-center gap-2">
          <CurrencySelector />
          <NavbarMobileMenu />
          <NavbarUserMenu />
        </div>
      </div>
    </header>
  );
}
