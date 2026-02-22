export type PopupMenuActions = {
  onClearColors: () => void;
  onLeaveReview: () => void;
  onBuyCoffee: () => void;
};

export type PopupMenuController = {
  close: () => void;
};

export function setupPopupMenu(
  menuTrigger: HTMLElement,
  header: HTMLElement,
  actions: PopupMenuActions
): PopupMenuController {
  const menuDropdown = document.createElement("div");
  menuDropdown.id = "menuDropdown";
  menuDropdown.classList.add("menuDropdown");
  menuDropdown.innerHTML = `
    <div id="clearColors" class="menu-item">Clear colors</div>
    <div id="leaveReview" class="menu-item">Leave your review</div>
    <div id="buyMeACoffee" class="menu-item">Buy me a coffee ☕️</div>
  `;

  header.appendChild(menuDropdown);

  const close = (): void => {
    menuDropdown.classList.remove("show");
  };

  const toggle = (): void => {
    menuDropdown.classList.toggle("show");
  };

  menuTrigger.addEventListener("click", (event) => {
    event.stopPropagation();
    toggle();
  });

  menuDropdown.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  const clearColors = menuDropdown.querySelector<HTMLElement>("#clearColors");
  const leaveReview = menuDropdown.querySelector<HTMLElement>("#leaveReview");
  const buyMeACoffee = menuDropdown.querySelector<HTMLElement>("#buyMeACoffee");

  clearColors?.addEventListener("click", () => {
    actions.onClearColors();
    close();
  });

  leaveReview?.addEventListener("click", () => {
    actions.onLeaveReview();
    close();
  });

  buyMeACoffee?.addEventListener("click", () => {
    actions.onBuyCoffee();
    close();
  });

  window.addEventListener("click", () => {
    close();
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      close();
    }
  });

  return { close };
}
