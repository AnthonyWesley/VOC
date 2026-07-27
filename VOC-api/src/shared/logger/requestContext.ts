import { AsyncLocalStorage } from "async_hooks";

export type RequestContext = {
  requestId: string;
};

export const requestContextStorage = new AsyncLocalStorage<RequestContext>();

export function getRequestContext(): RequestContext | undefined {
  return requestContextStorage.getStore();
}

export function getRequestId(): string {
  return getRequestContext()?.requestId ?? "no-request-context";
}
