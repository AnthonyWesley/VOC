import churchApi from "../../api/axios";

import {
  CloseEventInput,
  DetailedEventDTO,
  ListEventsInput,
  PaginatedEventsOutput,
} from "../types/eventTypes";

export const eventService = {
  /** CREATE or CLOSE EVENT */
  create: async (data: CloseEventInput): Promise<{ id: string }> => {
    const response = await churchApi.post(`/events`, data);
    return response.data;
  },

  /** GET EVENT BY ID */
  find: async (eventId: string): Promise<DetailedEventDTO> => {
    const response = await churchApi.get(`/events/${eventId}`);
    return response.data;
  },

  /** LIST EVENTS WITH PAGINATION */
  list: async (params: ListEventsInput): Promise<PaginatedEventsOutput> => {
    const queryParams: Record<string, any> = {
      limit: params.limit,
      month: params.month,
      year: params.year,
    };

    if (params.cursor) queryParams.cursor = params.cursor;
    if (params.type) queryParams.type = params.type;

    const response = await churchApi.get("/events", { params: queryParams });

    return {
      data: response.data.data ?? [],
      nextCursor: response.data.nextCursor ?? null,
    };
  },

  /** UPDATE EVENT */
  update: async (
    eventId: string,
    data: Partial<CloseEventInput["event"]>,
  ): Promise<DetailedEventDTO> => {
    const response = await churchApi.patch(`/events/${eventId}`, data);
    return response.data;
  },

  /** ASSIGN MEMBER */
  assignMember: async (
    eventId: string,
    memberId: string,
    ministryId?: string,
  ) => {
    return churchApi.patch(`/events/${eventId}/assignMember`, {
      memberId,
      ministryId,
    });
  },

  /** REMOVE MEMBER */
  removeMember: async (
    eventId: string,
    memberId: string,
    assignmentId?: string,
  ) => {
    return churchApi.patch(`/events/${eventId}/removeMember`, {
      memberId,
      assignmentId,
    });
  },
};
