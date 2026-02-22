import { isBadgeColorMessage, isClearBadgeMessage } from "../shared/messages.js";

chrome.runtime.onMessage.addListener((message: unknown) => {
  if (isBadgeColorMessage(message)) {
    chrome.action.setBadgeBackgroundColor({ color: message.color });
    chrome.action.setBadgeText({ text: " " });
    return;
  }

  if (isClearBadgeMessage(message)) {
    chrome.action.setBadgeText({ text: "" });
  }
});
