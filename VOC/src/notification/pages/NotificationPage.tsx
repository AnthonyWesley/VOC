import { Icon } from "@iconify/react";
import { useState, useEffect, useMemo } from "react";
import { useModalStore } from "../../store/useModalStore";
import { useNotifications } from "../hooks/useNotification";
import { useNotificationMutations } from "../hooks/useNotificationMutations";
import { mapNotificationToUI } from "../utils/NotificationMapper";
import Modal from "../../components/Modal";
import NotificationList from "../components/NotificationList";
import NotificationContent from "../components/NotificationContent";

export default function NotificationPage() {
  const {
    queryNotifications: {
      data,
      fetchNextPage,
      hasNextPage,
      isFetchingNextPage,
      isLoading,
    },
  } = useNotifications();

  const { markAsRead } = useNotificationMutations();
  const { openModal } = useModalStore();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Responsive
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 1024);
    handler();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // Memoized notifications
  const notifications = useMemo(() => {
    if (!data) return [];
    return data.pages.flatMap((page) => page.items).map(mapNotificationToUI);
  }, [data]);

  const selectedNotification = useMemo(
    () => notifications.find((n) => n.id === selectedId),
    [notifications, selectedId],
  );

  const handleSelect = (id: string) => {
    setSelectedId(id);
    markAsRead.mutate(id);

    if (isMobile) {
      openModal("notification-view");
    }
  };

  if (isLoading) {
    return <div className="p-4">Carregando...</div>;
  }

  if (!isLoading && notifications.length === 0) {
    return (
      <div className="flex items-center gap-2 p-4 text-xl">
        Sem notificações
        <Icon icon="mi:notification-off" />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-1 flex-col lg:flex-row">
      <NotificationList
        notifications={notifications}
        onSelect={handleSelect}
        fetchNextPage={fetchNextPage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        selectedId={selectedId}
      />

      {!isMobile && <NotificationContent notification={selectedNotification} />}

      {isMobile && (
        <Modal id="notification-view">
          <NotificationContent notification={selectedNotification} />
        </Modal>
      )}
    </div>
  );
}
