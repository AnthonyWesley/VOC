// navigation/admin.navigation.ts
import { NavItem } from "./types";

export const adminNavigation: NavItem[] = [
  {
    label: "Dashboard",
    icon: "mdi:view-dashboard",
    href: "/platforms/:platformId/dashboard",
    roles: ["SUPER_ADMIN"],
  },
  {
    label: "Empresas",
    icon: "mdi:office-building",
    href: "/platforms/:platformId/companies",
    roles: ["SUPER_ADMIN"],
  },
];
