import { Link, useLocation } from "react-router-dom";
import { useContext } from "react";
import Icon from "./Icon";
import { DrawerContext } from "./GenericDrawer";
import useAuthStatus from "../auth/hooks/useAuthStatus";

type DrawerItem = {
  icon: string;
  label: string;
  href?: string;
  minLevel: number;
};

type Props = {
  items: DrawerItem[];
};

export default function DrawerMenu({ items }: Props) {
  const location = useLocation();
  const { open } = useContext(DrawerContext);
  const { authLevel, isAuthenticated } = useAuthStatus();
  const authRoutes = items.filter((item) => item.minLevel <= authLevel);
  const isActive = (href?: string) => href && location.pathname.includes(href);

  if (!isAuthenticated || authRoutes.length === 0) return null;

  return (
    <ul className="menu w-full">
      {authRoutes.map((item) => {
        return (
          <li key={item.href}>
            <Link
              to={item.href ?? "#"}
              className={
                isActive(item.href)
                  ? "text-[var(--accent-cyan)]"
                  : "text-[var(--text-secondary)]"
              }
            >
              <Icon
                icon={item.icon}
                info={!open ? item.label : undefined}
                text={open ? item.label : undefined}
                infoDirection="right"
                className={
                  isActive(item.href)
                    ? "font-semibold"
                    : "opacity-90 hover:opacity-100"
                }
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
