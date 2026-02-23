import { isClearBadgeMessage, isHistoryEntrySavedMessage } from "../shared/messages.js";

const DEFAULT_ACTION_TITLE = "Pixie - Color Picker";

chrome.runtime.onMessage.addListener((message: unknown) => {
  if (isHistoryEntrySavedMessage(message)) {
    chrome.action.setTitle({ title: `Pixie copied: ${message.sourceColor}` });
    return;
  }

  if (isClearBadgeMessage(message)) {
    chrome.action.setTitle({ title: DEFAULT_ACTION_TITLE });
  }
});
