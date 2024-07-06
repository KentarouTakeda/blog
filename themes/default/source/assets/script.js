// @ts-check

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
    target.querySelector("iframe")?.focus();
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
  overlay.style.left = "0";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.width = "100%";
  overlay.style.zIndex = "1";
  document.body.prepend(overlay);
}

document.addEventListener("click", async ({ target }) => {
  if (!(target instanceof HTMLElement)) {
    return;
  }
  const parent = target.parentElement;
  if (parent == null || !parent.matches("pre[data-language]")) {
    return;
  }
  const code = parent.querySelector('code[class*="language-"]');
  if (code == null || !(code instanceof HTMLElement)) {
    return;
  }

  const text = code.innerText;
  await navigator.clipboard.writeText(text);

  target.classList.add("done");
  setTimeout(() => target.classList.remove("done"), 1000);
});

document.addEventListener("click", ({ target }) => {
  if (
    !(
      target instanceof HTMLElement ||
      target instanceof SVGElement ||
      target instanceof SVGTextElement
    ) ||
    target.closest("a")
  ) {
    return;
  }
  const plantumlSvg = target.closest("svg.plantuml");
  const popup = plantumlSvg instanceof SVGElement ? plantumlSvg : target;

  if (!popup.matches(".post img") && !popup.matches("svg.plantuml")) {
    return;
  }

  const dimmer =
    document.querySelector("#dimmer") || document.createElement("div");
  dimmer.id = "dimmer";
  while (dimmer.firstChild) {
    dimmer.removeChild(dimmer.firstChild);
  }

  const image = popup.cloneNode(true);
  if (!(image instanceof HTMLImageElement || image instanceof SVGElement)) {
    return;
  }

  image.classList.add("popup");
  image.removeAttribute("width");

  dimmer.appendChild(image);
  document.body.appendChild(dimmer);

  dimmer.addEventListener("click", ({ target }) => {
    if (target !== dimmer) {
      return;
    }
    dimmer.remove();
  });
});

{
  const main = () => {
    // レイアウトに遣うインラインSVGと区別する属性としてaria-labelを利用
    document.querySelectorAll("svg:not([aria-label])").forEach((e) => {
      e.removeAttribute("preserveAspectRatio");
      e.removeAttribute("style");
      e.removeAttribute("height");
      e.classList.add("plantuml");
    });

    document.querySelectorAll("pre[data-language]").forEach((e) => {
      const button = document.createElement("a");
      button.classList.add("copy-to-clipboard");
      e.appendChild(button);
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => main());
  } else {
    main();
  }
}
