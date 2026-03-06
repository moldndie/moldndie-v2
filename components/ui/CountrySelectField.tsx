"use client";

import Select, { type SingleValue, type StylesConfig } from "react-select";
import { countries, getFlagUrl, type Country } from "@/lib/countries";

type Option = {
  value: string;
  label: string;
  country: Country;
};

const options: Option[] = countries.map((c) => ({
  value: c.code,
  label: c.name,
  country: c,
}));

const styles: StylesConfig<Option, false> = {
  control: (base, state) => ({
    ...base,
    minHeight: "38px",
    borderRadius: "0.5rem",
    borderColor: state.isFocused ? "#71717a" : "#d4d4d8",
    boxShadow: state.isFocused ? "0 0 0 1px #71717a" : "none",
    "&:hover": { borderColor: "#71717a" },
    fontSize: "0.875rem",
    cursor: "pointer",
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "#f4f4f5"
      : state.isFocused
      ? "#fafafa"
      : "#fff",
    color: "#18181b",
    cursor: "pointer",
    fontSize: "0.875rem",
    padding: "8px 12px",
  }),
  menu: (base) => ({
    ...base,
    borderRadius: "0.5rem",
    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
    border: "1px solid #e4e4e7",
    overflow: "hidden",
  }),
  menuList: (base) => ({
    ...base,
    padding: "4px 0",
    maxHeight: "220px",
  }),
  placeholder: (base) => ({
    ...base,
    color: "#a1a1aa",
  }),
  singleValue: (base) => ({
    ...base,
    color: "#18181b",
  }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (base) => ({
    ...base,
    color: "#a1a1aa",
    padding: "0 8px",
  }),
};

function FlagOption({ country }: { country: Country }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <span
        style={{
          display: "inline-block",
          width: "20px",
          height: "20px",
          borderRadius: "50%",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <img
          src={getFlagUrl(country.code)}
          alt={country.name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </span>
      <span>{country.name}</span>
    </div>
  );
}

type Props = {
  name: string;
  value: string;
  onChange: (country: Country | null) => void;
  placeholder?: string;
};

export default function CountrySelectField({
  name,
  value,
  onChange,
  placeholder = "Select your country",
}: Props) {
  const selected = options.find((o) => o.value === value) ?? null;

  function handleChange(option: SingleValue<Option>) {
    onChange(option ? option.country : null);
  }

  return (
    <>
      <input type="hidden" name={name} value={value} />
      <Select<Option, false>
        options={options}
        value={selected}
        onChange={handleChange}
        placeholder={placeholder}
        styles={styles}
        isSearchable
        formatOptionLabel={(o) => <FlagOption country={o.country} />}
        instanceId={name}
      />
    </>
  );
}
