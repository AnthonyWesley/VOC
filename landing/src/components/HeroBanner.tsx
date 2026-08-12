import { useEffect, useState } from 'react';
import type { JSX } from 'react';

type HeroItem = {
  id: string;
  name: string;
  description?: string;
  photoUrl: string;
  demoVideoUrl?: string;
  title?: string;
  subtitle?: string;
  badge?: string;
  icon?: string;
  ctaLabel?: string;
  ctaHref?: string;
  extraInfo?: JSX.Element;
};

type Props = {
  items: HeroItem[];
  interval?: number;
};

export function HeroBanner({ items, interval = 15000 }: Props) {
  const [index, setIndex] = useState(0);
  const [videoFailed, setVideoFailed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (items.length <= 1) return;

    const carouselTimer = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, interval);

    return () => {
      clearInterval(carouselTimer);
    };
  }, [items.length, interval]);

  return (
    <section className="relative h-screen w-full overflow-hidden bg-[#071126]">
      {items.map((item, i) => {
        const isActive = i === index;
        const showVideo = !!item.demoVideoUrl && !videoFailed[item.id];

        return (
          <div
            key={item.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              isActive ? 'z-20 opacity-100' : 'z-0 opacity-0'
            }`}
          >
            {showVideo ? (
              <video
                src={item.demoVideoUrl}
                poster={item.photoUrl}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                className="absolute inset-0 h-full w-full object-cover"
                onError={() =>
                  setVideoFailed((prev) => ({
                    ...prev,
                    [item.id]: true,
                  }))
                }
              />
            ) : (
              <img
                src={item.photoUrl}
                alt={item.name}
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}

            <div className="absolute inset-0 bg-[#071126]/80" />

            <div className="relative z-30 flex h-full items-center justify-center px-6">
              <div className="max-w-5xl text-center">
                {item.subtitle && (
                  <p className="mb-6 text-sm font-extrabold tracking-[0.3em] text-[#1E3A8A] uppercase">
                    {item.subtitle}
                  </p>
                )}

                <h1 className="text-5xl leading-tight font-black tracking-tight text-white uppercase md:text-7xl">
                  {item.title}
                </h1>

                {item.description && (
                  <p className="mx-auto mt-8 max-w-3xl text-lg leading-8 text-slate-300 md:text-xl">
                    {item.description}
                  </p>
                )}

                {item.ctaLabel && item.ctaHref && (
                  <div className="mt-10">
                    <HeroCta href={item.ctaHref} label={item.ctaLabel} />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      <div className="absolute bottom-10 left-1/2 z-40 flex -translate-x-1/2 gap-3">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`h-2 transition-all duration-300 ${
              i === index ? 'w-10 bg-white' : 'w-3 bg-white/40'
            }`}
          />
        ))}
      </div>
    </section>
  );
}

function HeroCta({ href, label }: { href: string; label: string }) {
  const className =
    'flex min-h-[48px] items-center justify-center bg-sky-700 px-8 py-3 text-xs font-bold tracking-[0.2em] uppercase transition hover:bg-[#172554]';

  if (href.startsWith('http')) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {label}
      </a>
    );
  }

  return (
    <a href={href} className={className}>
      {label}
    </a>
  );
}