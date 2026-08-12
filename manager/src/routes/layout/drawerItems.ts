import type { DrawerItem } from "../../components/Drawer";
import { LEVEL } from "../../shared/constants/levels";

export const drawerItems: DrawerItem[] = [
  {
    icon: "mdi:view-dashboard-outline",
    label: "Dashboard",
    href: "/dashboard",
    minLevel: LEVEL.PRESIDENT,
  },
  {
    icon: "mdi:rss-feed",
    label: "Feed",
    href: "/post",
    minLevel: LEVEL.MEMBER,
  },
  {
    icon: "carbon:event",
    label: "Cultos",
    href: "/event",
    minLevel: LEVEL.MEMBER,
  },

  {
    icon: "mdi:shield-account-outline",
    label: "Lideranca",
    href: "/users",
    minLevel: LEVEL.MEMBER,
  },
  {
    icon: "mdi:account-group-outline",
    label: "Membros",
    href: "/member",
    minLevel: LEVEL.MEMBER,
  },
  {
    icon: "mdi:church-outline",
    label: "Ministerios",
    href: "/ministry",
    minLevel: LEVEL.MEMBER,
  },

  {
    icon: "mdi:cash-multiple",
    label: "Financeiros",
    href: "/finance",
    minLevel: LEVEL.TREASURER,
  },
  {
    icon: "mdi:tag-multiple-outline",
    label: "Categorias",
    href: "/category",
    minLevel: LEVEL.TREASURER,
  },
  {
    icon: "mdi:web",
    label: "Landing",
    href: "/site-content",
    minLevel: LEVEL.PRESIDENT,
  },
  {
    icon: "mdi:whatsapp",
    label: "WhatsApp",
    href: "/whatsapp",
    minLevel: LEVEL.PRESIDENT,
  },
];