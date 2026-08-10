import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";

import PostArea from "../../post/components/PostArea";
import HeroBanner from "../../components/HeroBanner";
import InstagramGallery from "../components/InstagramGallery";
import { usePublicSiteContent } from "../hooks/useSiteContent";

function toEmbedUrl(url: string) {
  if (url.includes("youtube.com/watch") || url.includes("youtu.be/")) {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;

    const match = url.match(regExp);

    const videoId = match && match[2].length === 11 ? match[2] : null;

    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
  }

  return url;
}

export default function HomePage() {
  const navigate = useNavigate();

  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);

    window.addEventListener("scroll", onScroll);

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const { data, isLoading, error } = usePublicSiteContent();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#071126]">
        <p className="text-sm font-medium tracking-[0.2em] uppercase">
          Carregando...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#071126] text-red-400">
        <p className="text-sm font-medium tracking-[0.2em] uppercase">
          Erro ao carregar a landing page
        </p>
      </div>
    );
  }

  const banners =
    data.banners.length > 0
      ? data.banners.map((item) => ({
          id: item.id,
          name: data.churchName,
          title: item.title,
          subtitle: item.subtitle,
          description: data.heroDescription,
          photoUrl: item.imageUrl,
          demoVideoUrl: item.videoUrl,
          ctaLabel: item.ctaLabel || data.primaryCtaLabel,
          ctaAction: () => {
            const target = item.ctaUrl || data.primaryCtaUrl;

            if (target.startsWith("http")) {
              window.open(target, "_blank", "noopener,noreferrer");

              return;
            }

            navigate(target);
          },
        }))
      : [
          {
            id: "default",
            name: data.churchName,
            title: data.heroTitle,
            subtitle: data.heroSubtitle,
            description: data.heroDescription,
            photoUrl:
              "https://images.unsplash.com/photo-1519491050282-cf00c82424b4?q=80&w=1600&auto=format&fit=crop",
            ctaLabel: data.primaryCtaLabel,
            ctaAction: () => navigate(data.primaryCtaUrl),
          },
        ];

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#071126] text-white">
      {/* TOPBAR */}
      <div className="absolute top-0 left-0 z-40 w-full border-b border-white/10">
        <div className="container mx-auto flex min-h-16 flex-col gap-3 px-4 py-3 sm:px-6 lg:h-16 lg:flex-row lg:items-center lg:justify-between lg:px-16">
          {/* ADDRESS */}
          <div className="flex items-center justify-center gap-2 text-center text-xs sm:text-sm lg:justify-start">
            <Icon icon="mdi:map-marker-outline" className="text-lg" />

            <span className="font-medium tracking-wide">
              {data.addressLine1} {data.addressLine2}
            </span>
          </div>

          {/* SOCIALS */}
          <div className="flex items-center justify-center">
            {data.facebookUrl && (
              <TopIcon
                icon="mdi:facebook"
                href={data.facebookUrl}
                label="Facebook"
              />
            )}

            {data.instagramUrl && (
              <TopIcon
                icon="mdi:instagram"
                href={data.instagramUrl}
                label="Instagram"
              />
            )}

            {data.youtubeUrl && (
              <TopIcon
                icon="mdi:youtube"
                href={data.youtubeUrl}
                label="YouTube"
              />
            )}

            {data.contactEmail && (
              <TopIcon
                icon="mdi:email-outline"
                href={`mailto:${data.contactEmail}`}
                label="E-mail"
              />
            )}
          </div>
        </div>
      </div>

      {/* NAVBAR */}
      <header
        className={`fixed left-0 z-50 w-full transition-all duration-300 ${
          scrolled
            ? "top-0 bg-slate-950/95 shadow-lg backdrop-blur"
            : "top-[88px] bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-16">
          {/* LOGO */}
          <div className="select-none">
            <img
              src="/images/logo-white.png"
              alt={data.churchName}
              className="h-5 w-auto sm:h-6"
            />
          </div>

          {/* DESKTOP MENU */}
          <nav className="hidden items-center gap-6 lg:flex">
            <NavItem label="Home" target="home" />
            <NavItem label="Ministérios" target="ministerios" />
            <button
              onClick={() => navigate("/cadastro-membro")}
              className="group relative text-sm font-extrabold tracking-[0.12em] uppercase transition hover:text-sky-700"
            >
              Cadastro
              <div className="absolute -bottom-2 left-0 h-[2px] w-0 bg-sky-700 transition-all duration-300 group-hover:w-full" />
            </button>
            <NavItem label="Mídia" target="midia" />
            <NavItem label="Comunicação" target="comunicacao" />
            <NavItem label="Sobre Nós" target="sobre" />
            <NavItem label="Contato" target="contato" />
          </nav>

          {/* MOBILE BUTTON */}
          <button
            aria-label="Abrir menu"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="flex h-11 w-11 items-center justify-center border border-white/10 lg:hidden"
          >
            <Icon
              icon={mobileMenuOpen ? "mdi:close" : "mdi:menu"}
              className="text-2xl"
            />
          </button>
        </div>

        {/* MOBILE MENU */}
        {mobileMenuOpen && (
          <div className="border-t border-white/10 bg-[#071126] lg:hidden">
            <div className="flex flex-col px-6 py-4">
              <MobileNavItem
                label="Home"
                target="home"
                onClick={() => setMobileMenuOpen(false)}
              />

              <MobileNavItem
                label="Ministérios"
                target="ministerios"
                onClick={() => setMobileMenuOpen(false)}
              />

              <button
                onClick={() => {
                  navigate("/cadastro-membro");
                  setMobileMenuOpen(false);
                }}
                className="border-b border-white/10 py-4 text-left text-sm font-bold uppercase transition hover:text-sky-700"
              >
                Cadastro
              </button>

              <MobileNavItem
                label="Mídia"
                target="midia"
                onClick={() => setMobileMenuOpen(false)}
              />

              <MobileNavItem
                label="Comunicação"
                target="comunicacao"
                onClick={() => setMobileMenuOpen(false)}
              />

              <MobileNavItem
                label="Sobre Nós"
                target="sobre"
                onClick={() => setMobileMenuOpen(false)}
              />

              <MobileNavItem
                label="Contato"
                target="contato"
                onClick={() => setMobileMenuOpen(false)}
              />
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section id="home" className="scroll-mt-32">
        <HeroBanner items={banners} />
      </section>

      {/* MINISTERIOS */}
      <section
        id="ministerios"
        className="flex min-h-[70vh] scroll-mt-32 items-center justify-center bg-[#0b1320] px-4 py-24"
      >
        <div className="text-center">
          <p className="text-xs font-bold tracking-[0.2em] text-sky-700 uppercase sm:tracking-[0.3em]">
            Ministérios
          </p>

          <h2 className="mt-5 text-3xl font-black uppercase sm:text-4xl lg:text-5xl">
            Nossos Ministérios
          </h2>
        </div>
      </section>

      {/* INSTAGRAM / FOTOS */}
      <InstagramGallery />

      {/* MIDIA */}
      <section
        id="midia"
        className="scroll-mt-32 bg-[#0b1320] px-4 py-24 sm:px-6"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <p className="text-xs font-bold tracking-[0.2em] text-sky-700 uppercase sm:tracking-[0.3em]">
              Mídia
            </p>

            <h2 className="mt-5 text-3xl font-black uppercase sm:text-4xl lg:text-5xl">
              Vídeos Recentes
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {data.videos.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-2xl border border-white/10 bg-[#071126]"
              >
                <div className="aspect-video overflow-hidden bg-black">
                  <iframe
                    src={toEmbedUrl(item.embedUrl)}
                    title={item.title}
                    className="h-full w-full"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>

                <div className="p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-xl font-bold">{item.title}</h3>

                      <p className="mt-2 text-xs font-bold tracking-[0.2em] text-slate-400 uppercase">
                        {item.platform}
                      </p>
                    </div>

                    {item.sourceUrl && (
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex min-h-[48px] items-center justify-center border border-white/10 px-6 py-3 text-xs font-bold tracking-[0.15em] uppercase transition hover:bg-white/5"
                      >
                        Open
                      </a>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* COMUNICACAO */}
      <section
        id="comunicacao"
        className="mx-auto flex w-full max-w-7xl scroll-mt-32 flex-col items-center px-4 py-24 sm:px-6"
      >
        <div className="mb-14 text-center">
          <p className="text-xs font-bold tracking-[0.2em] text-sky-700 uppercase sm:tracking-[0.3em]">
            Comunicação
          </p>

          <h2 className="mt-5 text-3xl font-black uppercase sm:text-4xl lg:text-5xl">
            Notícias
          </h2>
        </div>

        <div className="flex-1">
          <PostArea mode="public" />
        </div>
      </section>

      {/* SOBRE */}
      <section
        id="sobre"
        className="mx-auto flex max-w-7xl scroll-mt-32 flex-col items-center px-4 py-24 sm:px-6"
      >
        <div className="max-w-3xl text-center">
          <p className="text-xs font-bold tracking-[0.2em] text-sky-700 uppercase sm:tracking-[0.3em]">
            {data.aboutTitle}
          </p>

          <h2 className="mt-5 text-3xl leading-tight font-black uppercase sm:text-4xl lg:text-5xl">
            {data.heroTitle}
          </h2>

          <p className="mt-8 text-base leading-8 text-slate-300 sm:text-lg">
            {data.aboutDescription}
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            {data.secondaryCtaLabel && data.secondaryCtaUrl && (
              <ActionButton
                label={data.secondaryCtaLabel}
                href={data.secondaryCtaUrl}
                secondary
              />
            )}
          </div>
        </div>
      </section>

      {/* CONTATO */}
      <section
        id="contato"
        className="flex scroll-mt-32 items-center justify-center px-4 py-24 sm:px-6"
      >
        <div className="mx-auto max-w-xl text-center">
          <p className="text-xs font-bold tracking-[0.2em] text-sky-700 uppercase sm:tracking-[0.3em]">
            Contato
          </p>

          <h2 className="mt-5 text-3xl font-black uppercase sm:text-4xl lg:text-5xl">
            {data.churchName}
          </h2>

          <div className="mt-10 space-y-8 text-slate-300">
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Icon
                icon="mdi:map-marker-outline"
                className="text-2xl text-sky-700"
              />

              <div className="text-center sm:text-left">
                <p>{data.addressLine1}</p>
                <p>{data.addressLine2}</p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Icon
                icon="mdi:phone-outline"
                className="text-2xl text-sky-700"
              />

              <p>{data.contactPhone}</p>
            </div>

            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Icon
                icon="mdi:email-outline"
                className="text-2xl text-sky-700"
              />

              <p>{data.contactEmail}</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-[#050b16]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 py-10 text-center sm:px-6 lg:flex-row lg:px-6 lg:text-left">
          <div>
            <h3 className="text-2xl font-black uppercase">{data.churchName}</h3>

            <p className="mt-2 text-sm text-slate-400">{data.footerText}</p>
          </div>

          <div className="flex items-center gap-4">
            {data.facebookUrl && (
              <FooterIcon
                icon="mdi:facebook"
                href={data.facebookUrl}
                label="Facebook"
              />
            )}

            {data.instagramUrl && (
              <FooterIcon
                icon="mdi:instagram"
                href={data.instagramUrl}
                label="Instagram"
              />
            )}

            {data.youtubeUrl && (
              <FooterIcon
                icon="mdi:youtube"
                href={data.youtubeUrl}
                label="YouTube"
              />
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

function NavItem({ label, target }: { label: string; target: string }) {
  return (
    <button
      onClick={() => {
        document.getElementById(target)?.scrollIntoView({
          behavior: "smooth",
        });
      }}
      className="group relative text-sm font-extrabold tracking-[0.12em] uppercase"
    >
      <span className="transition group-hover:text-sky-700">{label}</span>

      <div className="absolute -bottom-2 left-0 h-[2px] w-0 bg-sky-700 transition-all duration-300 group-hover:w-full" />
    </button>
  );
}

function MobileNavItem({
  label,
  target,
  onClick,
}: {
  label: string;
  target: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={() => {
        document.getElementById(target)?.scrollIntoView({
          behavior: "smooth",
        });

        onClick?.();
      }}
      className="border-b border-white/10 py-4 text-left text-sm font-bold uppercase"
    >
      {label}
    </button>
  );
}

function TopIcon({
  icon,
  href,
  label,
}: {
  icon: string;
  href?: string;
  label: string;
}) {
  const Component = (
    <div className="flex h-10 w-10 items-center justify-center border-l border-white/10 transition-all duration-300 hover:bg-white/5 hover:text-white sm:h-12 sm:w-12">
      <Icon icon={icon} className="text-lg" />
    </div>
  );

  if (!href) return Component;

  return (
    <a href={href} target="_blank" rel="noreferrer" aria-label={label}>
      {Component}
    </a>
  );
}

function FooterIcon({
  icon,
  href,
  label,
}: {
  icon: string;
  href: string;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center border border-white/10 transition hover:bg-white/5 sm:h-12 sm:w-12"
    >
      <Icon icon={icon} className="text-lg" />
    </a>
  );
}

function ActionButton({
  label,
  href,
  secondary = false,
}: {
  label: string;
  href: string;
  secondary?: boolean;
}) {
  const className = secondary
    ? "border border-white/10 bg-transparent hover:bg-white/5"
    : "bg-sky-700 hover:bg-[#172554]";

  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
      className={`flex min-h-[48px] items-center justify-center px-6 py-3 text-xs font-bold tracking-[0.2em] uppercase transition-all duration-300 ${className}`}
    >
      {label}
    </a>
  );
}
