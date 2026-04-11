const SEP = (
  <span className="text-haru-accent mx-4 shrink-0" aria-hidden>
    {"///"}
  </span>
);

const items = [
  "NEW DROP — HARU SS25",
  "50% OFF COCKTAIL DRESSES",
  "FREE SHIPPING OVER $60",
  "MEMBERS GET EARLY ACCESS",
];

const AnnouncementTicker: React.FC = () => {
  const segment = (
    <>
      {items.map((text, i) => (
        <span key={i} className="inline-flex items-center shrink-0">
          {i > 0 && SEP}
          <span>{text}</span>
        </span>
      ))}
    </>
  );

  return (
    <div
      className="w-full overflow-hidden bg-haru-text text-white"
      style={{ height: 36 }}
      role="marquee"
      aria-live="off"
    >
      <div className="haru-ticker-track h-9 items-center whitespace-nowrap px-4 font-mono text-[11px] font-normal uppercase tracking-[0.12em]">
        {segment}
        {SEP}
        {segment}
      </div>
    </div>
  );
};

export default AnnouncementTicker;
