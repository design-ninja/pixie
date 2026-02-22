type PopupToContentMessage = {
  from: "popup";
  query: "eye_dropper_clicked";
};

function isPopupToContentMessage(message: unknown): message is PopupToContentMessage {
  if (typeof message !== "object" || message === null) {
    return false;
  }

  const candidate = message as Record<string, unknown>;
  return candidate.from === "popup" && candidate.query === "eye_dropper_clicked";
}

function readStoredColors(): Promise<string[]> {
  return new Promise((resolve) => {
    chrome.storage.local.get("color_hex_code", (response) => {
      if (Array.isArray(response.color_hex_code)) {
        resolve(response.color_hex_code as string[]);
      } else {
        resolve([]);
      }
    });
  });
}

function writeStoredColors(colors: string[]): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ color_hex_code: colors }, () => {
      resolve();
    });
  });
}

async function storeColor(color: string): Promise<void> {
  const existingColors = await readStoredColors();
  existingColors.unshift(color);
  await writeStoredColors(existingColors);
  await chrome.runtime.sendMessage({ color });
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

        try {
          await navigator.clipboard.writeText(color);
        } catch (error) {
          console.error("Could not copy color:", error);
        }

        await storeColor(color);
      })
      .catch((error) => {
        console.log(error);
      });
  }, 500);
});
