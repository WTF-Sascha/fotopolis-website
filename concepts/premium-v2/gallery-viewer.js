"use strict";
/* FOTOPOLIS 2.8 — local gallery controls. No remote calls, no tracking,
   no media modifications and no persistence of visitor state. */
document.addEventListener("DOMContentLoaded", () => {
  const gallery = document.querySelector("[data-curated-gallery]");
  const dialog = document.querySelector("[data-gallery-dialog]");
  if (!gallery || !dialog) return;
  const items = [...gallery.querySelectorAll("[data-gallery-item]")];
  const large = dialog.querySelector("[data-gallery-large]");
  const title = dialog.querySelector("[data-gallery-dialog-title]");
  const note = dialog.querySelector("[data-gallery-dialog-note]");
  const prev = dialog.querySelector("[data-gallery-prev]");
  const next = dialog.querySelector("[data-gallery-next]");
  const close = dialog.querySelector("[data-gallery-close]");
  let opener = null;
  let activeIndex = 0;

  const visibleItems = () => items.filter(el => !el.hidden);
  function showItem(index) {
    const shown = visibleItems();
    if (!shown.length) return;
    activeIndex = (index + shown.length) % shown.length;
    const item = shown[activeIndex];
    const thumb = item.querySelector("img");
    const caption = item.querySelector("figcaption");
    // Only a previously generated, approved local src is used.
    large.src = thumb.getAttribute("src");
    large.alt = thumb.alt;
    title.textContent = caption.querySelector("strong").textContent;
    note.textContent = caption.querySelector("small").textContent;
  }
  for (const item of items) {
    const button = item.querySelector("[data-gallery-open]");
    button.addEventListener("click", () => {
      opener = button;
      const index = visibleItems().indexOf(item);
      if (index < 0) return;
      showItem(index);
      dialog.showModal();
      close.focus();
    });
  }
  prev.addEventListener("click", () => showItem(activeIndex - 1));
  next.addEventListener("click", () => showItem(activeIndex + 1));
  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", event => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", () => {
    large.src = "/assets/images/fotobox-event-1672.webp";
    large.alt = "FOTOPOLIS Fotobox – Produktvisualisierung";
    if (opener?.isConnected && !opener.closest("[data-gallery-item]")?.hidden) {
      opener.focus();
    }
  });
  dialog.addEventListener("keydown", event => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      showItem(activeIndex + (event.key === "ArrowRight" ? 1 : -1));
    }
  });
});
