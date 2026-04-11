import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export type Testimonial = {
  id: string;
  logo: React.ReactNode;
  quote: string;
  name: string;
  role: string;
};

const BAR_COUNT = 7;
const BAR_WIDTH = 80;

function LogoNike() {
  return (
    <svg
      viewBox="0 0 80 32"
      className="mx-auto h-8 w-20 text-haru-text"
      fill="currentColor"
      aria-hidden
    >
      <path d="M62.43 2.14c-8.12 15.8-22.9 26.5-38.5 30.2-5.9 1.4-12.1 1.9-18.2 1.1-.8-.1-1.6-.3-2.3-.5 18.2-1.2 34.8-11.8 45.6-26.4 4.2-5.6 7.5-11.8 9.9-18.2 1.3 4.4 2.2 9 3.5 13.8z" />
    </svg>
  );
}

function LogoHarU() {
  return (
    <div className="text-center font-display text-2xl font-extrabold tracking-tight text-haru-text">
      HAR<span className="text-haru-accent">U</span>
    </div>
  );
}

function LogoBloom() {
  return (
    <svg viewBox="0 0 120 32" className="mx-auto h-8 w-28 text-haru-text" aria-hidden>
      <circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <path
        d="M32 8h56v3H32zm0 10h44v3H32zm0 10h52v3H32z"
        fill="currentColor"
      />
    </svg>
  );
}

function LogoNorth() {
  return (
    <div className="text-center font-dm text-xl font-extrabold uppercase tracking-[0.2em] text-haru-text">
      NORTH
    </div>
  );
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: "nike",
    logo: <LogoNike />,
    quote:
      "HARU rewired how we launch capsules — the drops feel urgent, the site feels alive, and our community actually shows up. Conversion on launch day doubled from our last season.",
    name: "Jane Dodson",
    role: "Marketing Director, Nike",
  },
  {
    id: "haru",
    logo: <LogoHarU />,
    quote:
      "Finally a storefront that matches our brand energy: fast, editorial, and built for mobile-first storytelling. The team shipped iterations in days, not weeks.",
    name: "Alex Rivera",
    role: "Creative Lead, HARU Studio",
  },
  {
    id: "bloom",
    logo: <LogoBloom />,
    quote:
      "Returns are smoother, wishlist behavior is clearer, and customers linger longer on PDPs. The monochrome product cards let photography shine — exactly what we needed.",
    name: "Sam Okonkwo",
    role: "E-commerce Manager, Bloom & Co.",
  },
  {
    id: "north",
    logo: <LogoNorth />,
    quote:
      "We tested three themes; this one stuck because it feels premium without feeling cold. Checkout friction dropped and repeat visits are noticeably up.",
    name: "Morgan Lee",
    role: "Founder, North Supply",
  },
];

function TestimonialCardFace({ item }: { item: Testimonial }) {
  return (
    <div className="relative flex min-h-[240px] flex-col border-0 border-r-[6px] border-solid border-haru-text bg-white py-8 pl-4 pr-6 sm:min-h-[260px] sm:py-10 sm:pl-6 sm:pr-8 md:min-h-[280px] md:pl-8 md:pr-12">
      <div className="mb-6 flex justify-center sm:mb-8">{item.logo}</div>
      <blockquote className="mb-8 flex-1 font-quote text-[1.15rem] italic leading-relaxed text-haru-text sm:mb-10 sm:text-[1.25rem] md:text-[1.3rem] md:leading-relaxed lg:text-[1.35rem]">
        &ldquo;{item.quote}&rdquo;
      </blockquote>
      <footer className="mt-auto text-left">
        <cite className="not-italic">
          <span className="block font-dm text-sm font-bold text-haru-text sm:text-base">
            {item.name}
          </span>
          <span className="mt-1 block font-dm text-xs font-normal text-haru-muted sm:text-sm">
            {item.role}
          </span>
        </cite>
      </footer>
    </div>
  );
}

function ProgressBars({ activeBarIndex }: { activeBarIndex: number }) {
  return (
    <div
      className="flex flex-wrap gap-2 sm:gap-3"
      role="tablist"
      aria-label="Testimonial progress"
    >
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <div
          key={i}
          role="presentation"
          className="h-1 shrink-0 transition-colors duration-300"
          style={{
            width: BAR_WIDTH,
            maxWidth: "min(80px, 18vw)",
            backgroundColor: i === activeBarIndex ? "#0D0D0D" : "#DDDDDD",
          }}
        />
      ))}
    </div>
  );
}

/** Map testimonial index (0..n-1) to one of BAR_COUNT segments. */
function testimonialToBarIndex(activeTestimonial: number, total: number): number {
  if (total <= 1) return 0;
  const clamped = Math.max(0, Math.min(activeTestimonial, total - 1));
  return Math.round((clamped / (total - 1)) * (BAR_COUNT - 1));
}

export default function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef<number | null>(null);

  const setSectionRef = useCallback((index: number) => (el: HTMLDivElement | null) => {
    sectionRefs.current[index] = el;
  }, []);

  const computeActiveIndex = useCallback(() => {
    const sections = sectionRefs.current.filter(Boolean) as HTMLDivElement[];
    if (sections.length === 0) return;

    const vh = window.innerHeight;
    /** Focal line: slightly above center — feels natural for reading position */
    const focalY = vh * 0.38;

    let bestIdx = 0;
    let bestDist = Infinity;

    sections.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      const sectionMid = (r.top + r.bottom) / 2;
      const dist = Math.abs(sectionMid - focalY);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    });

    setActiveIndex((prev) => (prev !== bestIdx ? bestIdx : prev));
  }, []);

  const scheduleCompute = useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      computeActiveIndex();
    });
  }, [computeActiveIndex]);

  useEffect(() => {
    computeActiveIndex();

    window.addEventListener("scroll", scheduleCompute, { passive: true });
    window.addEventListener("resize", scheduleCompute);

    return () => {
      window.removeEventListener("scroll", scheduleCompute);
      window.removeEventListener("resize", scheduleCompute);
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [computeActiveIndex, scheduleCompute]);

  const progressBarIndex = testimonialToBarIndex(
    activeIndex,
    TESTIMONIALS.length
  );

  return (
    <section className="bg-white text-haru-text" aria-labelledby="testimonials-heading">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16 lg:items-start">
        <div className="max-w-xl lg:sticky lg:top-24 lg:self-start xl:top-28">
          <h2
            id="testimonials-heading"
            className="font-display text-[clamp(1.75rem,4.5vw,3rem)] font-extrabold leading-[1.05] text-haru-text"
          >
            What our customers think
          </h2>
          <p className="mt-4 max-w-md font-dm text-sm leading-relaxed text-haru-muted sm:mt-5 sm:text-base">
            Real feedback from teams who ship fast, sell globally, and care how
            their brand feels on the smallest screen. Scroll to explore their
            stories.
          </p>
          <div className="mt-8 sm:mt-10">
            <ProgressBars activeBarIndex={progressBarIndex} />
          </div>
        </div>

        {/* One scroll track for all breakpoints — no overlapping stickies */}
        <div className="min-w-0">
          {TESTIMONIALS.map((item, i) => {
            const isActive = i === activeIndex;
            return (
              <div
                key={item.id}
                ref={setSectionRef(i)}
                data-index={i}
                className="flex min-h-[min(72vh,560px)] flex-col justify-center py-8 sm:min-h-[min(75vh,620px)] sm:py-10 lg:min-h-[85svh] lg:py-12"
              >
                <div
                  className={`mx-auto w-full max-w-xl transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    isActive
                      ? "scale-100 opacity-100"
                      : "scale-[0.99] opacity-100 lg:scale-[0.98] lg:opacity-[0.72]"
                  }`}
                >
                  <TestimonialCardFace item={item} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
