// @ts-check
// UMD: ブラウザでは window.SearchScoring、Node.js では module.exports
(function (exports) {
  "use strict";

  const TITLE_WEIGHT = 5;
  const SUBTITLE_WEIGHT = 2;
  const DESCRIPTION_WEIGHT = 1;
  const PHRASE_TITLE_WEIGHT = 3;
  const PHRASE_SUBTITLE_WEIGHT = 1;
  const MIN_FIELD_MATCH_LENGTH = 2;
  const MIN_PHRASE_KEYWORDS = 2;
  const MAX_RESULTS = 10;

  /** @type {[string, number][]} */
  const FIELD_WEIGHTS = [
    ["t", TITLE_WEIGHT],
    ["s", SUBTITLE_WEIGHT],
    ["e", DESCRIPTION_WEIGHT],
  ];

  /** @type {[string, number][]} */
  const PHRASE_FIELD_WEIGHTS = [
    ["t", PHRASE_TITLE_WEIGHT],
    ["s", PHRASE_SUBTITLE_WEIGHT],
  ];

  /**
   * 転置インデックスによる順位ベーススコアリング。
   *
   * @param {string[]} keywords
   * @param {Record<string, number[]>} index
   * @param {Map<number, number>} scores
   */
  const addIndexScores = (keywords, index, scores) => {
    for (const keyword of keywords) {
      for (const term of Object.keys(index)) {
        if (term.toLowerCase().includes(keyword)) {
          const postIndices = index[term];
          for (let rank = 0; rank < postIndices.length; rank++) {
            const idx = postIndices[rank];
            scores.set(idx, (scores.get(idx) || 0) + 1 / (rank + 1));
          }
        }
      }
    }
  };

  /**
   * タイトル・サブタイトル・説明文への直接キーワードマッチによるスコア加算。
   *
   * @param {string[]} keywords
   * @param {{ t: string, s: string, e: string }[]} posts
   * @param {Map<number, number>} scores
   */
  const addFieldScores = (keywords, posts, scores) => {
    for (const keyword of keywords) {
      if (keyword.length < MIN_FIELD_MATCH_LENGTH) {
        continue;
      }

      for (let i = 0; i < posts.length; i++) {
        const p = posts[i];
        for (const [field, weight] of FIELD_WEIGHTS) {
          const value = p[field];
          if (value && value.toLowerCase().includes(keyword)) {
            scores.set(i, (scores.get(i) || 0) + weight);
          }
        }
      }
    }
  };

  /**
   * 複数キーワードのフレーズ一致によるスコア加算。
   *
   * @param {string} query 正規化済みクエリ文字列
   * @param {{ t: string, s: string }[]} posts
   * @param {Map<number, number>} scores
   */
  const addPhraseScores = (query, posts, scores) => {
    for (let i = 0; i < posts.length; i++) {
      const p = posts[i];
      for (const [field, weight] of PHRASE_FIELD_WEIGHTS) {
        const value = p[field];
        if (value && value.toLowerCase().includes(query)) {
          scores.set(i, (scores.get(i) || 0) + weight);
        }
      }
    }
  };

  /**
   * 検索クエリに基づく記事のスコアリングとランキング。
   *
   * @param {string} query
   * @param {{ posts: { t: string, s: string, e: string, p: string, d: string }[], index: Record<string, number[]> }} data
   * @returns {{ t: string, s: string, e: string, p: string, d: string }[]}
   */
  const search = (query, data) => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return [];
    }

    const keywords = q.split(/\s+/).filter(Boolean);
    /** @type {Map<number, number>} */
    const scores = new Map();

    addIndexScores(keywords, data.index, scores);
    addFieldScores(keywords, data.posts, scores);

    if (keywords.length >= MIN_PHRASE_KEYWORDS) {
      addPhraseScores(q, data.posts, scores);
    }

    return [...scores.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_RESULTS)
      .map(([idx]) => data.posts[idx]);
  };

  exports.search = search;
  // eslint-disable-next-line no-undef
})(
  typeof module !== "undefined" ? module.exports : (/** @type {any} */ (window).SearchScoring = {}),
);
