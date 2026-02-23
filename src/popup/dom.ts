import { COLOR_FORMAT_IDS, COLOR_FORMAT_LABELS, type ColorFormatId } from "../shared/color-engine.js";
import type { HistoryEntry } from "../shared/color-schemes.js";
import { isLightColor } from "../shared/color.js";

export function showToast(mainContainer: HTMLElement, color: string, message: string): void {
  void mainContainer;

  let toastLayer = document.getElementById("toastLayer");
  if (!toastLayer) {
    toastLayer = document.createElement("div");
    toastLayer.id = "toastLayer";
    toastLayer.className = "toast-layer";
    document.body.appendChild(toastLayer);
  }

  const toast = document.createElement("div");
  toast.className = "errorLabel";
  toast.style.backgroundColor = color;
  toast.innerText = message;

  toastLayer.appendChild(toast);

  window.setTimeout(() => {
    if (toast.parentElement === toastLayer) {
      toastLayer.removeChild(toast);
    }

    if (toastLayer.childElementCount === 0 && toastLayer.parentElement) {
      toastLayer.parentElement.removeChild(toastLayer);
    }
  }, 2000);
}

type HistoryEntryRenderOptions = {
  onFormatClick: (format: ColorFormatId, value: string) => void;
  onDelete: (entryId: string) => void;
};

const timestampFormatter = new Intl.DateTimeFormat("sv-SE", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false
});

function formatTimestamp(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return timestampFormatter.format(date);
}

function createFormatRow(
  format: ColorFormatId,
  value: string,
  highlighted: boolean,
  pickedAtTimestamp: string,
  options: HistoryEntryRenderOptions
): HTMLDivElement {
  const row = document.createElement("div");
  row.className = "format-row";

  if (highlighted) {
    row.classList.add("format-row--picked");
  }

  const label = document.createElement("span");
  label.className = "format-row__label";
  label.innerText = COLOR_FORMAT_LABELS[format];

  if (highlighted) {
    label.title = `Picked at ${pickedAtTimestamp}`;
  }

  const button = document.createElement("button");
  button.type = "button";
  button.className = "format-row__value";
  button.innerText = value;
  button.title = "Copy value";

  button.addEventListener("click", () => {
    options.onFormatClick(format, value);
  });

  row.append(label, button);
  return row;
}

export function createHistoryEntryElement(entry: HistoryEntry, options: HistoryEntryRenderOptions): HTMLElement {
  const container = document.createElement("article");
  container.className = "history-entry";

  const accordion = document.createElement("details");
  accordion.className = "history-entry__accordion";
  accordion.setAttribute("name", "history-accordion");

  const summary = document.createElement("summary");
  summary.className = "history-entry__summary";

  const swatch = document.createElement("div");
  swatch.className = "history-entry__swatch";
  swatch.style.backgroundColor = entry.sourceHex;
  swatch.style.color = isLightColor(entry.sourceHex) ? "#000" : "#fff";
  swatch.innerText = entry.valueAtPick;

  const swatchWrap = document.createElement("div");
  swatchWrap.className = "history-entry__swatch-wrap";

  const actions = document.createElement("div");
  actions.className = "history-entry__actions";

  const copyButton = document.createElement("button");
  copyButton.type = "button";
  copyButton.className = "history-entry__action history-entry__copy";
  copyButton.innerText = "copy";
  copyButton.ariaLabel = "Copy picked value";
  copyButton.title = "Copy picked value";

  copyButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    options.onFormatClick(entry.formatAtPick, entry.valueAtPick);
  });

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "history-entry__action history-entry__delete";
  deleteButton.innerText = "×";
  deleteButton.ariaLabel = "Delete this history entry";
  deleteButton.title = "Delete this history entry";

  deleteButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    options.onDelete(entry.id);
  });

  actions.append(copyButton, deleteButton);
  swatchWrap.append(swatch, actions);
  summary.append(swatchWrap);

  const body = document.createElement("div");
  body.className = "history-entry__body";
  const pickedAtTimestamp = formatTimestamp(entry.createdAt);

  COLOR_FORMAT_IDS.forEach((formatId) => {
    body.appendChild(
      createFormatRow(formatId, entry.values[formatId], formatId === entry.formatAtPick, pickedAtTimestamp, options)
    );
  });

  accordion.append(summary, body);
  container.append(accordion);
  return container;
}
