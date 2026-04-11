const stats = [
  { value: "50%", label: "Off new drops" },
  { value: "142", label: "New styles added" },
  { value: "Free", label: "Returns always" },
  { value: "48hr", label: "Express delivery" },
];

const StatsStrip: React.FC = () => {
  return (
    <section className="border-y border-haru-border bg-white">
      <div className="app-max-width app-x-padding">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`flex flex-col items-center justify-center gap-1 border-haru-border py-6 text-center md:py-8 ${
                i % 2 === 0 ? "border-r" : ""
              } ${i < 2 ? "border-b md:border-b-0" : ""} ${
                i < 3 ? "md:border-r md:border-b-0" : ""
              }`}
            >
              <span className="font-display text-[22px] font-extrabold text-haru-accent">
                {s.value}
              </span>
              <span className="font-sans text-[11px] font-normal uppercase tracking-wide text-haru-muted">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsStrip;
