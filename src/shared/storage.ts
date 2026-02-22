import {
  COLOR_FORMAT_IDS,
  type ColorFormatId,
  getHexFormats,
  normalizeHex
} from "./color-engine.js";
import { createHistoryEntry, type HistoryEntry, isColorFormatId } from "./color-schemes.js";

export type OutputFormat = ColorFormatId;

export const DEFAULT_OUTPUT_FORMAT: OutputFormat = "hex";
export const HISTORY_LIMIT = 50;

export type StorageSchema = {
  color_history?: HistoryEntry[];
  active_output_format?: OutputFormat;
  isExpanded?: boolean;
  color_hex_code?: string[];
};

const STORAGE_KEYS = {
  HISTORY: "color_history",
  ACTIVE_OUTPUT_FORMAT: "active_output_format",
  LEGACY_COLORS: "color_hex_code",
  EXPANDED: "isExpanded"
} as const;

type StorageKey = keyof StorageSchema;

function storageGet<K extends StorageKey>(key: K): Promise<Pick<StorageSchema, K>> {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (data) => {
      resolve(data as Pick<StorageSchema, K>);
    });
  });
}

function storageGetMany<K extends StorageKey>(keys: K[]): Promise<Pick<StorageSchema, K>> {
  return new Promise((resolve) => {
    chrome.storage.local.get(keys, (data) => {
      resolve(data as Pick<StorageSchema, K>);
    });
  });
}

function storageSet(data: Partial<StorageSchema>): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set(data, () => resolve());
  });
}

function storageRemove(key: StorageKey | StorageKey[]): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.remove(key, () => resolve());
  });
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isOutputFormat(value: unknown): value is OutputFormat {
  return typeof value === "string" && (COLOR_FORMAT_IDS as string[]).includes(value);
}

function isFormatSnapshot(value: unknown): value is Record<ColorFormatId, string> {
  if (!isObject(value)) {
    return false;
  }

  return COLOR_FORMAT_IDS.every((formatId) => typeof value[formatId] === "string");
}

function isHistoryEntry(value: unknown): value is HistoryEntry {
  if (!isObject(value)) {
    return false;
  }

  if (
    typeof value.id !== "string" ||
    typeof value.createdAt !== "string" ||
    typeof value.sourceHex !== "string" ||
    !isColorFormatId(value.formatAtPick) ||
    typeof value.valueAtPick !== "string" ||
    !isFormatSnapshot(value.values)
  ) {
    return false;
  }

  return true;
}

function normalizeLegacyEntry(entry: Record<string, unknown>, fallbackFormat: OutputFormat): HistoryEntry | null {
  const sourceHex = typeof entry.sourceHex === "string" ? normalizeHex(entry.sourceHex) : null;
  if (!sourceHex) {
    return null;
  }

  const values = getHexFormats(sourceHex);
  const formatAtPick =
    isColorFormatId(entry.formatAtPick) && typeof entry.valueAtPick === "string" ? entry.formatAtPick : fallbackFormat;

  const valueAtPick =
    isColorFormatId(entry.formatAtPick) && typeof entry.valueAtPick === "string"
      ? entry.valueAtPick
      : values[formatAtPick];

  return {
    id: typeof entry.id === "string" ? entry.id : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: typeof entry.createdAt === "string" ? entry.createdAt : new Date().toISOString(),
    sourceHex,
    formatAtPick,
    valueAtPick,
    values
  };
}

function sanitizeHistoryEntries(value: unknown, fallbackFormat: OutputFormat): HistoryEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalized = value
    .map((item) => {
      if (isHistoryEntry(item)) {
        return item;
      }

      if (isObject(item)) {
        return normalizeLegacyEntry(item, fallbackFormat);
      }

      return null;
    })
    .filter((item): item is HistoryEntry => item !== null)
    .slice(0, HISTORY_LIMIT);

  return normalized;
}

async function migrateLegacyColors(fallbackFormat: OutputFormat): Promise<HistoryEntry[]> {
  const data = await storageGet(STORAGE_KEYS.LEGACY_COLORS);
  const legacyColors = data.color_hex_code;

  if (!Array.isArray(legacyColors) || legacyColors.length === 0) {
    return [];
  }

  const migrated = legacyColors.slice(0, HISTORY_LIMIT).map((hex) => createHistoryEntry(hex, fallbackFormat));

  await storageSet({ color_history: migrated });
  await storageRemove(STORAGE_KEYS.LEGACY_COLORS);

  return migrated;
}

export async function getColorHistory(): Promise<HistoryEntry[]> {
  const data = await storageGetMany([STORAGE_KEYS.HISTORY, STORAGE_KEYS.ACTIVE_OUTPUT_FORMAT]);
  const fallbackFormat = isOutputFormat(data.active_output_format) ? data.active_output_format : DEFAULT_OUTPUT_FORMAT;
  const history = sanitizeHistoryEntries(data.color_history, fallbackFormat);

  if (history.length > 0) {
    return history;
  }

  return migrateLegacyColors(fallbackFormat);
}

export async function setColorHistory(history: HistoryEntry[]): Promise<void> {
  await storageSet({ color_history: history.slice(0, HISTORY_LIMIT) });
}

export async function addHistoryEntry(entry: HistoryEntry): Promise<HistoryEntry[]> {
  const history = await getColorHistory();
  const next = [entry, ...history].slice(0, HISTORY_LIMIT);

  await setColorHistory(next);

  return next;
}

export async function removeHistoryEntryById(entryId: string): Promise<HistoryEntry[]> {
  const history = await getColorHistory();
  const next = history.filter((entry) => entry.id !== entryId);

  await setColorHistory(next);

  return next;
}

export async function clearColorHistory(): Promise<void> {
  await storageRemove([STORAGE_KEYS.HISTORY, STORAGE_KEYS.LEGACY_COLORS]);
}

export async function getActiveOutputFormat(): Promise<OutputFormat> {
  const data = await storageGet(STORAGE_KEYS.ACTIVE_OUTPUT_FORMAT);

  if (isOutputFormat(data.active_output_format)) {
    return data.active_output_format;
  }

  await storageSet({ active_output_format: DEFAULT_OUTPUT_FORMAT });
  return DEFAULT_OUTPUT_FORMAT;
}

export async function setActiveOutputFormat(format: OutputFormat): Promise<void> {
  await storageSet({ active_output_format: format });
}

export async function getExpandedState(): Promise<boolean> {
  const data = await storageGet(STORAGE_KEYS.EXPANDED);
  return data.isExpanded ?? false;
}

export async function setExpandedState(isExpanded: boolean): Promise<void> {
  await storageSet({ isExpanded });
}
