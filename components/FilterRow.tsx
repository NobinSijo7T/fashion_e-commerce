import { useCallback } from "react";

export const FILTER_CATEGORIES = [
  "All",
  "Dresses",
  "Tops",
  "Bottoms",
  "Outerwear",
  "Bags",
] as const;

export type FilterCategory = (typeof FILTER_CATEGORIES)[number];

type Props = {
  active: FilterCategory;
  onChange: (cat: FilterCategory) => void;
};

const FilterRow: React.FC<Props> = ({ active, onChange }) => {
  const handleKey = useCallback(
    (e: React.KeyboardEvent, cat: FilterCategory) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onChange(cat);
      }
    },
    [onChange]
  );

  return (
    <div className="mb-8 w-full overflow-x-auto haru-scrollbar-none">
      <div className="flex w-max min-w-full gap-2 pb-1">
        {FILTER_CATEGORIES.map((cat) => {
          const isActive = active === cat;
          return (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(cat)}
              onKeyDown={(e) => handleKey(e, cat)}
              className={`shrink-0 rounded-full border px-4 py-1.5 font-mono text-[11px] font-medium uppercase tracking-wide transition-colors ${
                isActive
                  ? "border-transparent bg-haru-accent text-white"
                  : "border-haru-border bg-transparent text-haru-muted hover:border-haru-text hover:text-haru-text"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FilterRow;
