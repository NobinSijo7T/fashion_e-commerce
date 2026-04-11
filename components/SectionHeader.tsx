import Link from "next/link";

type Props = {
  title: string;
  seeAllHref?: string;
  seeAllLabel?: string;
};

const SectionHeader: React.FC<Props> = ({
  title,
  seeAllHref = "/product-category/new-arrivals",
  seeAllLabel = "See all",
}) => {
  return (
    <div className="mb-6 flex flex-row items-baseline justify-between gap-4">
      <h2 className="font-display text-[28px] font-extrabold uppercase leading-tight text-haru-text">
        {title}
      </h2>
      <Link
        href={seeAllHref}
        className="group inline-flex items-center gap-2 font-mono text-[11px] font-normal uppercase tracking-wide text-haru-category transition-colors hover:text-haru-accent"
      >
        <span>{seeAllLabel}</span>
        <span className="text-haru-category group-hover:text-haru-accent" aria-hidden>
          ——
        </span>
      </Link>
    </div>
  );
};

export default SectionHeader;
