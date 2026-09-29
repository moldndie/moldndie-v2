"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { countries, getFlagUrl, type Country } from "@/lib/countries";

type Props = {
  name: string;
  value: string;
  onChange: (country: Country) => void;
  placeholder?: string;
};

export default function CountrySelect({
  name,
  value,
  onChange,
  placeholder = "Select country",
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = countries.find((c) => c.code === value);

  const filtered = countries.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(country: Country) {
    onChange(country);
    setOpen(false);
    setSearch("");
  }

  return (
    <div ref={containerRef} className="relative">
      <input type="hidden" name={name} value={value} />

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 h-9 rounded-lg border border-input bg-white px-3 text-sm outline-none transition-colors focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20"
      >
        {selected ? (
          <>
            <span className="inline-block h-5 w-5 shrink-0 overflow-hidden rounded-full">
              <img
                src={getFlagUrl(selected.code)}
                alt={selected.name}
                className="h-full w-full object-cover"
              />
            </span>
            <span className="flex-1 text-left text-zinc-900">{selected.name}</span>
          </>
        ) : (
          <span className="flex-1 text-left text-zinc-400">{placeholder}</span>
        )}
        <ChevronDown
          size={15}
          className={`shrink-0 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-input bg-white shadow-lg">
          <div className="flex items-center gap-2 border-b border-zinc-100 px-3 py-2">
            <Search size={14} className="shrink-0 text-zinc-400" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country..."
              className="flex-1 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none"
            />
            {search && (
              <button type="button" onClick={() => setSearch("")}>
                <X size={14} className="text-zinc-400 hover:text-zinc-600" />
              </button>
            )}
          </div>

          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-zinc-400">No countries found</li>
            ) : (
              filtered.map((country) => (
                <li key={country.code}>
                  <button
                    type="button"
                    onClick={() => handleSelect(country)}
                    className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors [@media(hover:hover)]:hover:bg-primary [@media(hover:hover)]:hover:text-primary-foreground ${
                      value === country.code ? "bg-primary font-medium text-primary-foreground" : "text-zinc-700"
                    }`}
                  >
                    <span className="inline-block h-5 w-5 shrink-0 overflow-hidden rounded-full">
                      <img
                        src={getFlagUrl(country.code)}
                        alt={country.name}
                        className="h-full w-full object-cover"
                      />
                    </span>
                    <span className="flex-1 text-left">{country.name}</span>
                    <span className="text-xs opacity-60">{country.dialCode}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
