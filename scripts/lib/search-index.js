"use strict";

/**
 * クライアント検索用インデックス。`/assets/search-index.json` として出力される。
 *
 * - `posts`: 記事メタデータ配列（キーは転送量削減用の短縮名）
 * - `index`: 転置インデックス。各名詞原形に対し、その term を含む記事の
 *   インデックス番号を TF-IDF 重み降順で格納。重み自体は保持せず、
 *   クライアント側で順位ベーススコア `1/(rank+1)` に変換して使用する。
 *
 * @typedef {object} SearchIndex
 * @property {{ t: string, s: string, e: string, p: string, d: string }[]} posts
 * @property {Record<string, number[]>} index
 */

/** @type {SearchIndex|null} */
let _searchIndex = null;

/**
 * TF-IDF ベクトルと語彙から転置インデックスを構築し、検索インデックスを格納する。
 *
 * @param {object[]} posts Hexo post objects
 * @param {string[]} vocabulary
 * @param {Map<number, number>[]} vectors
 */
const buildSearchIndex = (posts, vocabulary, vectors) => {
  const invertedIndex = Object.create(null);

  for (let i = 0; i < posts.length; i++) {
    for (const [dim, weight] of vectors[i]) {
      const term = vocabulary[dim];
      if (!invertedIndex[term]) {
        invertedIndex[term] = [];
      }
      invertedIndex[term].push({ i, w: weight });
    }
  }

  for (const term of Object.keys(invertedIndex)) {
    invertedIndex[term].sort((a, b) => b.w - a.w);
    invertedIndex[term] = invertedIndex[term].map((e) => e.i);
  }

  _searchIndex = {
    posts: posts.map((p) => ({
      t: p.title,
      s: p.subtitle || "",
      e: p.description || "",
      p: p.path,
      d: p.date ? p.date.format("YYYY-MM-DD") : "",
    })),
    index: invertedIndex,
  };
};

/** @returns {SearchIndex|null} */
const getSearchIndex = () => _searchIndex;

module.exports = { buildSearchIndex, getSearchIndex };
