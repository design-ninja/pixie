import type { HistoryEntry } from "./color-schemes.js";

export type PopupToContentMessage = {
  from: "popup";
  query: "eye_dropper_clicked";
};

export type HistoryEntrySavedMessage = {
  query: "history_entry_saved";
  sourceColor: string;
  entry: HistoryEntry;
};

export type ClearBadgeMessage = {
  query: "clear_badge";
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isPopupToContentMessage(message: unknown): message is PopupToContentMessage {
  if (!isObject(message)) {
    return false;
  }

  return message.from === "popup" && message.query === "eye_dropper_clicked";
}

export function isClearBadgeMessage(message: unknown): message is ClearBadgeMessage {
  if (!isObject(message)) {
    return false;
  }

  return message.query === "clear_badge";
}

export function isHistoryEntrySavedMessage(message: unknown): message is HistoryEntrySavedMessage {
  if (!isObject(message)) {
    return false;
  }

  return message.query === "history_entry_saved" && typeof message.sourceColor === "string" && isObject(message.entry);
}
