import { createHistoryEntryElement, showToast } from "./dom.js";
import {
  clearColorHistory,
  getActiveOutputFormat,
  getColorHistory,
  removeHistoryEntryById,
  setActiveOutputFormat
} from "../shared/storage.js";
import { COLOR_FORMAT_IDS, COLOR_FORMAT_LABELS, type ColorFormatId } from "../shared/color-engine.js";
import type { ClearBadgeMessage, PopupToContentMessage } from "../shared/messages.js";

const REVIEW_URL = "https://chromewebstore.google.com/detail/nbfoiiglmnkmdhhaenkekmodabpcfnhc?utm_source=ext_sidebar";
const COFFEE_URL = "https://www.buymeacoffee.com/design_ninja";
const AUTHOR_URL = "https://lirik.pro/en";
const RESTRICTED_PAGE_MESSAGE = "Pixie can't access this page";
const CONTENT_SCRIPT_PATH = "scripts/content/index.js";

function confirmClearHistory(): Promise<boolean> {
  if (typeof HTMLDialogElement === "undefined") {
    return Promise.resolve(window.confirm("Clear all saved colors? This action cannot be undone."));
  }

  const dialog = document.createElement("dialog");
  dialog.className = "confirm-dialog";
  dialog.innerHTML = `
    <form method="dialog" class="confirm-dialog__form">
      <h2 class="confirm-dialog__title">Clear history?</h2>
      <p class="confirm-dialog__text">This will remove all saved colors. This action cannot be undone.</p>
      <div class="confirm-dialog__actions">
        <button type="submit" value="cancel" class="confirm-dialog__btn">Cancel</button>
        <button type="submit" value="confirm" class="confirm-dialog__btn confirm-dialog__btn--danger">Clear all</button>
      </div>
    </form>
  `;

  document.body.appendChild(dialog);

  return new Promise((resolve) => {
    dialog.addEventListener(
      "close",
      () => {
        const shouldClear = dialog.returnValue === "confirm";
        dialog.remove();
        resolve(shouldClear);
      },
      { once: true }
    );

    dialog.showModal();
  });
}

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

async function injectContentScript(tabId: number): Promise<void> {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: [CONTENT_SCRIPT_PATH]
  });
}

window.addEventListener("DOMContentLoaded", async () => {
  const mainContainer = getRequiredElement<HTMLElement>("#mainCont");
  const buttonContainer = getRequiredElement<HTMLElement>("#picker_btn_cont");
  const resultList = getRequiredElement<HTMLElement>("#result");
  const formatSelect = getRequiredElement<HTMLSelectElement>("#formatSelect");
  const historyCount = getRequiredElement<HTMLSpanElement>("#historyCount");
  const clearAllLink = getRequiredElement<HTMLButtonElement>("#clearAllLink");
  const leaveReviewLink = getRequiredElement<HTMLButtonElement>("#leaveReviewLink");
  const buyCoffeeLink = getRequiredElement<HTMLButtonElement>("#buyCoffeeLink");
  const authorLink = getRequiredElement<HTMLAnchorElement>("#authorLink");

  let isPickActionLocked = false;
  let activeOutputFormat = await getActiveOutputFormat();

  const logoTitle = document.querySelector<HTMLElement>(".title--rainbow");
  if (logoTitle) {
    let isAnimating = false;
    logoTitle.style.cursor = "pointer";
    logoTitle.addEventListener("click", () => {
      if (isAnimating) return;
      isAnimating = true;
      logoTitle.classList.add("title--rainbow-animate");
      logoTitle.addEventListener("animationend", () => {
        logoTitle.classList.remove("title--rainbow-animate");
        isAnimating = false;
      }, { once: true });
    });
  }

  const clearBadgeMessage: ClearBadgeMessage = { query: "clear_badge" };

  renderFormatOptions(formatSelect, activeOutputFormat);

  const clearAllHistory = async (): Promise<void> => {
    const shouldClear = await confirmClearHistory();

    if (!shouldClear) {
      return;
    }

    await clearColorHistory();
    await chrome.runtime.sendMessage(clearBadgeMessage);
    await refreshPopup();
    showToast(mainContainer, "danger", "Color history cleared");
  };

  const refreshPopup = async (): Promise<void> => {
    const history = await getColorHistory();
    resultList.innerHTML = "";
    resultList.classList.toggle("result--history", history.length > 0);
    clearAllLink.hidden = history.length === 0;
    historyCount.hidden = history.length === 0;
    historyCount.textContent = String(history.length);

    if (history.length === 0) {
      const emptyState = document.createElement("p");
      emptyState.className = "empty-state";
      emptyState.innerText = "Your palette is empty — grab a color and it\u2019ll show up here";
      resultList.appendChild(emptyState);
      resultList.style.display = "block";
      return;
    }

    history.forEach((entry) => {
      const historyEntryElement = createHistoryEntryElement(entry, {
        onFormatClick: async (format, value) => {
          try {
            await navigator.clipboard.writeText(value);
            showToast(mainContainer, "success", `${COLOR_FORMAT_LABELS[format]} value copied!`);
          } catch {
            showToast(mainContainer, "danger", "Could not copy value");
          }
        },
        onDelete: async (entryId) => {
          await removeHistoryEntryById(entryId);
          await refreshPopup();
          showToast(mainContainer, "danger", "History entry deleted");
        }
      });

      resultList.appendChild(historyEntryElement);
    });

    resultList.style.display = "block";
  };

  formatSelect.addEventListener("change", async () => {
    activeOutputFormat = formatSelect.value as ColorFormatId;
    await setActiveOutputFormat(activeOutputFormat);
    showToast(mainContainer, "info", `Pick format: ${COLOR_FORMAT_LABELS[activeOutputFormat]}`);
  });

  clearAllLink.addEventListener("click", () => {
    void clearAllHistory();
  });

  leaveReviewLink.addEventListener("click", () => {
    window.open(REVIEW_URL, "_blank");
  });

  buyCoffeeLink.addEventListener("click", () => {
    window.open(COFFEE_URL, "_blank");
  });

  authorLink.addEventListener("click", (event) => {
    event.preventDefault();
    window.open(AUTHOR_URL, "_blank");
  });

  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const renderDisabledButton = (message: string): void => {
    const btn = document.createElement("button");
    btn.id = "picker_btn";
    btn.className = "picker_btn--disabled";
    btn.disabled = true;
    btn.textContent = message;
    buttonContainer.appendChild(btn);
  };

  if (!activeTab || typeof activeTab.url !== "string") {
    renderDisabledButton(RESTRICTED_PAGE_MESSAGE);
  } else if (activeTab.url.startsWith("chrome")) {
    renderDisabledButton("Pixie can't access Chrome pages");
  } else if (activeTab.url.startsWith("file")) {
    renderDisabledButton("Pixie can't access local pages");
  } else if (isRestrictedTabUrl(activeTab.url)) {
    renderDisabledButton(RESTRICTED_PAGE_MESSAGE);
  } else {
    const pickButton = document.createElement("button");
    pickButton.id = "picker_btn";
    pickButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M27.857 4.144c-1.998-1.998-5.236-1.998-7.234 0l-3.828 3.827-.458-.458a1.452 1.452 0 0 0-2.054-.001l-1.027 1.027a1.452 1.452 0 0 0 0 2.054l8.151 8.15a1.452 1.452 0 0 0 2.054.001l1.027-1.026a1.452 1.452 0 0 0 0-2.055l-.458-.458 3.829-3.829c1.996-1.997 1.996-5.235-.002-7.232z"/><path d="M6.159 20.362c-2.54 2.541.873 3.336-.635 4.844 0 0-.238.237-.793.793-.556.557-1.747 1.589-.516 2.819 1.23 1.229 2.263.04 2.818-.517s.794-.793.794-.793c1.508-1.508 2.302.873 4.842-1.668 1.047-1.047 3.81-3.809 6.694-6.693l-5.478-5.479c-2.885 2.886-5.647 5.647-6.726 6.694z"/></svg> Pick color`;

    pickButton.addEventListener("click", async () => {
      if (isPickActionLocked) {
        return;
      }

      if (typeof EyeDropper === "undefined") {
        showToast(mainContainer, "success", "Your browser does not support the EyeDropper API");
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
        await injectContentScript(activeTab.id);
        await chrome.tabs.sendMessage(activeTab.id, message);
        window.close();
      } catch {
        isPickActionLocked = false;
        pickButton.disabled = false;
        showToast(mainContainer, "success", "This page is not ready. Reload the tab and try again.");
      }
    });

    buttonContainer.appendChild(pickButton);
  }

  await refreshPopup();
});
