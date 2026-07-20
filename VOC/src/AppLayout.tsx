// AppLayout.tsx
import { Outlet } from "react-router-dom";

export default function AppLayout() {
  return (
    <main className="flex flex-1 flex-col">
      <Outlet />
    </main>
  );
}
