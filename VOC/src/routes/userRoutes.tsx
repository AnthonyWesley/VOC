import { Navigate, RouteObject } from "react-router-dom";
import MainLayout from "./layout/MainLayout";
import AuthenticatedGuard from "./guards/AuthenticatedGuard";
import RequireMemberProfile from "./guards/RequireMemberProfile";
import useAuthStatus from "../auth/hooks/useAuthStatus";
import MyProfilePage from "../user/pages/MyProfilePage";
import NotificationPage from "../notification/pages/NotificationPage";
import WhatsAppPage from "../whatsapp/pages/WhatsAppPage";
import Spin from "../components/Spin";
import { drawerItems } from "./layout/drawerItems";
import Dashboard from "../dashboard/pages/Dashboard";
import PostsPage from "../post/pages/PostsPage";
import PostDetailPage from "../post/pages/PostDetailPage";
import UsersPage from "../user/pages/UsersPage";
import MembersPage from "../member/pages/MembersPage";

import MinistriesPage from "../ministry/pages/MinistriesPage";
import EventsPage from "../event/pages/EventsPage";

import FinancialRecordsPage from "../finance/pages/FinancialRecordsPage";
import LandingContentPage from "../home/pages/LandingContentPage";
import UserDetailPage from "../user/pages/UserDetailPage";
import MemberDetailPage from "../member/pages/MemberDetailPage";
import MinistryDetailPage from "../ministry/pages/MinistryDetailPage";
import EventDetailPage from "../event/pages/EventDetailPage";
import FinancialRecordDetailsPage from "../finance/pages/FinancialRecordDetailsPage";
import CategoriesPage from "../category/pages/CategoriesPage";
import CategoryDetailsPage from "../category/pages/CategoryDetailsPage";
import CompleteProfilePage from "../member/pages/CompleteProfilePage";
import RequireLevel from "./guards/RequireLevel";
import { LEVEL } from "../shared/constants/levels";

// routes/user.routes.tsx

export const userRoutes: RouteObject[] = [
  {
    path: "/app",
    element: (
      <AuthenticatedGuard>
        <RequireMemberProfile>
          <MainLayout />
        </RequireMemberProfile>
      </AuthenticatedGuard>
    ),
    children: [
      {
        index: true,
        element: <AppHomeRedirect />,
      },
      {
        path: "complete-profile",
        element: <CompleteProfilePage />,
      },
      {
        path: "dashboard",
            element: (
              <RequireLevel minLevel={LEVEL.PRESIDENT}>
                <Dashboard />
              </RequireLevel>
            ),
            },
            {
              path: "posts",
              element: (
                <RequireLevel minLevel={LEVEL.MEMBER}>
                  <PostsPage />
                </RequireLevel>
              ),
            },
            {
              path: "posts/:postId",
              element: (
                <RequireLevel minLevel={LEVEL.MEMBER}>
                  <PostDetailPage />
                </RequireLevel>
              ),
            },
            {
              path: "my-profile",
              element: <MyProfilePage />,
            },
            {
              path: "users",
              element: (
                <RequireLevel minLevel={LEVEL.MEMBER}>
                  <UsersPage />
                </RequireLevel>
              ),
            },
            {
              path: "users/:userId",
              element: (
                <RequireLevel minLevel={LEVEL.MEMBER}>
                  <UserDetailPage />
                </RequireLevel>
              ),
            },

            {
              path: "members",
              element: (
                <RequireLevel minLevel={LEVEL.MEMBER}>
                  <MembersPage />
                </RequireLevel>
              ),
            },
            {
              path: "members/:memberId",
              element: (
                <RequireLevel minLevel={LEVEL.MEMBER}>
                  <MemberDetailPage />
                </RequireLevel>
              ),
            },
            {
              path: "ministries",
              element: (
                <RequireLevel minLevel={LEVEL.MEMBER}>
                  <MinistriesPage />
                </RequireLevel>
              ),
            },
            {
              path: "ministries/:ministryId",
              element: (
                <RequireLevel minLevel={LEVEL.MEMBER}>
                  <MinistryDetailPage />
                </RequireLevel>
              ),
            },
            {
              path: "form/events",
              element: (
                <RequireLevel minLevel={LEVEL.MEMBER}>
                  <EventDetailPage />
                </RequireLevel>
              ),
            },
            {
              path: "events",
              element: (
                <RequireLevel minLevel={LEVEL.MEMBER}>
                  <EventsPage />
                </RequireLevel>
              ),
            },
            {
              path: "events/new",
              element: (
                <RequireLevel minLevel={LEVEL.MINISTRY_LEADER}>
                  <EventDetailPage />
                </RequireLevel>
              ),
            },
            {
              path: "events/:eventId",
              element: (
                <RequireLevel minLevel={LEVEL.MEMBER}>
                  <EventDetailPage />
                </RequireLevel>
              ),
            },
            {
              path: "categories",
              element: (
                <RequireLevel minLevel={LEVEL.TREASURER}>
                  <CategoriesPage />
                </RequireLevel>
              ),
            },
            {
              path: "categories/:categoryId",
              element: (
                <RequireLevel minLevel={LEVEL.TREASURER}>
                  <CategoryDetailsPage />
                </RequireLevel>
              ),
            },
            {
              path: "financial-records",
              element: (
                <RequireLevel minLevel={LEVEL.TREASURER}>
                  <FinancialRecordsPage />
                </RequireLevel>
              ),
            },
            {
              path: "financial-records/:recordId",
              element: (
                <RequireLevel minLevel={LEVEL.TREASURER}>
                  <FinancialRecordDetailsPage />
                </RequireLevel>
              ),
            },
            {
              path: "site-content",
              element: (
                <RequireLevel minLevel={LEVEL.PRESIDENT}>
                  <LandingContentPage />
                </RequireLevel>
              ),
            },
            {
              path: "notifications",
              element: <NotificationPage />,
            },
            {
              path: "whatsapp",
              element: (
                <RequireLevel minLevel={LEVEL.PRESIDENT}>
                  <WhatsAppPage />
                </RequireLevel>
              ),
            },
          ]
    },
  ];

    function AppHomeRedirect() {
      const { authLevel, isPending } = useAuthStatus();

      if (isPending) return <Spin />;

      const firstAllowedRoute = drawerItems.find(
        (item) => item.minLevel <= authLevel,
      );

      return <Navigate to={firstAllowedRoute?.href ?? "/app/my-profile"} replace />;
    }
