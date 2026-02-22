import { createHistoryEntryElement, showToast } from "./dom.js";
import { setupPopupMenu } from "./menu.js";
import {
  clearColorHistory,
  getActiveOutputFormat,
  getColorHistory,
  removeHistoryEntryById,
  setActiveOutputFormat
} from "../shared/storage.js";
import { COLOR_FORMAT_IDS, COLOR_FORMAT_LABELS, type ColorFormatId } from "../shared/color-engine.js";
import type { ClearBadgeMessage, PopupToContentMessage } from "../shared/messages.js";

const REVIEW_URL =
  "https://chrome.google.com/webstore/detail/hexpicker-%E2%80%94-a-simple-hex/nbfoiiglmnkmdhhaenkekmodabpcfnhc?utm_source=ext_sidebar&hl=en-GB";
const COFFEE_URL = "https://www.buymeacoffee.com/design_ninja";
const RESTRICTED_PAGE_MESSAGE = "ColorPicker can't access this page";

function getRequiredElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Required element not found: ${selector}`);
  }
  return element;
}

function isRestrictedTabUrl(url: string): boolean {
  return (
    url.startsWith("chrome://") ||
    url.startsWith("chrome-extension://") ||
    url.startsWith("devtools://") ||
    url.startsWith("about:") ||
    url.startsWith("view-source:") ||
    url.startsWith("edge://") ||
    url.startsWith("file://") ||
    url.startsWith("https://chrome.google.com/webstore") ||
    url.startsWith("https://chromewebstore.google.com")
  );
}

function renderFormatOptions(select: HTMLSelectElement, activeFormat: ColorFormatId): void {
  select.innerHTML = "";

  COLOR_FORMAT_IDS.forEach((format) => {
    const option = document.createElement("option");
    option.value = format;
    option.innerText = COLOR_FORMAT_LABELS[format];

    if (format === activeFormat) {
      option.selected = true;
    }

    select.appendChild(option);
  });
}

window.addEventListener("DOMContentLoaded", async () => {
  const mainContainer = getRequiredElement<HTMLElement>("#mainCont");
  const header = getRequiredElement<HTMLElement>("#header");
  const menu = getRequiredElement<HTMLElement>("#menu");
  const buttonContainer = getRequiredElement<HTMLElement>("#picker_btn_cont");
  const resultList = getRequiredElement<HTMLElement>("#result");
  const formatSelect = getRequiredElement<HTMLSelectElement>("#formatSelect");

  let isPickActionLocked = false;
  let activeOutputFormat = await getActiveOutputFormat();

  const clearBadgeMessage: ClearBadgeMessage = { query: "clear_badge" };

  renderFormatOptions(formatSelect, activeOutputFormat);

  const refreshPopup = async (): Promise<void> => {
    const history = await getColorHistory();
    resultList.innerHTML = "";
    resultList.classList.toggle("result--history", history.length > 0);

    if (history.length === 0) {
      const emptyState = document.createElement("p");
      emptyState.className = "empty-state";
      emptyState.innerText = "Pick a color to store values in multiple color types.";
      resultList.appendChild(emptyState);
      resultList.style.display = "block";
      return;
    }

    history.forEach((entry) => {
      const historyEntryElement = createHistoryEntryElement(entry, {
        onFormatClick: async (format, value) => {
          await navigator.clipboard.writeText(value);
          showToast(mainContainer, "#FEF2CE", `${COLOR_FORMAT_LABELS[format]} value copied!`);
        },
        onDelete: async (entryId) => {
          await removeHistoryEntryById(entryId);
          await refreshPopup();
          showToast(mainContainer, "#ffe7e7", "History entry deleted");
        }
      });

      resultList.appendChild(historyEntryElement);
    });

    resultList.style.display = "block";
  };

  formatSelect.addEventListener("change", async () => {
    activeOutputFormat = formatSelect.value as ColorFormatId;
    await setActiveOutputFormat(activeOutputFormat);
    showToast(mainContainer, "#dce9ff", `Pick format: ${COLOR_FORMAT_LABELS[activeOutputFormat]}`);
  });

  setupPopupMenu(menu, header, {
    onClearHistory: async () => {
      await clearColorHistory();
      await chrome.runtime.sendMessage(clearBadgeMessage);
      await refreshPopup();
    },
    onLeaveReview: () => {
      window.open(REVIEW_URL, "_blank");
    },
    onBuyCoffee: () => {
      window.open(COFFEE_URL, "_blank");
    }
  });

  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!activeTab || typeof activeTab.url !== "string") {
    buttonContainer.innerHTML = `<i>${RESTRICTED_PAGE_MESSAGE}</i>`;
  } else if (activeTab.url.startsWith("chrome")) {
    buttonContainer.innerHTML = "<i>ColorPicker can't access Chrome pages</i>";
  } else if (activeTab.url.startsWith("file")) {
    buttonContainer.innerHTML = "<i>ColorPicker can't access local pages</i>";
  } else if (isRestrictedTabUrl(activeTab.url)) {
    buttonContainer.innerHTML = `<i>${RESTRICTED_PAGE_MESSAGE}</i>`;
  } else {
    const pickButton = document.createElement("button");
    pickButton.id = "picker_btn";
    pickButton.innerText = "Pick a color";

    pickButton.addEventListener("click", async () => {
      if (isPickActionLocked) {
        return;
      }

      if (typeof EyeDropper === "undefined") {
        showToast(mainContainer, "#FEF2CE", "Your browser does not support the ColorPicker API");
        return;
      }

      if (typeof activeTab.id !== "number") {
        return;
      }

      isPickActionLocked = true;
      pickButton.disabled = true;

      const message: PopupToContentMessage = {
        from: "popup",
        query: "eye_dropper_clicked"
      };

      try {
        await chrome.tabs.sendMessage(activeTab.id, message);
        window.close();
      } catch {
        isPickActionLocked = false;
        pickButton.disabled = false;
        showToast(mainContainer, "#FEF2CE", "This page is not ready. Reload the tab and try again.");
      }
    });

    buttonContainer.appendChild(pickButton);
  }

  await refreshPopup();
});
