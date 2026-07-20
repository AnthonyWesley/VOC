import { Outlet } from "react-router-dom";
import Navbar from "../../components/Navbar";
import RightDrawerContent from "../../components/RightDrawerContent";
import { useSocketNotifications } from "../../notification/hooks/useSocketNotifications";
import PostPromptModal from "../../event/components/PostPromptModal";
import { drawerItems } from "./drawerItems";
import DrawerMenu from "../../components/DrawerMenu";
import GenericDrawer from "../../components/GenericDrawer";

export default function MainLayout() {
  useSocketNotifications();

  return (
    <div className="scrollbar-transparent relative flex h-screen flex-col overflow-hidden">
      <Navbar />
      <div className="flex flex-1 overflow-y-auto pt-20">
        <aside className="ml-8.5">
          <GenericDrawer position="left">
            <DrawerMenu items={drawerItems} />
          </GenericDrawer>{" "}
        </aside>
        <div className="container mx-auto flex flex-1">
          <main className="my-2 flex min-w-0 flex-1 flex-col">
            <Outlet />
          </main>
        </div>

        <aside className="mr-8.5">
          <GenericDrawer
            position="right"
            expandedWidth={340}
            togglePosition="top"
            collapseBehavior="hidden"
            scrollable
          >
            <RightDrawerContent />
          </GenericDrawer>{" "}
        </aside>
      </div>
      <PostPromptModal />
    </div>
  );
}
