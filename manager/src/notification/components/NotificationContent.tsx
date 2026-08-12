import { NotificationUIModel } from "../types/NotificationUIModel";

type Props = {
  notification?: NotificationUIModel;
};

export default function NotificationContent({ notification }: Props) {
  if (!notification) {
    return (
      <main className="flex w-full items-center justify-center text-gray-500">
        Selecione uma notificação
      </main>
    );
  }

  return (
    <main className="w-full overflow-y-auto p-6 lg:w-2/3">
      <h2 className="text-xl font-bold">{notification.title}</h2>

      <p className="mt-2 text-gray-300 italic">{notification.description}</p>
    </main>
  );
}
