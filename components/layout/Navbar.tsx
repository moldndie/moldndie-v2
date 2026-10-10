import Link from "next/link";
import Image from "next/image";
import NavbarUserMenu from "@/components/layout/NavbarUserMenu";
import NavbarMobileMenu from "@/components/layout/NavbarMobileMenu";
import NavbarLinks from "@/components/layout/NavbarLinks";
import { CurrencySelector } from "@/components/layout/CurrencySelector";
import { getSiteSettings } from "@/services/siteSettings.service";
import { enabledModules, parseDisabled } from "@/lib/modules";

export default async function Navbar() {
  let navbarLogoSrc = "/assets/logo-black-updated.png";
  let disabled: string[] = [];
  try {
    const settings = await getSiteSettings();
    if (settings.logo_navbar) navbarLogoSrc = settings.logo_navbar;
    disabled = parseDisabled(settings.disabled_modules);
  } catch {
    // fall back to static asset
  }

  const links = enabledModules(disabled);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center shrink-0">
          <Image src={navbarLogoSrc} alt="Mold N Die" width={120} height={40} className="h-10 w-auto" unoptimized={navbarLogoSrc.startsWith("http")} />
        </Link>

        {/* Desktop nav links */}
        <NavbarLinks links={links} />

        {/* Right side: currency + mobile menu + auth */}
        <div className="flex items-center gap-2">
          <CurrencySelector />
          <NavbarMobileMenu links={links} />
          <NavbarUserMenu showMyCourses={!disabled.includes("courses")} />
        </div>
      </div>
    </header>
  );
}
