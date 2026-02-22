import { isLightColor } from "../shared/color.js";

export function showToast(mainContainer: HTMLElement, color: string, message: string): void {
  const toast = document.createElement("div");
  toast.className = "errorLabel";
  toast.style.backgroundColor = color;
  toast.innerText = message;

  mainContainer.appendChild(toast);

  window.setTimeout(() => {
    if (toast.parentElement === mainContainer) {
      mainContainer.removeChild(toast);
    }
  }, 2000);
}

export function createColorElement(hexCode: string, onClick: () => void): HTMLSpanElement {
  const element = document.createElement("span");
  element.innerText = hexCode;
  element.style.backgroundColor = hexCode;
  element.style.color = isLightColor(hexCode) ? "rgba(0, 0, 0, 0.6)" : "rgba(255, 255, 255, 0.7)";
  element.addEventListener("click", onClick);
  return element;
}
