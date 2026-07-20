import { Link, useLocation } from "react-router-dom";
import Icon from "./Icon";
import useAuthStatus from "../auth/hooks/useAuthStatus";

export type DrawerItem = {
  icon: string;
  label: string;
  tooltip?: string;
  indicator?: string | number;
  href?: string;
  minLevel: number;
};

type DrawerProps = {
  children?: React.ReactNode;
  items: DrawerItem[];
  id?: string;
  position?: "left" | "right"; // nova prop
};

export default function Drawer2({
  items,
  children,
  id = "my-drawer-4",
  position = "left",
}: DrawerProps) {
  const pathname = useLocation();
  const { authLevel, isAuthenticated } = useAuthStatus();
  const authRoutes = items.filter((item) => item.minLevel <= authLevel);

  const isActive = (href?: string) => href && pathname.pathname.includes(href);

  return (
    <div className="sticky top-0 left-0">
      <div className="hidden lg:block">
        <div
          className={`drawer drawer-open ${position === "right" ? "right-12" : "left-12"}`}
        >
          <input id={id} type="checkbox" className="drawer-toggle" />
          <div className="drawer-content flex flex-col">{children}</div>

          {isAuthenticated && authRoutes.length > 0 && (
            <div className="drawer-side is-drawer-close:overflow-visible">
              <label
                htmlFor={id}
                aria-label="close sidebar"
                className="drawer-overlay"
              ></label>
              <div className="is-drawer-close:w-14 is-drawer-open:w-52 authRoutes-start flex max-h-full flex-col rounded-md">
                <ul className="menu mr-2 h-screen w-full grow">
                  {authRoutes.map((item, index) => (
                    <li key={index} className="h-10">
                      <Link
                        to={item.href ?? "#"}
                        className={`is-drawer-close:tooltip is-drawer-close:tooltip-right ${
                          isActive(item.href)
                            ? "text-[var(--accent-cyan)]"
                            : "text-[var(--text-secondary)]"
                        }`}
                        data-tip={item.tooltip || item.label}
                      >
                        <Icon
                          icon={item.icon}
                          text={item.label}
                          indicator={item.indicator}
                          className={
                            isActive(item.href)
                              ? "font-semibold"
                              : "opacity-90 hover:opacity-100"
                          }
                          scale={0.6}
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
                <div
                  className="is-drawer-close:tooltip is-drawer-close:tooltip-right m-2 mb-30"
                  data-tip="Open"
                >
                  <label
                    htmlFor={id}
                    className="btn btn-ghost btn-circle drawer-button is-drawer-open:rotate-y-180"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      strokeWidth="2"
                      fill="none"
                      stroke="currentColor"
                      className="my-1.5 inline-block size-4"
                    >
                      <path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z"></path>
                      <path d="M9 4v16"></path>
                      <path d="M14 10l2 2l-2 2"></path>
                    </svg>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="block h-screen lg:hidden">
        <div className="drawer drawer-end">
          <input id={id} type="checkbox" className="drawer-toggle" />
          <div className="drawer-content">{children}</div>
          {isAuthenticated && authRoutes.length > 0 && (
            <>
              <label
                htmlFor={id}
                className="btn btn-ghost btn-circle drawer-button fixed bottom-15 ml-4 bg-[var(--card-top)] text-[var(--text-primary)] shadow-lg backdrop-blur-xl"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  strokeWidth="2"
                  fill="none"
                  stroke="currentColor"
                  className="my-1.5 inline-block size-4"
                >
                  <path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z"></path>
                  <path d="M9 4v16"></path>
                  <path d="M14 10l2 2l-2 2"></path>
                </svg>
              </label>
              <div className="drawer-side">
                <label
                  htmlFor={id}
                  aria-label="close sidebar"
                  className="drawer-overlay"
                ></label>
                <ul className="menu min-h-full w-52 bg-[var(--bg-mid)] p-4 backdrop-blur-xl">
                  {authRoutes.map((item, index) => (
                    <li key={index} className="h-10">
                      <Link
                        to={item.href ?? "#"}
                        className={`is-drawer-close:tooltip is-drawer-close:tooltip-right ${
                          isActive(item.href)
                            ? "text-[var(--accent-cyan)]"
                            : "text-[var(--text-secondary)]"
                        }`}
                        data-tip={item.tooltip || item.label}
                      >
                        <Icon
                          icon={item.icon}
                          text={item.label}
                          indicator={item.indicator}
                          className={
                            isActive(item.href)
                              ? "font-semibold"
                              : "opacity-90 hover:opacity-100"
                          }
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
