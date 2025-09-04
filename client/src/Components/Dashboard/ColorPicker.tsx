import React from "react";

type Props = {
  value: string | undefined;
  onChange: (hex: string) => void;
  disabled?: boolean;
  size?: "sm" | "md";
  label?: string;
};

const PALETTE = ["#b0e0eb", "#cbecaf", "#baadec"];

const ColorPicker: React.FC<Props> = ({ value, onChange, disabled, size = "md", label }) => {
  const swatchSize = size === "sm" ? 18 : 22;

  return (
    <fieldset
      role="radiogroup"
      aria-label={label || "Choose color"}
      style={{
        display: "inline-flex",
        gap: 8,
        alignItems: "center",
        border: 'none',
        padding: 0,
        margin: 0,
        flexWrap: 'wrap'
      }}
    >
      {PALETTE.map((hex) => {
        const selected = value === hex;
        return (
          <button
            key={hex}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(selected ? '#ffffff' : hex)}
            title={hex}
            style={{
              width: swatchSize,
              height: swatchSize,
              borderRadius: 8,
              background: hex,
              border: 'none',
              boxShadow: selected ? "0 0 0 4px rgba(215,73,134,.18)" : 'none',
              cursor: disabled ? "not-allowed" : "pointer",
              transition: "transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onChange(selected ? '' : hex);
              }
            }}
          />
        );
      })}
    </fieldset>
  );
};

export default ColorPicker;