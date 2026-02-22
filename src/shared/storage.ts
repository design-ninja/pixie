export type StorageSchema = {
  color_hex_code?: string[];
  isExpanded?: boolean;
};

function storageGet<K extends keyof StorageSchema>(key: K): Promise<Pick<StorageSchema, K>> {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (data) => {
      resolve(data as Pick<StorageSchema, K>);
    });
  });
}

function storageSet(data: Partial<StorageSchema>): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set(data, () => resolve());
  });
}

function storageRemove(key: keyof StorageSchema): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.remove(key, () => resolve());
  });
}

export async function getStoredColors(): Promise<string[]> {
  const data = await storageGet("color_hex_code");
  return Array.isArray(data.color_hex_code) ? data.color_hex_code : [];
}

export async function setStoredColors(colors: string[]): Promise<void> {
  await storageSet({ color_hex_code: colors });
}

export async function removeStoredColors(): Promise<void> {
  await storageRemove("color_hex_code");
}

export async function getExpandedState(): Promise<boolean> {
  const data = await storageGet("isExpanded");
  return data.isExpanded ?? false;
}

export async function setExpandedState(isExpanded: boolean): Promise<void> {
  await storageSet({ isExpanded });
}
