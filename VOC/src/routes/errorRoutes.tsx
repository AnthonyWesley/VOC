import { RouteObject } from "react-router-dom";
import ErrorPage from "../auth/pages/ErrorPage";
import SuspendedPage from "../auth/pages/SuspendedPage";

export const errorRoutes: RouteObject[] = [
  { path: "error/unauthorized", element: <ErrorPage code={401} /> },
  { path: "error/forbidden", element: <ErrorPage code={403} /> },
  { path: "error/not-found", element: <ErrorPage code={404} /> },
  { path: "error/suspended", element: <SuspendedPage /> },
  // ...
];
