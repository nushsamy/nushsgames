import { createApiClient, MYSTERY_API_URL } from "@/api/httpClient";

const api = createApiClient(MYSTERY_API_URL);
import type { MysteryEvent } from "@/mystery/api/types";

export function createEvent(title: string): Promise<MysteryEvent> {
  return api.post<MysteryEvent>("/events", { title });
}

export function listEvents(): Promise<MysteryEvent[]> {
  return api.get<MysteryEvent[]>("/events");
}

export function getEvent(eventId: number): Promise<MysteryEvent> {
  return api.get<MysteryEvent>(`/events/${eventId}`);
}

export function updateEvent(eventId: number, title: string): Promise<MysteryEvent> {
  return api.patch<MysteryEvent>(`/events/${eventId}`, { title });
}

export function deleteEvent(eventId: number): Promise<void> {
  return api.delete<void>(`/events/${eventId}`);
}

export function startEvent(eventId: number): Promise<MysteryEvent> {
  return api.post<MysteryEvent>(`/events/${eventId}/start`);
}

export function endEvent(eventId: number): Promise<MysteryEvent> {
  return api.post<MysteryEvent>(`/events/${eventId}/end`);
}
