"use strict";

const kuromoji = require("kuromoji");
const path = require("path");

const KEEP_POS = ["名詞"];
const DISCARD_SUB_POS = [
  "非自立",
  "接尾",
  "代名詞",
  "数",
  "動詞非自立的",
  "特殊",
];

/** タグ IDF ブーストのスケール係数（コサイン類似度との相対バランス用） */
const TAG_IDF_BOOST_FACTOR = 0.05;

let _tokenizer = null;

/**
 * kuromoji トークナイザの遅延初期化。Promise をキャッシュし複数呼び出しで共有する。
 *
 * @returns {Promise<object>}
 */
const getTokenizer = () => {
  if (_tokenizer) {
    return _tokenizer;
  }

  _tokenizer = new Promise((resolve, reject) => {
    const dicPath = path.join(
      path.dirname(require.resolve("kuromoji/package.json")),
      "dict",
    );
    kuromoji.builder({ dicPath }).build((err, tokenizer) => {
      if (err) {
        return reject(err);
      }
      resolve(tokenizer);
    });
  });

  return _tokenizer;
};

/**
 * kuromoji トークナイザによる日本語テキストの名詞原形リストへの変換。
 * 非自立語・接尾辞・代名詞・数詞・1文字語を除外する。
 *
 * @param {object} tokenizer
 * @param {string} text
 * @returns {string[]}
 */
const tokenize = (tokenizer, text) => {
  const tokens = tokenizer.tokenize(text);
  const terms = [];

  for (const token of tokens) {
    if (!KEEP_POS.includes(token.pos)) {
      continue;
    }
    if (DISCARD_SUB_POS.includes(token.pos_detail_1)) {
      continue;
    }

    const form =
      token.basic_form !== "*" ? token.basic_form : token.surface_form;
    if (form.length <= 1) {
      continue;
    }
    terms.push(form);
  }

  return terms;
};

/**
 * 文書ごとの term リストからの TF-IDF ベクトル構築。
 *
 * @param {string[][]} postTermsList
 * @returns {{ vocabulary: string[], vocabIndex: Map<string, number>, vectors: Map<number, number>[] }}
 */
const buildTfIdf = (postTermsList) => {
  const df = new Map();
  const tfMaps = [];
  const n = postTermsList.length;

  for (const terms of postTermsList) {
    const tf = new Map();
    const seen = new Set();

    for (const term of terms) {
      tf.set(term, (tf.get(term) || 0) + 1);
      if (!seen.has(term)) {
        seen.add(term);
        df.set(term, (df.get(term) || 0) + 1);
      }
    }

    tfMaps.push(tf);
  }

  const vocabulary = [...df.keys()].sort();
  const vocabIndex = new Map(vocabulary.map((v, i) => [v, i]));

  const vectors = tfMaps.map((tf) => {
    const vec = new Map();
    const totalTerms = [...tf.values()].reduce((a, b) => a + b, 0);

    for (const [term, count] of tf) {
      const tfVal = count / totalTerms;
      const idfVal = Math.log(n / (df.get(term) || 1));
      const tfidf = tfVal * idfVal;
      if (tfidf > 0) {
        vec.set(vocabIndex.get(term), tfidf);
      }
    }

    return vec;
  });

  return { vocabulary, vocabIndex, vectors };
};

/**
 * 2つのスパースベクトル間のコサイン類似度。
 *
 * @param {Map<number, number>} vecA
 * @param {Map<number, number>} vecB
 * @returns {number}
 */
const cosineSimilarity = (vecA, vecB) => {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (const [dim, val] of vecA) {
    normA += val * val;
    if (vecB.has(dim)) {
      dot += val * vecB.get(dim);
    }
  }

  for (const [, val] of vecB) {
    normB += val * val;
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
};

/**
 * 共有タグの IDF 重み付きブースト。
 * レアなタグの共有ほど高スコアになる。
 *
 * @param {{ tags?: { name: string }[] }} postA
 * @param {{ tags?: { name: string }[] }} postB
 * @param {Map<string, number>} tagDf 各タグの文書頻度
 * @param {number} totalPosts 全記事数
 * @returns {number}
 */
const computeTagIdfBoost = (postA, postB, tagDf, totalPosts) => {
  if (!postA.tags || !postB.tags) {
    return 0;
  }

  const tagsA = postA.tags.map((t) => t.name);
  const tagsB = new Set(postB.tags.map((t) => t.name));

  let boost = 0;
  for (const tag of tagsA) {
    if (tagsB.has(tag)) {
      boost += Math.log(totalPosts / (tagDf.get(tag) || 1));
    }
  }

  return boost * TAG_IDF_BOOST_FACTOR;
};

module.exports = {
  getTokenizer,
  tokenize,
  buildTfIdf,
  cosineSimilarity,
  computeTagIdfBoost,
};
