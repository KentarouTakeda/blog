// @ts-check

{
  /** @type {typeof import('./search-scoring')} */
  const SearchScoring = /** @type {any} */ (window).SearchScoring;

  /** @type {Promise<import('../../../../scripts/lib/search-index').SearchIndex|undefined>|null} */
  let searchIndexPromise = null;

  const loadSearchIndex = () => {
    if (!searchIndexPromise) {
      searchIndexPromise = (async () => {
        try {
          const res = await fetch("/assets/search-index.json");
          if (!res.ok) {
            console.error("search-index.json: HTTP %d", res.status);
            return undefined;
          }
          return await res.json();
        } catch (e) {
          console.error("search-index.json:", e);
          return undefined;
        }
      })();
    }
    return searchIndexPromise;
  };

  /**
   * @param {{ t:string, s:string, p:string, d:string }[]} results
   * @param {HTMLElement} container
   * @param {HTMLElement} emptyEl
   */
  const renderResults = (results, container, emptyEl) => {
    container.replaceChildren();

    if (results.length === 0) {
      emptyEl.textContent = "記事が見つかりませんでした";
      emptyEl.hidden = false;
      return;
    }

    emptyEl.hidden = true;

    const ul = document.createElement("ul");
    for (const r of results) {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = "/" + r.p;

      const time = document.createElement("time");
      time.textContent = r.d;
      a.appendChild(time);

      const title = document.createTextNode(r.s ? `${r.t} - ${r.s}` : r.t);
      a.appendChild(title);
      li.appendChild(a);
      ul.appendChild(li);
    }
    container.appendChild(ul);
  };

  const main = () => {
    /** @type {HTMLButtonElement|null} */
    const btn = document.querySelector(".navbar-search");

    /** @type {HTMLElement|null} */
    const panel = document.querySelector(".search-panel");

    if (!btn || !panel) {
      throw new Error(
        "Search UI elements not found: .navbar-search or .search-panel",
      );
    }

    /** @type {HTMLInputElement|null} */
    const input = panel.querySelector(".search-input");

    /** @type {HTMLElement|null} */
    const resultsContainer = panel.querySelector(".search-results");

    /** @type {HTMLElement|null} */
    const emptyEl = panel.querySelector(".search-empty");

    if (!input || !resultsContainer || !emptyEl) {
      throw new Error(
        "Search panel elements not found: .search-input, .search-results, or .search-empty",
      );
    }

    let debounceTimer = 0;

    /** @param {KeyboardEvent} e */
    const onEscape = (e) => {
      if (e.key === "Escape") {
        closeSearch();
      }
    };

    /** @param {MouseEvent} e */
    const onClickOutside = (e) => {
      if (
        e.target instanceof Node &&
        !panel.contains(e.target) &&
        !(e.target instanceof Element && e.target.closest(".navbar-search"))
      ) {
        closeSearch();
      }
    };

    const openSearch = () => {
      if (!panel.hidden) {
        closeSearch();
        return;
      }

      panel.hidden = false;
      document.addEventListener("keydown", onEscape);
      document.addEventListener("click", onClickOutside);
      input.focus();
    };

    const closeSearch = () => {
      panel.hidden = true;
      input.value = "";
      resultsContainer.replaceChildren();
      emptyEl.hidden = true;
      document.removeEventListener("keydown", onEscape);
      document.removeEventListener("click", onClickOutside);
    };

    input.addEventListener("input", () => {
      clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(async () => {
        const data = await loadSearchIndex();

        if (!data) {
          emptyEl.textContent = "検索インデックスの読み込みに失敗しました";
          emptyEl.hidden = false;
          return;
        }

        if (input.value.trim() === "") {
          resultsContainer.replaceChildren();
          emptyEl.hidden = true;
          return;
        }

        const results = SearchScoring.search(input.value, data);
        renderResults(results, resultsContainer, emptyEl);
      }, 200);
    });

    btn.addEventListener("click", openSearch);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", main);
  } else {
    main();
  }
}
