document.addEventListener("click", ({ target }) => {
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const shouldFocus = target.matches(".hexo-reveal-embed");

  [...document.getElementsByClassName("hexo-reveal-embed")].forEach(
    ({classList}) => {
      classList.remove("focus");
      if (!shouldFocus) {
        classList.remove("full");
        classList.remove("wide");
        [
          ...document.getElementsByClassName("hexo-reveal-embed-overlay"),
        ].forEach((overlay) => overlay.remove());
      }
    }
  );

  if (shouldFocus) {
    target.classList.add("focus");
    target.getElementsByTagName("iframe").item(0).focus();
  }
});

document.addEventListener("click", (event) => {
  const { target } = event;

  if (!(target instanceof HTMLElement)) {
    return;
  }

  if (!target.matches("a[data-control]")) {
    return;
  }

  event.preventDefault();

  const screen = target.getAttribute("data-screen");
  if (!screen || !["full", "wide"].includes(screen)) {
    return;
  }

  const container = target.closest(".hexo-reveal-embed-next");
  if (!container) {
    return;
  }

  const slide = container.previousElementSibling;
  if (!slide || !slide.matches(".hexo-reveal-embed")) {
    return;
  }

  slide.classList.remove("full");
  slide.classList.remove("wide");
  slide.classList.add(screen);

  if (screen === "wide") {
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

  if (screen === "full") {
    slide.requestFullscreen();
  }

  slide.dispatchEvent(new MouseEvent("click", { bubbles: true }));
});

document.addEventListener("DOMContentLoaded", () => {
  const parser = new DOMParser();

  [...document.getElementsByClassName("hexo-reveal-embed")].forEach(
    (element) => {
      const dom = parser.parseFromString(
        `
          <div class="hexo-reveal-embed-next">
            <small>
              <a href="#" data-control data-screen="full">全画面表示</a>
              <a href="#" data-control data-screen="wide">ワイド表示</a>
            </small>
          </div>
        `,
        "text/html"
      );

      element.parentNode.insertBefore(dom.body.firstChild, element.nextSibling);
    }
  );
});
