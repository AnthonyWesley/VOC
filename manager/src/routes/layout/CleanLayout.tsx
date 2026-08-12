import { Outlet } from "react-router-dom";

export default function CleanLayout() {
  return (
    <main className="flex w-full flex-col">
      <Outlet />
    </main>
  );
}
