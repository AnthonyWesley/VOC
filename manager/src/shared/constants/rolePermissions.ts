import { LEVEL } from "./levels";

export type RolePermissionEntry = {
  label: string;
  level: number;
  description: string;
  accesses: {
    icon: string;
    label: string;
    access: "criar/editar" | "ver" | "bloqueado";
  }[];
};

export const ROLE_PERMISSIONS: Record<string, RolePermissionEntry> = {
  PRESIDENT: {
    label: "Presidente",
    level: LEVEL.PRESIDENT,
    description: "Responsável legal e estatutário — acesso total ao sistema",
    accesses: [
      { icon: "mdi:account-group", label: "Membros", access: "criar/editar" },
      {
        icon: "mdi:shield-account",
        label: "Liderança",
        access: "criar/editar",
      },
      { icon: "mdi:church", label: "Ministérios", access: "criar/editar" },
      { icon: "mdi:rss-feed", label: "Posts", access: "criar/editar" },
      { icon: "carbon:event", label: "Cultos", access: "criar/editar" },
      {
        icon: "mdi:cash-multiple",
        label: "Financeiro",
        access: "criar/editar",
      },
      { icon: "mdi:tag-multiple", label: "Categorias", access: "criar/editar" },
      { icon: "mdi:web", label: "Landing Page", access: "criar/editar" },
      { icon: "mdi:view-dashboard", label: "Dashboard", access: "ver" },
      { icon: "mdi:whatsapp", label: "WhatsApp", access: "criar/editar" },
    ],
  },
  TREASURER: {
    label: "Tesoureiro",
    level: LEVEL.TREASURER,
    description: "Gestão financeira e relatórios",
    accesses: [
      { icon: "mdi:account-group", label: "Membros", access: "ver" },
      { icon: "mdi:shield-account", label: "Liderança", access: "ver" },
      { icon: "mdi:church", label: "Ministérios", access: "ver" },
      { icon: "mdi:rss-feed", label: "Posts", access: "ver" },
      { icon: "carbon:event", label: "Cultos", access: "criar/editar" },
      {
        icon: "mdi:cash-multiple",
        label: "Financeiro",
        access: "criar/editar",
      },
      { icon: "mdi:tag-multiple", label: "Categorias", access: "criar/editar" },
      { icon: "mdi:web", label: "Landing Page", access: "bloqueado" },
      { icon: "mdi:view-dashboard", label: "Dashboard", access: "bloqueado" },
      { icon: "mdi:whatsapp", label: "WhatsApp", access: "bloqueado" },
    ],
  },
  PASTOR: {
    label: "Pastor",
    level: LEVEL.PASTOR,
    description: "Pastoreio e gestão de ministérios",
    accesses: [
      { icon: "mdi:account-group", label: "Membros", access: "ver" },
      { icon: "mdi:shield-account", label: "Liderança", access: "ver" },
      { icon: "mdi:church", label: "Ministérios", access: "ver" },
      { icon: "mdi:rss-feed", label: "Posts", access: "ver" },
      { icon: "carbon:event", label: "Cultos", access: "criar/editar" },
      { icon: "mdi:cash-multiple", label: "Financeiro", access: "bloqueado" },
      { icon: "mdi:tag-multiple", label: "Categorias", access: "bloqueado" },
      { icon: "mdi:web", label: "Landing Page", access: "bloqueado" },
      { icon: "mdi:view-dashboard", label: "Dashboard", access: "bloqueado" },
      { icon: "mdi:whatsapp", label: "WhatsApp", access: "bloqueado" },
    ],
  },
  HOUSE_LEADER: {
    label: "Líder de Célula",
    level: LEVEL.HOUSE_LEADER,
    description: "Gestão de células e grupos",
    accesses: [
      { icon: "mdi:account-group", label: "Membros", access: "ver" },
      { icon: "mdi:shield-account", label: "Liderança", access: "ver" },
      { icon: "mdi:church", label: "Ministérios", access: "ver" },
      { icon: "mdi:rss-feed", label: "Posts", access: "ver" },
      { icon: "carbon:event", label: "Cultos", access: "criar/editar" },
      { icon: "mdi:cash-multiple", label: "Financeiro", access: "bloqueado" },
      { icon: "mdi:tag-multiple", label: "Categorias", access: "bloqueado" },
      { icon: "mdi:web", label: "Landing Page", access: "bloqueado" },
      { icon: "mdi:view-dashboard", label: "Dashboard", access: "bloqueado" },
      { icon: "mdi:whatsapp", label: "WhatsApp", access: "bloqueado" },
    ],
  },
  MINISTRY_LEADER: {
    label: "Líder de Ministério",
    level: LEVEL.MINISTRY_LEADER,
    description: "Liderança de ministérios específicos",
    accesses: [
      { icon: "mdi:account-group", label: "Membros", access: "ver" },
      { icon: "mdi:shield-account", label: "Liderança", access: "ver" },
      { icon: "mdi:church", label: "Ministérios", access: "ver" },
      { icon: "mdi:rss-feed", label: "Posts", access: "criar/editar" },
      { icon: "carbon:event", label: "Cultos", access: "criar/editar" },
      { icon: "mdi:cash-multiple", label: "Financeiro", access: "bloqueado" },
      { icon: "mdi:tag-multiple", label: "Categorias", access: "bloqueado" },
      { icon: "mdi:web", label: "Landing Page", access: "bloqueado" },
      { icon: "mdi:view-dashboard", label: "Dashboard", access: "bloqueado" },
      { icon: "mdi:whatsapp", label: "WhatsApp", access: "bloqueado" },
    ],
  },
  MEMBER: {
    label: "Membro",
    level: LEVEL.MEMBER,
    description: "Usuário padrão da igreja",
    accesses: [
      { icon: "mdi:account-group", label: "Membros", access: "ver" },
      { icon: "mdi:shield-account", label: "Liderança", access: "ver" },
      { icon: "mdi:church", label: "Ministérios", access: "ver" },
      { icon: "mdi:rss-feed", label: "Posts", access: "ver" },
      { icon: "carbon:event", label: "Cultos", access: "ver" },
      { icon: "mdi:cash-multiple", label: "Financeiro", access: "bloqueado" },
      { icon: "mdi:tag-multiple", label: "Categorias", access: "bloqueado" },
      { icon: "mdi:web", label: "Landing Page", access: "ver" },
      { icon: "mdi:view-dashboard", label: "Dashboard", access: "bloqueado" },
      { icon: "mdi:whatsapp", label: "WhatsApp", access: "bloqueado" },
    ],
  },
};
