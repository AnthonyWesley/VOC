interface Props {
  isInteractionAllowed: boolean;
  validatePending: boolean;
  handleResend: () => void;
}

export default function ResendOptions({
  isInteractionAllowed,
  validatePending,
  handleResend,
}: Props) {
  if (!isInteractionAllowed) return null;

  return (
    <div className="space-y-2 text-center text-[var(--text-primary)]">
      <p className="text-sm">Não recebeu o código?</p>
      <section className="flex justify-center gap-4">
        <button
          onClick={handleResend}
          disabled={validatePending}
          className="text-sm text-cyan-400 hover:underline disabled:opacity-50"
        >
          Reenviar código
        </button>
        {/* <button
          onClick={() => {
            navigate("/change-phone");
            // localStorage.setItem(
            //   "userIdForPhoneChange",
            //   authUser.user?.id || "",
            // );
            clearTimer();
          }}
          className="text-sm text-gray-300 hover:underline"
        >
          Alterar número
        </button> */}
      </section>
    </div>
  );
}
