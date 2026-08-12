import { useEffect, useState } from "react";
import { PageHeader } from "../../components/PageHeader";
import { FormInput } from "../../components/FormInput";
import {
  useAdminSiteContent,
  useSiteContentMutations,
} from "../hooks/useSiteContent";
import {
  SiteBannerItem,
  SiteContentUpdateInput,
  SitePhotoItem,
  SiteVideoItem,
} from "../types/siteContentTypes";

function emptyBanner(): SiteBannerItem {
  return {
    id: crypto.randomUUID(),
    title: "",
    subtitle: "",
    imageUrl: "",
    videoUrl: "",
    ctaLabel: "",
    ctaUrl: "",
  };
}

function emptyPhoto(): SitePhotoItem {
  return {
    id: crypto.randomUUID(),
    title: "",
    imageUrl: "",
    sourceUrl: "",
  };
}

function emptyVideo(): SiteVideoItem {
  return {
    id: crypto.randomUUID(),
    title: "",
    platform: "YOUTUBE",
    embedUrl: "",
    sourceUrl: "",
    thumbnailUrl: "",
  };
}

export default function LandingContentPage() {
  const { data, isLoading, error } = useAdminSiteContent();
  const { updateSiteContent } = useSiteContentMutations();
  const [form, setForm] = useState<SiteContentUpdateInput | null>(null);

  useEffect(() => {
    if (data) {
      const { updatedAt, ...rest } = data;
      setForm(rest);
    }
  }, [data]);

  if (isLoading || !form) {
    return <p className="text-gray-300">Carregando configuracoes...</p>;
  }

  if (error) {
    return <p className="text-red-400">Erro ao carregar configuracoes.</p>;
  }

  return (
    <div className="space-y-6 px-4 pb-6 md:px-6">
      <PageHeader
        icon="mdi:web"
        title="Landing da Igreja"
        subtitle="Banners, fotos, videos e informacoes do site"
        className="border-b border-slate-800/90 bg-none px-0 py-0 pb-2"
      />

      <section className="grid gap-6 xl:grid-cols-2">
        <EditorCard title="Informacoes principais">
          <FormInput
            label="Nome da igreja"
            value={form.churchName}
            onChange={(e) => setForm({ ...form, churchName: e.target.value })}
          />
          <FormInput
            label="Titulo hero"
            value={form.heroTitle}
            onChange={(e) => setForm({ ...form, heroTitle: e.target.value })}
          />
          <FormInput
            label="Subtitulo hero"
            value={form.heroSubtitle}
            onChange={(e) => setForm({ ...form, heroSubtitle: e.target.value })}
          />
          <FormInput
            label="Descricao hero"
            type="textarea"
            value={form.heroDescription}
            onChange={(e) =>
              setForm({ ...form, heroDescription: e.target.value })
            }
          />
          <FormInput
            label="Titulo sobre"
            value={form.aboutTitle}
            onChange={(e) => setForm({ ...form, aboutTitle: e.target.value })}
          />
          <FormInput
            label="Descricao sobre"
            type="textarea"
            value={form.aboutDescription}
            onChange={(e) =>
              setForm({ ...form, aboutDescription: e.target.value })
            }
          />
        </EditorCard>

        <EditorCard title="Contato e links">
          <FormInput
            label="Titulo endereco"
            value={form.addressTitle}
            onChange={(e) => setForm({ ...form, addressTitle: e.target.value })}
          />
          <FormInput
            label="Endereco linha 1"
            value={form.addressLine1}
            onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
          />
          <FormInput
            label="Endereco linha 2"
            value={form.addressLine2}
            onChange={(e) => setForm({ ...form, addressLine2: e.target.value })}
          />
          <FormInput
            label="Telefone"
            value={form.contactPhone || ""}
            onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
          />
          <FormInput
            label="Email"
            value={form.contactEmail || ""}
            onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
          />
          <FormInput
            label="Instagram"
            value={form.instagramUrl || ""}
            onChange={(e) => setForm({ ...form, instagramUrl: e.target.value })}
          />
          <FormInput
            label="Facebook"
            value={form.facebookUrl || ""}
            onChange={(e) => setForm({ ...form, facebookUrl: e.target.value })}
          />
          <FormInput
            label="YouTube"
            value={form.youtubeUrl || ""}
            onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })}
          />
          <FormInput
            label="Texto do rodape"
            value={form.footerText}
            onChange={(e) => setForm({ ...form, footerText: e.target.value })}
          />
        </EditorCard>
      </section>

      <EditorCard title="Chamadas para acao">
        <div className="grid gap-4 md:grid-cols-2">
          <FormInput
            label="CTA principal"
            value={form.primaryCtaLabel}
            onChange={(e) =>
              setForm({ ...form, primaryCtaLabel: e.target.value })
            }
          />
          <FormInput
            label="URL principal"
            value={form.primaryCtaUrl}
            onChange={(e) =>
              setForm({ ...form, primaryCtaUrl: e.target.value })
            }
          />
          <FormInput
            label="CTA secundario"
            value={form.secondaryCtaLabel || ""}
            onChange={(e) =>
              setForm({ ...form, secondaryCtaLabel: e.target.value || null })
            }
          />
          <FormInput
            label="URL secundaria"
            value={form.secondaryCtaUrl || ""}
            onChange={(e) =>
              setForm({ ...form, secondaryCtaUrl: e.target.value || null })
            }
          />
        </div>
      </EditorCard>

      <DynamicListCard
        title="Banners"
        onAdd={() =>
          setForm({ ...form, banners: [...form.banners, emptyBanner()] })
        }
      >
        {form.banners.map((item, index) => (
          <div key={item.id} className="rounded-2xl border border-white/10 p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-semibold text-white">Banner {index + 1}</p>
              <button
                onClick={() =>
                  setForm({
                    ...form,
                    banners: form.banners.filter(
                      (banner) => banner.id !== item.id,
                    ),
                  })
                }
                className="text-sm text-red-300"
              >
                Remover
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <FormInput
                label="Titulo"
                value={item.title}
                onChange={(e) =>
                  setForm({
                    ...form,
                    banners: form.banners.map((banner) =>
                      banner.id === item.id
                        ? { ...banner, title: e.target.value }
                        : banner,
                    ),
                  })
                }
              />
              <FormInput
                label="Subtitulo"
                value={item.subtitle || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    banners: form.banners.map((banner) =>
                      banner.id === item.id
                        ? { ...banner, subtitle: e.target.value }
                        : banner,
                    ),
                  })
                }
              />
              <FormInput
                label="Imagem"
                value={item.imageUrl}
                onChange={(e) =>
                  setForm({
                    ...form,
                    banners: form.banners.map((banner) =>
                      banner.id === item.id
                        ? { ...banner, imageUrl: e.target.value }
                        : banner,
                    ),
                  })
                }
              />
              <FormInput
                label="Video"
                value={item.videoUrl || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    banners: form.banners.map((banner) =>
                      banner.id === item.id
                        ? { ...banner, videoUrl: e.target.value }
                        : banner,
                    ),
                  })
                }
              />
              <FormInput
                label="Texto CTA"
                value={item.ctaLabel || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    banners: form.banners.map((banner) =>
                      banner.id === item.id
                        ? { ...banner, ctaLabel: e.target.value }
                        : banner,
                    ),
                  })
                }
              />
              <FormInput
                label="URL CTA"
                value={item.ctaUrl || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    banners: form.banners.map((banner) =>
                      banner.id === item.id
                        ? { ...banner, ctaUrl: e.target.value }
                        : banner,
                    ),
                  })
                }
              />
            </div>
          </div>
        ))}
      </DynamicListCard>

      <DynamicListCard
        title="Fotos"
        onAdd={() =>
          setForm({ ...form, photos: [...form.photos, emptyPhoto()] })
        }
      >
        {form.photos.map((item, index) => (
          <div key={item.id} className="rounded-2xl border border-white/10 p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-semibold text-white">Foto {index + 1}</p>
              <button
                onClick={() =>
                  setForm({
                    ...form,
                    photos: form.photos.filter((photo) => photo.id !== item.id),
                  })
                }
                className="text-sm text-red-300"
              >
                Remover
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <FormInput
                label="Titulo"
                value={item.title}
                onChange={(e) =>
                  setForm({
                    ...form,
                    photos: form.photos.map((photo) =>
                      photo.id === item.id
                        ? { ...photo, title: e.target.value }
                        : photo,
                    ),
                  })
                }
              />
              <FormInput
                label="Imagem"
                value={item.imageUrl}
                onChange={(e) =>
                  setForm({
                    ...form,
                    photos: form.photos.map((photo) =>
                      photo.id === item.id
                        ? { ...photo, imageUrl: e.target.value }
                        : photo,
                    ),
                  })
                }
              />
              <FormInput
                label="URL origem"
                value={item.sourceUrl || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    photos: form.photos.map((photo) =>
                      photo.id === item.id
                        ? { ...photo, sourceUrl: e.target.value }
                        : photo,
                    ),
                  })
                }
              />
            </div>
          </div>
        ))}
      </DynamicListCard>

      <DynamicListCard
        title="Videos"
        onAdd={() =>
          setForm({ ...form, videos: [...form.videos, emptyVideo()] })
        }
      >
        {form.videos.map((item, index) => (
          <div key={item.id} className="rounded-2xl border border-white/10 p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-semibold text-white">Video {index + 1}</p>
              <button
                onClick={() =>
                  setForm({
                    ...form,
                    videos: form.videos.filter((video) => video.id !== item.id),
                  })
                }
                className="text-sm text-red-300"
              >
                Remover
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <FormInput
                label="Titulo"
                value={item.title}
                onChange={(e) =>
                  setForm({
                    ...form,
                    videos: form.videos.map((video) =>
                      video.id === item.id
                        ? { ...video, title: e.target.value }
                        : video,
                    ),
                  })
                }
              />
              <FormInput
                label="Plataforma"
                value={item.platform}
                onChange={(e) =>
                  setForm({
                    ...form,
                    videos: form.videos.map((video) =>
                      video.id === item.id
                        ? { ...video, platform: e.target.value }
                        : video,
                    ),
                  })
                }
              />
              <FormInput
                label="URL embed"
                value={item.embedUrl}
                onChange={(e) =>
                  setForm({
                    ...form,
                    videos: form.videos.map((video) =>
                      video.id === item.id
                        ? { ...video, embedUrl: e.target.value }
                        : video,
                    ),
                  })
                }
              />
              <FormInput
                label="URL origem"
                value={item.sourceUrl || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    videos: form.videos.map((video) =>
                      video.id === item.id
                        ? { ...video, sourceUrl: e.target.value }
                        : video,
                    ),
                  })
                }
              />
              <FormInput
                label="Thumbnail"
                value={item.thumbnailUrl || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    videos: form.videos.map((video) =>
                      video.id === item.id
                        ? { ...video, thumbnailUrl: e.target.value }
                        : video,
                    ),
                  })
                }
              />
            </div>
          </div>
        ))}
      </DynamicListCard>

      <div className="flex justify-end">
        <button
          onClick={() => updateSiteContent.mutate(form)}
          className="rounded-full bg-sky-400 px-6 py-3 font-bold text-slate-950"
        >
          Salvar configuracoes
        </button>
      </div>
    </div>
  );
}

function EditorCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-800 p-5">
      <h2 className="mb-4 text-sm font-bold tracking-[0.2em] text-sky-300 uppercase">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function DynamicListCard({
  title,
  children,
  onAdd,
}: {
  title: string;
  children: React.ReactNode;
  onAdd: () => void;
}) {
  return (
    <section className="rounded-2xl border border-slate-800 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold tracking-[0.2em] text-sky-300 uppercase">
          {title}
        </h2>
        <button onClick={onAdd} className="text-sm text-amber-300">
          Adicionar
        </button>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
