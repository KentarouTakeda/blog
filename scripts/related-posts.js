"use strict";

const { stripHTML } = require("hexo-util");

const {
  getTokenizer,
  tokenize,
  buildTfIdf,
  cosineSimilarity,
  computeTagIdfBoost,
} = require("./lib/text-scoring");

const { buildSearchIndex } = require("./lib/search-index");

/** 各記事に表示する関連記事の最大件数 */
const RELATED_COUNT = 5;

/** コサイン類似度がこの値以下の記事ペアを関連候補から除外する閾値 */
const SIMILARITY_THRESHOLD = 0.05;

const TITLE_BOOST = 5;
const SUBTITLE_BOOST = 3;
const DESCRIPTION_BOOST = 2;

// path -> related posts (populated by before_generate filter)
const _relatedMap = new Map();

hexo.extend.filter.register("before_generate", async () => {
  const posts = hexo.locals
    .get("posts")
    .toArray()
    .filter((p) => p.published !== false);

  if (posts.length === 0) {
    return;
  }

  const tok = await getTokenizer();

  // 各記事のパーツを個別に tokenize し、検索用・関連記事用の term list を構築
  const postData = posts.map((post) => {
    const titleTerms = tokenize(tok, post.title || "");
    const subtitleTerms = post.subtitle ? tokenize(tok, post.subtitle) : [];
    const descTerms = post.description ? tokenize(tok, post.description) : [];
    const contentTerms = tokenize(
      tok,
      post.content ? stripHTML(post.content) : "",
    );

    const searchTerms = [
      ...titleTerms,
      ...subtitleTerms,
      ...descTerms,
      ...contentTerms,
    ];

    const boostedTerms = [
      ...searchTerms,
      ...Array(TITLE_BOOST - 1)
        .fill(titleTerms)
        .flat(),
      ...Array(SUBTITLE_BOOST - 1)
        .fill(subtitleTerms)
        .flat(),
      ...Array(DESCRIPTION_BOOST - 1)
        .fill(descTerms)
        .flat(),
    ];

    return { searchTerms, boostedTerms };
  });

  const searchTermsList = postData.map((d) => d.searchTerms);
  const boostedTermsList = postData.map((d) => d.boostedTerms);

  // 関連記事用: ブースト済み TF-IDF
  const { vectors: bVectors } = buildTfIdf(boostedTermsList);

  // 検索インデックス用: ブーストなし TF-IDF
  const { vocabulary: sVocab, vectors: sVectors } = buildTfIdf(searchTermsList);

  // タグの document frequency を事前計算
  const tagDf = new Map();
  for (const post of posts) {
    if (post.tags) {
      for (const tag of post.tags.toArray()) {
        tagDf.set(tag.name, (tagDf.get(tag.name) || 0) + 1);
      }
    }
  }

  _relatedMap.clear();

  for (let i = 0; i < posts.length; i++) {
    const scored = [];

    for (let j = 0; j < posts.length; j++) {
      if (i === j) {
        continue;
      }

      let score = cosineSimilarity(bVectors[i], bVectors[j]);
      score += computeTagIdfBoost(posts[i], posts[j], tagDf, posts.length);

      if (score > SIMILARITY_THRESHOLD) {
        scored.push({ index: j, score });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, RELATED_COUNT);

    _relatedMap.set(
      posts[i].path,
      top.map((s) => ({
        title: posts[s.index].title,
        subtitle: posts[s.index].subtitle,
        path: posts[s.index].path,
        date: posts[s.index].date,
      })),
    );
  }

  buildSearchIndex(posts, sVocab, sVectors);
});

hexo.extend.helper.register("related_posts", function () {
  return _relatedMap.get(this.page.path) || [];
});
