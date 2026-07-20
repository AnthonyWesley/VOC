import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import MemberForm from "../components/MemberForm";
import { publicMemberService } from "../services/publicMemberService";

export default function MemberRegistrationPage() {
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: publicMemberService.register,
    onSuccess: () => {
      setSuccess(true);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Erro ao realizar cadastro");
    },
  });

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => navigate("/"), 3000);
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  if (success) {
    return (
      <div className="min-h-screen w-full bg-[#071126] text-white">
        <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 py-24 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20">
            <Icon icon="mdi:check-circle" className="text-5xl text-green-400" />
          </div>
          <h1 className="mb-4 text-3xl font-black uppercase">Obrigado por se cadastrar!</h1>
          <p className="text-sm text-slate-400">
            Seu cadastro foi realizado com sucesso. Em breve você receberá mais informações.
          </p>
          <p className="mt-8 text-xs text-slate-500">Redirecionando para a página inicial...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#071126] text-white">
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 py-24">
        <Link
          to="/"
          className="mb-8 self-start text-sm font-bold tracking-[0.12em] text-sky-700 uppercase transition hover:text-sky-400"
        >
          <Icon icon="mdi:arrow-left" className="-ml-1 mr-1 inline-block" />
          Voltar
        </Link>

        <div className="mb-10 text-center">
          <img
            src="/images/logo-white.png"
            alt="VOC Church"
            className="mx-auto mb-6 h-6 w-auto"
          />
          <p className="text-xs font-bold tracking-[0.2em] text-sky-700 uppercase">
            Cadastro
          </p>
          <h1 className="mt-3 text-3xl font-black uppercase sm:text-4xl">
            Seja Bem-Vindo
          </h1>
          <p className="mt-3 text-sm text-slate-400">
            Preencha seus dados para se cadastrar em nossa igreja
          </p>
        </div>

        <div className="w-full">
          <MemberForm
            onSave={(payload) => {
              mutate({
                fullName: payload.fullName,
                nickname: payload.nickname || undefined,
                birthDate: payload.birthDate.toISOString(),
                phone: payload.phone,
                address: payload.address,
                postcode: payload.postcode,
                baptismDate: payload.baptismDate
                  ? payload.baptismDate.toISOString()
                  : undefined,
                churchJoinDate: payload.churchJoinDate.toISOString(),
              });
            }}
            savePending={isPending}
            hideHeader
          />
        </div>
      </div>
    </div>
  );
}
