// navigation/user.navigation.ts
import { NavItem } from "./types";

export const userNavigation: NavItem[] = [
  {
    label: "Marketplace",
    icon: "mdi:shopping-outline",
    href: "/",
  },
  {
    label: "Perfil",
    icon: "mdi:account-circle",
    href: "/my-profile",
  },
  {
    label: "Empresa",
    icon: "mdi:office-building",
    href: "/my-company",
  },
];
