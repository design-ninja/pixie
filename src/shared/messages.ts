export type PopupToContentMessage = {
  from: "popup";
  query: "eye_dropper_clicked";
};

export type BadgeColorMessage = {
  color: string;
};

export type ClearBadgeMessage = {
  query: "clear_badge";
};

export type RuntimeMessage = PopupToContentMessage | BadgeColorMessage | ClearBadgeMessage;

export function isPopupToContentMessage(message: unknown): message is PopupToContentMessage {
  if (typeof message !== "object" || message === null) {
    return false;
  }

  const candidate = message as Record<string, unknown>;
  return candidate.from === "popup" && candidate.query === "eye_dropper_clicked";
}

export function isClearBadgeMessage(message: unknown): message is ClearBadgeMessage {
  if (typeof message !== "object" || message === null) {
    return false;
  }

  const candidate = message as Record<string, unknown>;
  return candidate.query === "clear_badge";
}

export function isBadgeColorMessage(message: unknown): message is BadgeColorMessage {
  if (typeof message !== "object" || message === null) {
    return false;
  }

  const candidate = message as Record<string, unknown>;
  return typeof candidate.color === "string";
}
