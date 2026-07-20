import { useEffect, useRef, useState } from "react";
import Card from "../../components/Card";
import { fieldFormatter } from "../../helpers/fieldFormatter";
import { useMemberMutations } from "../hooks/useMemberMutations";
import { calculateAge } from "../../helpers/calculateAge";

import { PageHeader } from "../../components/PageHeader";
import { FormInput } from "../../components/FormInput";
import { FormButton } from "../../components/FormButton";
import { hasChanges } from "../../helpers/hasChanges";
import { postcodeService } from "../services/postcodeService";

type MemberFormProps = {
  member?: any;
  onSave?: (payload: any) => void;
  savePending?: boolean;
  hideHeader?: boolean;
};

export default function MemberForm({
  member,
  onSave,
  savePending,
  hideHeader,
}: MemberFormProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nickname, setNickname] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneFormat, setPhoneFormat] = useState<"br" | "uk">("uk");
  const [postcode, setPostcode] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [street, setStreet] = useState("");
  const [location, setLocation] = useState("");
  const [baptismDate, setBaptismDate] = useState("");
  const [churchJoinDate, setChurchJoinDate] = useState("");

  const [isFirstTime, setIsFirstTime] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { createMember, updateMember } = useMemberMutations();
  const isPending =
    savePending ?? (createMember.isPending || updateMember.isPending);
  const originalValues = useRef<any | null>(null);

  useEffect(() => {
    if (member) {
      const nameParts = (member.fullName ?? "").split(/\s+/);
      const mapped = {
        firstName: nameParts[0] ?? "",
        lastName: nameParts.slice(1).join(" ") ?? "",
        nickname: member.nickname ?? "",
        birthDate: member.birthDate?.split("T")[0] ?? "",
        phone: member.phone ?? "",
        address: member.address ?? "",
        postcode: member.postcode ?? "",
        street: member.address ?? "",
        location: "",
        baptismDate: member.baptismDate?.split("T")[0] ?? "",
        churchJoinDate: member.churchJoinDate?.split("T")[0] ?? "",
        isFirstTime: false,
      };

      setFirstName(mapped.firstName);
      setLastName(mapped.lastName);
      setNickname(mapped.nickname);
      setBirthDate(mapped.birthDate);
      setPhone(mapped.phone);
      // setAddress(mapped.address);
      setPostcode(mapped.postcode);
      setStreet(mapped.street);
      setLocation(mapped.location);
      setBaptismDate(mapped.baptismDate);
      setChurchJoinDate(mapped.churchJoinDate);
      setIsFirstTime(mapped.isFirstTime);

      originalValues.current = mapped; // ← snapshot original
    }
  }, [member]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!firstName.trim()) errs.firstName = "O nome é obrigatório";
    if (!lastName.trim()) errs.lastName = "O sobrenome é obrigatório";
    if (!birthDate) errs.birthDate = "A data de nascimento é obrigatória";

    const age = birthDate ? calculateAge(birthDate) : null;
    const phoneRequired = age !== null && age >= 16;
    if (phoneRequired && !phone.replace(/\D/g, ""))
      errs.phone = "O telefone é obrigatório para maiores de 16 anos";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const combinedAddress = [street.trim(), location.trim()]
      .filter(Boolean)
      .join(", ");

    const payload = {
      fullName: fieldFormatter.name(fullName),
      normalizedFullName: fieldFormatter.name(fullName).toLowerCase(),
      nickname: nickname.trim(),
      birthDate: new Date(birthDate),
      phone:
        phoneFormat === "br"
          ? fieldFormatter.phone(phone)
          : phone.replace(/\D/g, ""),
      address: combinedAddress,
      postcode,
      normalizedPostcode: fieldFormatter.normalizePostcodeUK(postcode),
      baptismDate: baptismDate ? new Date(baptismDate) : undefined,
      churchJoinDate: isFirstTime ? new Date() : new Date(churchJoinDate),
      isFirstTime,
    };

    if (onSave) {
      onSave(payload);
    } else if (member) {
      updateMember.mutate({
        memberId: member.id,
        data: payload,
      });
    } else {
      createMember.mutate(payload);
    }
  };

  const currentValues = {
    firstName,
    lastName,
    nickname,
    birthDate,
    phone,
    street,
    location,
    postcode,
    baptismDate,
    churchJoinDate,
    isFirstTime,
  };

  async function handlePostcodeLookup() {
    const raw = postcode.replace(/\s/g, "");
    if (raw.length < 5) return;

    setLookupLoading(true);
    try {
      const result = await postcodeService.lookup(raw);
      if (result?.address) {
        setLocation(result.address);
      }
    } catch {
      // lookup failed silently
    } finally {
      setLookupLoading(false);
    }
  }

  return (
    <Card className="h-[88vh] overflow-y-scroll p-0">
      {!hideHeader && (
        <PageHeader
          icon={member ? "mdi:account-edit" : "mdi:account-plus"}
          title={member ? "Editar Membro" : "Novo Membro"}
          subtitle="Preencha seus dados abaixo para fazer parte da nossa comunidade"
        />
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-8 p-6">
        {/* SEÇÃO 1: DADOS PESSOAIS */}
        <fieldset className="flex flex-col gap-4">
          <legend className="mb-2 text-sm font-semibold tracking-wider text-[var(--primary)] uppercase">
            1. Dados Pessoais
          </legend>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <FormInput
              label="Nome"
              icon="mdi:account-outline"
              type="text"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                setErrors((prev) => ({ ...prev, firstName: "" }));
              }}
              required
              error={errors.firstName}
            />

            <FormInput
              label="Sobrenome"
              icon="mdi:account-outline"
              type="text"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                setErrors((prev) => ({ ...prev, lastName: "" }));
              }}
              required
              error={errors.lastName}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <FormInput
              label="Data de Nascimento"
              icon="mdi:cake-variant-outline"
              type="date"
              value={birthDate}
              onChange={(e) => {
                setBirthDate(e.target.value);
                setErrors((prev) => ({ ...prev, birthDate: "" }));
              }}
              required
              error={errors.birthDate}
            />

            <FormInput
              label="Apelido (Como gosta de ser chamado)"
              icon="mdi:tag-text-outline"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>
        </fieldset>

        <hr className="border-[var(--card-border)]" />

        {/* SEÇÃO 2: CONTATO E LOCALIZAÇÃO */}
        <fieldset className="flex flex-col gap-4">
          <legend className="mb-2 text-sm font-semibold tracking-wider text-[var(--primary)] uppercase">
            2. Contato e Endereço
          </legend>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Telefone com seletor de país */}
            <FormInput
              label="Telefone"
              icon="mdi:phone-outline"
              variant="full"
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setErrors((prev) => ({ ...prev, phone: "" }));
              }}
              required={birthDate ? (calculateAge(birthDate) ?? 0) >= 16 : false}
              phoneCountry={phoneFormat}
              onPhoneCountryChange={setPhoneFormat}
              key={phoneFormat}
              error={errors.phone}
            />

            {/* CEP / Postcode */}
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <FormInput
                  label="CEP / Código Postal"
                  icon="mdi:map-marker-outline"
                  type="postcode-uk"
                  value={postcode}
                  onChange={(e) => {
                    setPostcode(e.target.value);
                    setLookupLoading(false);
                  }}
                />
              </div>
              <button
                type="button"
                disabled={
                  lookupLoading || postcode.replace(/\s/g, "").length < 5
                }
                onClick={handlePostcodeLookup}
                className="mb-1 flex h-10 items-center gap-1 rounded-md bg-[var(--primary)] px-3 text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {lookupLoading ? (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  "Buscar"
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <FormInput
              label="Rua e Número"
              icon="mdi:road-variant"
              type="text"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
            />

            {location && (
              <div className="animate-fadeIn rounded-lg border border-[var(--card-border)] bg-[var(--card-top)] px-4 py-3 text-sm text-[var(--text-primary)]">
                {location}
              </div>
            )}
          </div>
        </fieldset>

        <hr className="border-[var(--card-border)]" />

        {/* SEÇÃO 3: DADOS ECLESIASTICOS */}
        <fieldset className="flex flex-col gap-4">
          <legend className="mb-2 text-sm font-semibold tracking-wider text-[var(--primary)] uppercase">
            3. Sua Vida na Igreja
          </legend>

          <div className="flex flex-col gap-4 rounded-lg border border-[var(--card-border)] bg-[var(--card-top)] p-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
              <input
                type="checkbox"
                className="h-4 w-4 rounded text-[var(--primary)] focus:ring-[var(--primary)]"
                checked={isFirstTime}
                onChange={(e) => setIsFirstTime(e.target.checked)}
              />
              Esta é a minha primeira vez na igreja
            </label>

            {!isFirstTime && (
              <div className="animate-fadeIn">
                <FormInput
                  label="Data Aproximada de Ingresso *"
                  icon="mdi:calendar-check-outline"
                  type="date"
                  value={churchJoinDate}
                  onChange={(e) => setChurchJoinDate(e.target.value)}
                  required={!isFirstTime}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <FormInput
              label="Data do Batismo (Se aplicável)"
              icon="mdi:water-outline"
              type="date"
              value={baptismDate}
              onChange={(e) => setBaptismDate(e.target.value)}
            />
          </div>
        </fieldset>

        {/* BOTÃO DE ENVIO */}
        <div className="mt-4">
          <FormButton
            type="submit"
            label={member ? "Atualizar Cadastro" : "Concluir Meu Cadastro"}
            icon="mdi:content-save"
            isPending={isPending}
            disabled={
              isPending ||
              (member &&
                !onSave &&
                !hasChanges(originalValues.current, currentValues))
            }
          />
        </div>
      </form>
    </Card>
  );
}
