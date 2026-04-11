import Image from "next/image";
import Link from "next/link";

type Highlight = {
  name: string;
  price: number;
  href: string;
};

type Props = {
  highlight?: Highlight | null;
};

const HeroBanner: React.FC<Props> = ({ highlight }) => {
  return (
    <section className="relative w-full overflow-hidden bg-white">
      <div className="grid min-h-[480px] grid-cols-1 lg:grid-cols-2 lg:min-h-[560px]">
        {/* Left */}
        <div className="relative z-10 flex flex-col justify-center px-6 py-14 sm:px-10 lg:px-14 xl:px-20">
          <div className="mb-6 flex items-center gap-3">
            <span
              className="h-px w-8 bg-haru-accent"
              aria-hidden
            />
            <span className="font-mono text-[11px] font-normal uppercase tracking-[0.12em] text-haru-accent">
              SS25 Collection
            </span>
          </div>

          <h1 className="font-display text-[clamp(2.25rem,6vw,4.25rem)] font-extrabold uppercase leading-[0.92] tracking-tight">
            <span className="text-haru-text">Street</span>{" "}
            <span
              className="text-transparent"
              style={{
                WebkitTextStroke: "1.5px #0D0D0D",
              }}
            >
              Culture
            </span>{" "}
            <span className="text-haru-accent">Energy</span>
          </h1>

          <p className="mt-5 max-w-[300px] font-sans text-[13px] font-normal leading-relaxed text-haru-muted">
            Limited runs, loud silhouettes, and drops that move fast. Built for
            the scroll generation.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/product-category/new-arrivals"
              className="inline-flex items-center justify-center rounded-full bg-haru-accent px-7 py-2.5 font-sans text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Shop Now
            </Link>
            <Link
              href="/product-category/women"
              className="inline-flex items-center justify-center rounded-full border border-haru-border bg-transparent px-7 py-2.5 font-sans text-sm font-medium text-haru-text transition-colors hover:border-haru-text"
            >
              View all drops
            </Link>
          </div>

          {highlight && (
            <Link
              href={highlight.href}
              className="mt-10 max-w-sm rounded-xl border border-haru-border bg-white p-4 transition-colors hover:border-haru-accent"
            >
              <p className="font-mono text-[10px] font-medium uppercase tracking-wide text-haru-muted">
                Limited Drop
              </p>
              <p className="mt-1 font-display text-base font-bold text-haru-text">
                {highlight.name}
              </p>
              <p className="mt-1 font-display text-lg font-bold text-haru-accent">
                ${highlight.price.toFixed(2)}
              </p>
            </Link>
          )}
        </div>

        {/* Right */}
        <div className="relative flex min-h-[360px] items-center justify-center bg-haru-surface lg:min-h-0">
          <span
            className="pointer-events-none absolute inset-0 flex select-none items-center justify-center font-display text-[clamp(4rem,18vw,12rem)] font-extrabold uppercase leading-none text-haru-watermark"
            aria-hidden
          >
            HARU
          </span>

          <span className="absolute right-6 top-6 z-20 rounded-full bg-haru-accent px-4 py-1.5 font-mono text-[11px] font-medium uppercase tracking-wide text-white">
            50% OFF
          </span>

          <div className="relative z-10 w-[72%] max-w-md px-4">
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-haru-card">
              <Image
                src="/bg-img/curly_hair_girl-1.jpg"
                alt="HARU SS25 highlight"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 90vw, 28rem"
                priority
              />
            </div>
          </div>

          <div className="absolute bottom-6 left-6 z-20 rounded-lg border border-haru-border bg-white px-4 py-3 shadow-none">
            <p className="font-sans text-[13px] font-medium text-haru-accent">
              1.2k saved this week
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
