import { RouterProvider } from "react-router-dom";
import { appRouter } from "./routes";
import { ToastContainer } from "react-toastify";

export default function App() {
  return (
    <>
      <ToastContainer style={{ zIndex: 20000 }} />
      <RouterProvider router={appRouter} />
    </>
  );
}
