"use strict";

const { getSearchIndex } = require("./lib/search-index");

hexo.extend.generator.register("search-index", () => {
  const searchIndex = getSearchIndex();
  if (!searchIndex) {
    return [];
  }

  return {
    path: "assets/search-index.json",
    data: JSON.stringify(searchIndex),
  };
});
