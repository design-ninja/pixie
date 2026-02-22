import { createHistoryEntry } from "../shared/color-schemes.js";
import { isPopupToContentMessage } from "../shared/messages.js";
import type { BadgeColorMessage, HistoryEntrySavedMessage } from "../shared/messages.js";
import { addHistoryEntry, getActiveOutputFormat } from "../shared/storage.js";

async function storePickedColor(sourceHex: string): Promise<string> {
  const activeOutputFormat = await getActiveOutputFormat();
  const entry = createHistoryEntry(sourceHex, activeOutputFormat);

  await addHistoryEntry(entry);

  const historyMessage: HistoryEntrySavedMessage = {
    query: "history_entry_saved",
    sourceColor: sourceHex,
    entry
  };

  const badgeMessage: BadgeColorMessage = {
    color: sourceHex
  };

  await chrome.runtime.sendMessage(historyMessage);
  await chrome.runtime.sendMessage(badgeMessage);

  return entry.valueAtPick;
}

chrome.runtime.onMessage.addListener((message: unknown) => {
  if (!isPopupToContentMessage(message)) {
    return;
  }

  window.setTimeout(() => {
    const eyeDropper = new EyeDropper();

    eyeDropper
      .open()
      .then(async (result) => {
        const color = result.sRGBHex;
        const copiedValue = await storePickedColor(color);

        try {
          await navigator.clipboard.writeText(copiedValue);
        } catch (error) {
          console.error("Could not copy color:", error);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }, 500);
});
