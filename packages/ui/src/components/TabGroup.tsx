export interface TabGroupOption {
  key: string;
  label: string;
}

export interface TabGroupProps {
  options: TabGroupOption[];
  value: string;
  onChange: (key: string) => void;
  className?: string;
}

// The pill-style segmented filter used across order/listing status tabs.
export function TabGroup({ options, value, onChange, className = '' }: TabGroupProps) {
  return (
    <div className={`flex flex-wrap gap-2 text-xs ${className}`}>
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          className={`cursor-pointer whitespace-nowrap rounded-full border-0 px-3.5 py-1.5 ${
            value === o.key ? 'bg-accent text-bg' : 'bg-neutral-200 text-neutral-800'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
