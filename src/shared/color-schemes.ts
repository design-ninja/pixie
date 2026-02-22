import {
  type ColorFormatId,
  COLOR_FORMAT_IDS,
  getHexFormats,
  normalizeHex
} from "./color-engine.js";

export type FormatSnapshot = Record<ColorFormatId, string>;

export type HistoryEntry = {
  id: string;
  createdAt: string;
  sourceHex: string;
  formatAtPick: ColorFormatId;
  valueAtPick: string;
  values: FormatSnapshot;
};

const DEFAULT_SOURCE_HEX = "#000000";

function getRandomId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeSourceHex(sourceHex: string): string {
  try {
    return normalizeHex(sourceHex);
  } catch {
    return DEFAULT_SOURCE_HEX;
  }
}

export function createHistoryEntry(sourceHex: string, formatAtPick: ColorFormatId): HistoryEntry {
  const normalizedHex = normalizeSourceHex(sourceHex);
  const values = getHexFormats(normalizedHex);

  return {
    id: getRandomId(),
    createdAt: new Date().toISOString(),
    sourceHex: normalizedHex,
    formatAtPick,
    valueAtPick: values[formatAtPick],
    values
  };
}

export function isColorFormatId(value: unknown): value is ColorFormatId {
  return typeof value === "string" && (COLOR_FORMAT_IDS as string[]).includes(value);
}
