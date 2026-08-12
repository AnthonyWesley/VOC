import { RouterProvider } from "react-router-dom";
import { appRouter } from "./routes";
import { ToastContainer } from "react-toastify";
import { TempAuthProvider } from "./auth/contexts/TempAuthContext";

export default function App() {
  return (
    <>
      <ToastContainer style={{ zIndex: 20000 }} />
      <TempAuthProvider>
        <RouterProvider router={appRouter} />
      </TempAuthProvider>
    </>
  );
}
