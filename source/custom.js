document.addEventListener("click", ({ target }) => {
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const container = document
    .getElementsByClassName("hexo-reveal-embed")
    .item(0);
  if (!container) {
    return;
  }

  const shouldFocus = target.matches(".hexo-reveal-embed");
  container.classList.remove("focus");

  if (!shouldFocus) {
    container.classList.remove("wide");
    document
      .getElementsByClassName("hexo-reveal-embed-overlay")
      .item(0)
      ?.remove();
  }

  if (shouldFocus) {
    target.classList.add("focus");
    target.getElementsByTagName("iframe").item(0).focus();
  }
});

function setRevealToWideScreen() {
  const container = document
    .getElementsByClassName("hexo-reveal-embed")
    .item(0);
  if (!container) {
    return;
  }

  container.classList.add("wide");

  const overlay = document.createElement("div");
  overlay.classList.add("hexo-reveal-embed-overlay");
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
  overlay.style.height = "100%";
  overlay.style.left = 0;
  overlay.style.position = "fixed";
  overlay.style.top = 0;
  overlay.style.width = "100%";
  overlay.style.zIndex = 1;
  document.body.prepend(overlay);
}
