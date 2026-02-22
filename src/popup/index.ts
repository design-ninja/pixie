import { showToast, createColorElement } from "./dom.js";
import { setupPopupMenu } from "./menu.js";
import { getExpandedState, getStoredColors, removeStoredColors, setExpandedState } from "../shared/storage.js";
import type { ClearBadgeMessage, PopupToContentMessage } from "../shared/messages.js";

const REVIEW_URL =
  "https://chrome.google.com/webstore/detail/hexpicker-%E2%80%94-a-simple-hex/nbfoiiglmnkmdhhaenkekmodabpcfnhc?utm_source=ext_sidebar&hl=en-GB";
const COFFEE_URL = "https://www.buymeacoffee.com/design_ninja";

function getRequiredElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Required element not found: ${selector}`);
  }
  return element;
}

window.addEventListener("DOMContentLoaded", async () => {
  const mainContainer = getRequiredElement<HTMLElement>("#mainCont");
  const header = getRequiredElement<HTMLElement>("#header");
  const menu = getRequiredElement<HTMLElement>("#menu");
  const buttonContainer = getRequiredElement<HTMLElement>("#picker_btn_cont");
  const resultList = getRequiredElement<HTMLElement>("#result");

  let isExpanded = await getExpandedState();
  let isPickActionLocked = false;

  const clearBadgeMessage: ClearBadgeMessage = { query: "clear_badge" };

  const refreshPopup = async (): Promise<void> => {
    const colors = await getStoredColors();
    resultList.innerHTML = "";

    const existingToggle = document.getElementById("toggleButton");
    if (existingToggle) {
      existingToggle.remove();
    }

    if (colors.length > 9) {
      const toggleButton = document.createElement("button");
      toggleButton.id = "toggleButton";
      toggleButton.className = "toggle-button";
      toggleButton.innerText = isExpanded ? "Show less" : "Show more";

      toggleButton.addEventListener("click", async () => {
        isExpanded = !isExpanded;
        await setExpandedState(isExpanded);
        await refreshPopup();
      });

      mainContainer.appendChild(toggleButton);
    }

    if (colors.length === 0) {
      resultList.style.display = "none";
      return;
    }

    colors.forEach((hexCode, index) => {
      const colorElement = createColorElement(hexCode, async () => {
        await navigator.clipboard.writeText(hexCode);
        showToast(mainContainer, "#FEF2CE", "Hex code is copied to clipboard!");
      });

      colorElement.classList.add("color-element");
      if (!isExpanded && index >= 9) {
        colorElement.style.display = "none";
      }

      resultList.appendChild(colorElement);
    });

    resultList.style.display = "flex";
  };

  setupPopupMenu(menu, header, {
    onClearColors: async () => {
      await removeStoredColors();
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

  if (!activeTab || typeof activeTab.url !== "string" || activeTab.url.startsWith("chrome")) {
    buttonContainer.innerHTML = "<i>ColorPicker can't access Chrome pages</i>";
  } else if (activeTab.url.startsWith("file")) {
    buttonContainer.innerHTML = "<i>ColorPicker can't access local pages</i>";
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

      const message: PopupToContentMessage = {
        from: "popup",
        query: "eye_dropper_clicked"
      };

      await chrome.tabs.sendMessage(activeTab.id, message);
      window.close();
    });

    buttonContainer.appendChild(pickButton);
  }

  await refreshPopup();
});
