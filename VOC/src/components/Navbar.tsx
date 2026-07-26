import { useNavigate } from "react-router-dom";
import useAuthStatus from "../auth/hooks/useAuthStatus";
import useAuthMutations from "../auth/hooks/useAuthMutations";
import { fieldFormatter } from "../helpers/fieldFormatter";
import Avatar from "./Avatar";
import Icon from "./Icon";
import { ThemeToggle } from "../theme/ThemeProvider";
import { useUnreadCount } from "../notification/hooks/useUnreadCount";

export type RouteType = {
  href: string;
  text: string;
  icon: string;
  image?: string;
};

export type NavProps = {
  user?: any;
  links?: RouteType[];
  className?: string;
  linkStyle?: string;
  isTittle?: boolean;
};

export default function Navbar() {
  const navigate = useNavigate();
  const { authUser, isAuthenticated } = useAuthStatus();
  const { logout } = useAuthMutations();

  const handleLogout = () => {
    logout.mutate();
  };

  return (
    <div className="navbar fixed z-50 mx-auto w-[99%] bg-[var(--bg-mid)]/10 px-4 backdrop-blur-xs lg:px-16">
      <div className="flex-1">
        <img
          src="/images/logo-white.png"
          alt="VOC Church logo"
          className="w-40 self-center"
        />
      </div>
      {isAuthenticated && (
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="dropdown dropdown-end">
            <div
              role="button"
              className="btn btn-ghost btn-circle relative"
              onClick={() => navigate("/app/notifications")}
            >
              <Icon icon="material-symbols:notifications-active" />
              <UnreadBadge />
            </div>
          </div>
          <div className="dropdown dropdown-end">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-ghost btn-circle avatar"
            >
              <div className="w-10 rounded-full">
                <Avatar
                  image={authUser?.photoUrl ?? undefined}
                  size="35"
                  icon="mdi:user"
                  name={fieldFormatter.name(
                    authUser?.fullName ?? "Usuário",
                    "first",
                  )}
                  className="ring-2"
                />
              </div>
            </div>
            <ul
              tabIndex={0}
              className="menu dropdown-content z-50 mt-3 w-52 rounded-2xl border border-[var(--card-border)] bg-[var(--card-top)] p-2 shadow-xl backdrop-blur-xl"
            >
              <li>
                <button
                  onClick={() => navigate("/app/my-profile")}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-mid)]/50"
                >
                  <Icon icon="mdi:account-circle" className="text-lg" />
                  Meu Perfil
                </button>
              </li>
              <li className="mt-1 border-t border-[var(--card-border)] pt-1">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-[var(--accent-coral)] hover:bg-[var(--bg-mid)]/50"
                >
                  <Icon icon="mdi:logout" className="text-lg" />
                  {logout.isPending ? "Saindo..." : "Sair"}
                </button>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function UnreadBadge() {
  const { data: count } = useUnreadCount();
  if (!count || count <= 0) return null;
  return (
    <span className="badge badge-error badge-xs absolute -top-1 -right-1 size-4 p-0 text-[10px] leading-none">
      {count > 99 ? "99+" : count}
    </span>
  );
}
