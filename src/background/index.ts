import { isBadgeColorMessage, isClearBadgeMessage, isHistoryEntrySavedMessage } from "../shared/messages.js";

chrome.runtime.onMessage.addListener((message: unknown) => {
  if (isHistoryEntrySavedMessage(message)) {
    chrome.action.setBadgeBackgroundColor({ color: message.sourceColor });
    chrome.action.setBadgeText({ text: " " });
    return;
  }

  if (isBadgeColorMessage(message)) {
    chrome.action.setBadgeBackgroundColor({ color: message.color });
    chrome.action.setBadgeText({ text: " " });
    return;
  }

  if (isClearBadgeMessage(message)) {
    chrome.action.setBadgeText({ text: "" });
  }
});
