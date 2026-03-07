"use client";

import PhoneInput from "react-phone-number-input";
import type { Country } from "react-phone-number-input";
import "react-phone-number-input/style.css";

type Props = {
  value: string;
  onChange: (value: string) => void;
  defaultCountry?: Country;
};

export default function PhoneInputField({ value, onChange, defaultCountry = "EG" }: Props) {
  return (
    <div className="phone-input-wrapper">
      <PhoneInput
        value={value}
        onChange={(v) => onChange(v ?? "")}
        defaultCountry={defaultCountry}
        international
        countryCallingCodeEditable={false}
        placeholder="Enter phone number"
      />
    </div>
  );
}
