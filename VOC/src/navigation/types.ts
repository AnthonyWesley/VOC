// navigation/types.ts
export type UserRole = "SUPER_ADMIN";
export type NavItem = {
  label: string;
  icon: string;
  href: string;
  roles?: UserRole[]; // quem pode ver
};
