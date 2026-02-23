import { createHistoryEntry } from "../shared/color-schemes.js";
import { isPopupToContentMessage } from "../shared/messages.js";
import type { HistoryEntrySavedMessage } from "../shared/messages.js";
import { addHistoryEntry, getActiveOutputFormat } from "../shared/storage.js";

const TOAST_HOST_ID = "pixie-toast-host";
const TOAST_VISIBLE_MS = 2600;
const TOAST_ENTER_MS = 320;
const TOAST_EXIT_MS = 260;

declare global {
  interface Window {
    __pixieContentScriptRegistered?: boolean;
  }
}

function getToastHost(): HTMLElement | null {
  if (!document.documentElement) {
    return null;
  }

  let host = document.getElementById(TOAST_HOST_ID);

  if (!host) {
    host = document.createElement("div");
    host.id = TOAST_HOST_ID;
    host.style.position = "fixed";
    host.style.top = "16px";
    host.style.right = "16px";
    host.style.display = "flex";
    host.style.flexDirection = "column";
    host.style.gap = "8px";
    host.style.zIndex = "2147483647";
    host.style.pointerEvents = "none";
    document.documentElement.appendChild(host);
  }

  return host;
}

function showInPageToast(message: string, sourceHex?: string): void {
  const host = getToastHost();

  if (!host) {
    return;
  }

  const toast = document.createElement("div");
  toast.style.display = "flex";
  toast.style.alignItems = "center";
  toast.style.gap = "8px";
  toast.style.maxWidth = "280px";
  toast.style.padding = "8px 12px";
  toast.style.borderRadius = "10px";
  toast.style.border = "1px solid rgba(255, 255, 255, 0.2)";
  toast.style.background = "rgba(16, 16, 16, 0.92)";
  toast.style.color = "#fff";
  toast.style.fontFamily =
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  toast.style.fontSize = "12px";
  toast.style.lineHeight = "1.3";
  toast.style.boxShadow = "0 10px 24px rgba(0, 0, 0, 0.28)";
  toast.style.overflow = "hidden";
  toast.style.willChange = "opacity, transform, clip-path";
  toast.style.opacity = "1";
  toast.style.transform = "translateY(0)";
  toast.style.clipPath = "inset(0 0 0 0 round 10px)";

  if (sourceHex) {
    const swatch = document.createElement("span");
    swatch.style.width = "12px";
    swatch.style.height = "12px";
    swatch.style.borderRadius = "999px";
    swatch.style.flex = "0 0 12px";
    swatch.style.background = sourceHex;
    swatch.style.border = "1px solid rgba(255, 255, 255, 0.45)";
    toast.appendChild(swatch);
  }

  const text = document.createElement("span");
  text.textContent = message;
  toast.appendChild(text);

  host.appendChild(toast);
  toast.animate(
    [
      {
        opacity: "0",
        transform: "translateY(-14px)",
        clipPath: "inset(0 0 100% 0 round 10px)"
      },
      {
        opacity: "1",
        transform: "translateY(0)",
        clipPath: "inset(0 0 0 0 round 10px)"
      }
    ],
    {
      duration: TOAST_ENTER_MS,
      easing: "cubic-bezier(0.16, 1, 0.3, 1)",
      fill: "forwards"
    }
  );

  window.setTimeout(() => {
    const exitAnimation = toast.animate(
      [
        {
          opacity: "1",
          transform: "translateY(0)",
          clipPath: "inset(0 0 0 0 round 10px)"
        },
        {
          opacity: "0",
          transform: "translateY(-8px)",
          clipPath: "inset(0 0 100% 0 round 10px)"
        }
      ],
      {
        duration: TOAST_EXIT_MS,
        easing: "cubic-bezier(0.4, 0, 1, 1)",
        fill: "forwards"
      }
    );

    exitAnimation.addEventListener("finish", () => toast.remove(), { once: true });
  }, TOAST_VISIBLE_MS);
}

async function storePickedColor(sourceHex: string): Promise<string> {
  const activeOutputFormat = await getActiveOutputFormat();
  const entry = createHistoryEntry(sourceHex, activeOutputFormat);

  await addHistoryEntry(entry);

  const historyMessage: HistoryEntrySavedMessage = {
    query: "history_entry_saved",
    sourceColor: sourceHex,
    entry
  };

  await chrome.runtime.sendMessage(historyMessage);

  return entry.valueAtPick;
}

if (!window.__pixieContentScriptRegistered) {
  window.__pixieContentScriptRegistered = true;

  chrome.runtime.onMessage.addListener((message: unknown) => {
    if (!isPopupToContentMessage(message)) {
      return;
    }

    if (typeof EyeDropper === "undefined") {
      showInPageToast("EyeDropper is not supported on this page");
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
            showInPageToast(`Pixie copied: ${copiedValue}`, color);
          } catch (error) {
            console.error("Could not copy color:", error);
            showInPageToast("Could not copy color");
          }
        })
        .catch((error) => {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }
          console.log(error);
        });
    }, 500);
  });
}
