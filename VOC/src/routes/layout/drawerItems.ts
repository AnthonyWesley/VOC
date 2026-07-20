import type { DrawerItem } from "../../components/Drawer";
import { LEVEL } from "../../shared/constants/levels";

export const drawerItems: DrawerItem[] = [
  {
    icon: "mdi:view-dashboard-outline",
    label: "Dashboard",
    href: "/app/dashboard",
    minLevel: LEVEL.PRESIDENT,
  },
  {
    icon: "mdi:rss-feed",
    label: "Feed",
    href: "/app/posts",
    minLevel: LEVEL.MEMBER,
  },
  {
    icon: "carbon:event",
    label: "Cultos",
    href: "/app/events",
    minLevel: LEVEL.MEMBER,
  },

  {
    icon: "mdi:shield-account-outline",
    label: "Lideranca",
    href: "/app/users",
    minLevel: LEVEL.MEMBER,
  },
  {
    icon: "mdi:account-group-outline",
    label: "Membros",
    href: "/app/members",
    minLevel: LEVEL.MEMBER,
  },
  {
    icon: "mdi:church-outline",
    label: "Ministerios",
    href: "/app/ministries",
    minLevel: LEVEL.MEMBER,
  },

  {
    icon: "mdi:cash-multiple",
    label: "Financeiros",
    href: "/app/financial-records",
    minLevel: LEVEL.TREASURER,
  },
  {
    icon: "mdi:tag-multiple-outline",
    label: "Categorias",
    href: "/app/categories",
    minLevel: LEVEL.TREASURER,
  },
  {
    icon: "mdi:web",
    label: "Landing",
    href: "/app/site-content",
    minLevel: LEVEL.PRESIDENT,
  },
  {
    icon: "mdi:whatsapp",
    label: "WhatsApp",
    href: "/app/whatsapp",
    minLevel: LEVEL.PRESIDENT,
  },
];
