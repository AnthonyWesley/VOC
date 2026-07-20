import { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-toastify";
import { PageHeader } from "../../components/PageHeader";
import { FormInput } from "../../components/FormInput";
import { FormButton } from "../../components/FormButton";
import Modal from "../../components/Modal";
import Dialog from "../../components/Dialog";
import { useModalStore } from "../../store/useModalStore";
import { useWhatsapp } from "../hooks/useWhatsapp";
import { whatsappService } from "../services/whatsappService";
import QRCodeDisplay from "../../components/QRCodeDisplay";

type ConnectionStep = "disconnected" | "connecting" | "connected" | "open";

function StepIndicator({
  step,
  current,
}: {
  step: ConnectionStep;
  current: ConnectionStep;
}) {
  const steps: { key: ConnectionStep; label: string }[] = [
    { key: "disconnected", label: "Desconectado" },
    { key: "connecting", label: "Conectando" },
    { key: "connected", label: "Conectado" },
    { key: "open", label: "Pronto" },
  ];

  const idx = steps.findIndex((s) => s.key === step);
  const curIdx = steps.findIndex((s) => s.key === current);

  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
          idx <= curIdx
            ? "bg-green-500 text-white"
            : "bg-slate-800 text-slate-500"
        }`}
      >
        {idx < curIdx ? <Icon icon="mdi:check" /> : idx + 1}
      </div>
      <span
        className={`text-sm ${idx <= curIdx ? "text-[var(--text-primary)]" : "text-slate-500"}`}
      >
        {steps[idx].label}
      </span>
    </div>
  );
}

export default function WhatsAppPage() {
  const {
    instance,
    // isLoading,
    createInstance,
    deleteInstance,
    restartInstance,
    refreshState,
  } = useWhatsapp();
  const { openModal } = useModalStore();

  const [instanceName, setInstanceName] = useState("");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<string>("close");
  const [polling, setPolling] = useState(false);

  // Poll connection state when connecting
  useEffect(() => {
    if (!polling || !instance?.instanceName) return;
    const interval = setInterval(async () => {
      const state = await refreshState(instance.instanceName);
      setConnectionState(state);
      if (state === "open") {
        setPolling(false);
        toast.success("WhatsApp conectado com sucesso!");
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [polling, instance?.instanceName, refreshState]);

  useEffect(() => {
    if (instance?.state) {
      setConnectionState(instance.state);
    }
  }, [instance?.state]);

  const handleCreate = useCallback(async () => {
    if (!instanceName.trim()) {
      toast.error("Digite um nome para a instância");
      return;
    }

    try {
      const result = await createInstance.mutateAsync(instanceName.trim());
      setQrCode(result.qrcode);
      setPairingCode(result.pairingCode);
      setConnectionState("connecting");
      setPolling(true);
    } catch {
      toast.error("Erro ao criar instância. Verifique o nome e tente novamente.");
    }
  }, [instanceName, createInstance]);

  const handleRefreshQr = useCallback(async () => {
    if (!instance?.instanceName) return;
    try {
      const result = await whatsappService.getQrCode(instance.instanceName);
      setQrCode(result.qrcode);
      setPairingCode(result.pairingCode);
    } catch {
      toast.error("Erro ao gerar QR Code");
    }
  }, [instance?.instanceName]);

  const handleDisconnect = useCallback(async () => {
    if (!instance?.instanceName) return;
    await deleteInstance.mutateAsync(instance.instanceName);
    setQrCode(null);
    setPairingCode(null);
    setConnectionState("close");
    setPolling(false);
  }, [instance?.instanceName, deleteInstance]);

  const currentStep: ConnectionStep =
    connectionState === "open"
      ? "open"
      : connectionState === "close"
        ? "disconnected"
        : "connecting";

  return (
    <div className="space-y-6 px-4 pb-5 md:px-6">
      <PageHeader
        icon="mdi:whatsapp"
        title="WhatsApp"
        subtitle="Conecte sua conta do WhatsApp para enviar notificações"
        className="border-b border-slate-800/90 bg-none px-0 py-0 pb-2"
      />

      <div className="mx-auto max-w-2xl space-y-8">
        {/* Status da Conexão */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-md">
          <h2 className="mb-6 text-lg font-semibold text-[var(--text-primary)]">
            Status da Conexão
          </h2>

          <div className="flex items-center justify-center gap-2">
            {(
              [
                "disconnected",
                "connecting",
                "connected",
                "open",
              ] as ConnectionStep[]
            ).map((step, i, arr) => (
              <div key={step} className="flex items-center gap-2">
                <StepIndicator step={step} current={currentStep} />
                {i < arr.length - 1 && (
                  <div
                    className={`h-px w-8 ${
                      arr.indexOf(currentStep) > i
                        ? "bg-green-500"
                        : "bg-slate-800"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Criar / Conectar Instância */}
        {!instance ? (
          <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-md">
            <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">
              Conectar WhatsApp
            </h2>
            <p className="mb-6 text-sm text-slate-400">
              Crie uma instância e leia o QR Code com o WhatsApp do celular que
              será usado para enviar as mensagens.
            </p>

            <div className="flex items-end gap-2">
              <div className="w-full flex-1">
                <FormInput
                  label="Nome da Instância"
                  icon="mdi:whatsapp"
                  type="text"
                  placeholder="ex: igreja-principal"
                  value={instanceName}
                  variant="full"
                  onChange={(e) => setInstanceName(e.target.value)}
                />
              </div>
              <FormButton
                label="Criar"
                icon="mdi:plus"
                isPending={createInstance.isPending}
                onClick={handleCreate}
              />
            </div>

            {/* QR Code */}
            {qrCode && (
              <div className="mt-6 flex flex-col items-center gap-4">
                <QRCodeDisplay base64String={qrCode} />

                {pairingCode && (
                  <p className="text-sm text-slate-400">
                    Ou use o código de pareamento:{" "}
                    <span className="font-mono font-bold text-cyan-400">
                      {pairingCode}
                    </span>
                  </p>
                )}

                <button
                  onClick={handleRefreshQr}
                  className="flex items-center gap-1 text-sm text-cyan-400 transition-colors hover:text-cyan-300"
                >
                  <Icon icon="mdi:refresh" />
                  Atualizar QR Code
                </button>
              </div>
            )}
          </section>
        ) : (
          /* Instância existente */
          <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  {instance.instanceName}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {connectionState === "open"
                    ? "WhatsApp conectado e pronto para enviar mensagens"
                    : connectionState === "connecting"
                      ? "Aguardando leitura do QR Code..."
                      : "Desconectado"}
                </p>
              </div>
              <div
                className={`flex h-3 w-3 rounded-full ${
                  connectionState === "open"
                    ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"
                    : connectionState === "connecting"
                      ? "animate-pulse bg-yellow-500"
                      : "bg-red-500"
                }`}
              />
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              {connectionState !== "open" && (
                <button
                  onClick={handleRefreshQr}
                  className="flex items-center gap-1 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800"
                >
                  <Icon icon="mdi:refresh" />
                  Gerar QR Code
                </button>
              )}
              {connectionState === "open" && (
                <button
                  onClick={() => restartInstance.mutate(instance.instanceName)}
                  disabled={restartInstance.isPending}
                  className="flex items-center gap-1 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800"
                >
                  <Icon icon="mdi:restart" />
                  Reiniciar
                </button>
              )}
              <button
                onClick={() => openModal("DeleteInstance")}
                className="flex items-center gap-1 rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10"
              >
                <Icon icon="mdi:link-off" />
                Desconectar
              </button>
            </div>

            {/* QR Code para reconectar */}
            {qrCode && connectionState !== "open" && (
              <div className="mt-6 flex flex-col items-center gap-4">
                <QRCodeDisplay base64String={qrCode} />

                {/* {pairingCode && (
                  <p className="text-sm text-slate-400">
                    Código de pareamento:{" "}
                    <span className="font-mono font-bold text-cyan-400">
                      {pairingCode}
                    </span>
                  </p>
                )} */}
              </div>
            )}
          </section>
        )}

        {/* Informações */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-md">
          <h2 className="mb-3 text-lg font-semibold text-[var(--text-primary)]">
            Como funciona
          </h2>
          <ul className="space-y-2 text-sm text-slate-400">
            <li className="flex items-start gap-2">
              <Icon
                icon="mdi:numeric-1-circle-outline"
                className="mt-0.5 shrink-0 text-cyan-400"
              />
              Crie uma instância com um nome único para sua conexão.
            </li>
            <li className="flex items-start gap-2">
              <Icon
                icon="mdi:numeric-2-circle-outline"
                className="mt-0.5 shrink-0 text-cyan-400"
              />
              Leia o QR Code com o WhatsApp do celular (WhatsApp Web).
            </li>
            <li className="flex items-start gap-2">
              <Icon
                icon="mdi:numeric-3-circle-outline"
                className="mt-0.5 shrink-0 text-cyan-400"
              />
              Mantenha o celular conectado à internet para o envio de mensagens.
            </li>
          </ul>
        </section>

        {/* Dicas */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-md">
          <h2 className="mb-3 text-lg font-semibold text-[var(--text-primary)]">
            Dicas importantes
          </h2>
          <ul className="space-y-2 text-sm text-slate-400">
            <li className="flex items-start gap-2">
              <Icon
                icon="mdi:lightbulb-outline"
                className="mt-0.5 shrink-0 text-yellow-400"
              />
              Use um número exclusivo para a igreja para evitar bloqueios por
              excesso de mensagens.
            </li>
            <li className="flex items-start gap-2">
              <Icon
                icon="mdi:lightbulb-outline"
                className="mt-0.5 shrink-0 text-yellow-400"
              />
              O QR Code tem validade limitada — se expirar, gere um novo
              clicando em "Gerar QR Code".
            </li>
            <li className="flex items-start gap-2">
              <Icon
                icon="mdi:lightbulb-outline"
                className="mt-0.5 shrink-0 text-yellow-400"
              />
              Se o WhatsApp cair, use "Reiniciar" para restabelecer a conexão.
            </li>
          </ul>
        </section>
      </div>

      {/* Modal de Confirmação */}
      <Modal id="DeleteInstance">
        <Dialog
          id="DeleteInstance"
          disabled={deleteInstance.isPending}
          onClick={handleDisconnect}
          message="Tem certeza que deseja desconectar o WhatsApp? Todos os agendamentos de mensagens serão interrompidos."
        />
      </Modal>
    </div>
  );
}
