import {
  COLOR_FORMAT_IDS,
  type ColorFormatId,
  getHexFormats,
  normalizeHex
} from "./color-engine.js";
import { type HistoryEntry, isColorFormatId } from "./color-schemes.js";

export type OutputFormat = ColorFormatId;

export const DEFAULT_OUTPUT_FORMAT: OutputFormat = "hex";
export const MAX_HISTORY_ENTRIES = 1000;

export type StorageSchema = {
  color_history?: HistoryEntry[];
  active_output_format?: OutputFormat;
  color_hex_code?: string[];
};

const STORAGE_KEYS = {
  HISTORY: "color_history",
  ACTIVE_OUTPUT_FORMAT: "active_output_format",
  LEGACY_COLORS: "color_hex_code"
} as const;

type StorageKey = keyof StorageSchema;

function clampHistorySize(history: HistoryEntry[]): HistoryEntry[] {
  if (history.length <= MAX_HISTORY_ENTRIES) {
    return history;
  }

  return history.slice(0, MAX_HISTORY_ENTRIES);
}

function getRuntimeError(apiMethod: string): Error | null {
  const message = chrome.runtime.lastError?.message;
  if (!message) {
    return null;
  }

  return new Error(`${apiMethod} failed: ${message}`);
}

function storageGet<K extends StorageKey>(key: K): Promise<Pick<StorageSchema, K>> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(key, (data) => {
      const runtimeError = getRuntimeError("chrome.storage.local.get");
      if (runtimeError) {
        reject(runtimeError);
        return;
      }

      resolve(data as Pick<StorageSchema, K>);
    });
  });
}

function storageGetMany<K extends StorageKey>(keys: K[]): Promise<Pick<StorageSchema, K>> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, (data) => {
      const runtimeError = getRuntimeError("chrome.storage.local.get");
      if (runtimeError) {
        reject(runtimeError);
        return;
      }

      resolve(data as Pick<StorageSchema, K>);
    });
  });
}

function storageSet(data: Partial<StorageSchema>): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(data, () => {
      const runtimeError = getRuntimeError("chrome.storage.local.set");
      if (runtimeError) {
        reject(runtimeError);
        return;
      }

      resolve();
    });
  });
}

function storageRemove(key: StorageKey | StorageKey[]): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.remove(key, () => {
      const runtimeError = getRuntimeError("chrome.storage.local.remove");
      if (runtimeError) {
        reject(runtimeError);
        return;
      }

      resolve();
    });
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
  try {
    const sourceHex = typeof entry.sourceHex === "string" ? normalizeHex(entry.sourceHex) : null;
    if (!sourceHex) {
      return null;
    }

    const values = getHexFormats(sourceHex);
    const formatAtPick =
      isColorFormatId(entry.formatAtPick) && typeof entry.valueAtPick === "string"
        ? entry.formatAtPick
        : fallbackFormat;

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
  } catch {
    return null;
  }
}

function createHistoryEntryFromLegacyHex(hex: string): HistoryEntry | null {
  const normalizedHex = normalizeHex(hex);
  const values = getHexFormats(normalizedHex);
  const preservedHex = /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : values.hex;

  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString(),
    sourceHex: preservedHex,
    formatAtPick: "hex",
    valueAtPick: preservedHex,
    values: {
      ...values,
      hex: preservedHex
    }
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
    .filter((item): item is HistoryEntry => item !== null);

  return normalized;
}

async function migrateLegacyColors(): Promise<HistoryEntry[]> {
  const data = await storageGet(STORAGE_KEYS.LEGACY_COLORS);
  const legacyColors = data.color_hex_code;

  if (!Array.isArray(legacyColors) || legacyColors.length === 0) {
    return [];
  }

  const migrated = legacyColors
    .map((hex) => {
      try {
        return createHistoryEntryFromLegacyHex(hex);
      } catch {
        return null;
      }
    })
    .filter((item): item is HistoryEntry => item !== null);

  const next = clampHistorySize(migrated);
  await setColorHistory(next);
  await storageRemove(STORAGE_KEYS.LEGACY_COLORS);

  return next;
}

export async function getColorHistory(): Promise<HistoryEntry[]> {
  const data = await storageGetMany([STORAGE_KEYS.HISTORY, STORAGE_KEYS.ACTIVE_OUTPUT_FORMAT]);
  const fallbackFormat = isOutputFormat(data.active_output_format) ? data.active_output_format : DEFAULT_OUTPUT_FORMAT;
  const history = sanitizeHistoryEntries(data.color_history, fallbackFormat);

  if (history.length > 0) {
    return history;
  }

  return migrateLegacyColors();
}

export async function setColorHistory(history: HistoryEntry[]): Promise<void> {
  await storageSet({ color_history: clampHistorySize(history) });
}

export async function addHistoryEntry(entry: HistoryEntry): Promise<HistoryEntry[]> {
  const history = await getColorHistory();
  const next = clampHistorySize([entry, ...history]);

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
