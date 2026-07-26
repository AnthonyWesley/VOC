export type EventoCriadoPayload = {
  eventId: string;
  eventTitle: string;
  eventType: string;
  needsScale: boolean;
};

export type MembroEscaladoPayload = {
  eventId: string;
  ministryId: string;
  ministryName: string;
  eventTitle: string;
  eventDate: string;
};

export type MemberAusentePayload = {
  memberId: string;
  memberName: string;
  eventType: string;
  daysSinceLastEvent: number;
};

export type MembroRemovidoPayload = {
  eventId: string;
  memberId: string;
  ministryName: string;
  eventTitle: string;
  eventDate: string;
};

export type MembroVinculadoPayload = {
  memberId: string;
  memberName: string;
};
