import { createBrowserRouter } from "react-router-dom";
import { errorRoutes } from "./errorRoutes";
import { publicRoutes } from "./publicRoutes";
import { userRoutes } from "./userRoutes";

export const appRouter = createBrowserRouter([
  ...publicRoutes,
  ...userRoutes,
  ...errorRoutes,
]);
