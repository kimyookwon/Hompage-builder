'use client';

interface ColorTokenPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function ColorTokenPicker({ label, value, onChange }: ColorTokenPickerProps) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium w-32 shrink-0">{label}</label>
      <div className="flex items-center gap-2 flex-1">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded-md border cursor-pointer p-0.5"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="flex-1 border rounded-md px-3 py-2 text-sm font-mono bg-background"
          pattern="^#[0-9A-Fa-f]{6}$"
        />
      </div>
    </div>
  );
}
