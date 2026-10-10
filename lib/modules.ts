// The public modules, in nav order. One list for the navbar, mobile menu,
// footer and the dashboard toggles (Site Content → Modules).
// `locked` modules can never be switched off.

export interface SiteModule {
  key: string
  label: string
  href: string
  locked?: boolean
}

export const MODULES: SiteModule[] = [
  { key: "blog",      label: "Blog",        href: "/blogs", locked: true },
  { key: "molds",     label: "Library",     href: "/molds" },
  { key: "courses",   label: "Academy",     href: "/courses" },
  { key: "events",    label: "Events",      href: "/events" },
  { key: "suppliers", label: "Suppliers",   href: "/suppliers" },
  { key: "tools",     label: "Engineering", href: "/tools" },
  { key: "services",  label: "Services",    href: "/services" },
]

/** Parses the `disabled_modules` site setting ("events,suppliers"). Unknown and locked keys are dropped. */
export function parseDisabled(value?: string | null): string[] {
  const asked = (value ?? "").split(",").map((k) => k.trim())
  return MODULES.filter((m) => !m.locked && asked.includes(m.key)).map((m) => m.key)
}

export function enabledModules(disabled: string[]): SiteModule[] {
  return MODULES.filter((m) => !disabled.includes(m.key))
}

/** False when `href` is, or sits under, a disabled module's route. */
export function isHrefEnabled(href: string, disabled: string[]): boolean {
  const path = href.split(/[?#]/)[0]
  return !MODULES.some(
    (m) => disabled.includes(m.key) && (path === m.href || path.startsWith(m.href + "/"))
  )
}
