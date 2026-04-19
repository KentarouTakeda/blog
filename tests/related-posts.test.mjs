import { before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  getTokenizer,
  tokenize,
  buildTfIdf,
  cosineSimilarity,
  computeTagIdfBoost,
} = require("../scripts/lib/text-scoring.js");

describe("buildTfIdf", () => {
  it("ブーストによりタイトル語の TF-IDF 重みが増加する", () => {
    const otherDoc = ["gamma", "delta", "epsilon"];

    const plain = [["alpha", "beta", "gamma", "delta"], otherDoc];
    const boosted = [
      ["alpha", "beta", "gamma", "delta", ...Array(4).fill("alpha")],
      otherDoc,
    ];

    const { vocabIndex: plainIdx, vectors: plainVec } = buildTfIdf(plain);
    const { vocabIndex: boostIdx, vectors: boostVec } = buildTfIdf(boosted);

    const plainWeight = plainVec[0].get(plainIdx.get("alpha")) || 0;
    const boostWeight = boostVec[0].get(boostIdx.get("alpha")) || 0;

    assert.ok(boostWeight > plainWeight);
  });
});

describe("computeTagIdfBoost", () => {
  it("レアなタグの共有は広いタグの共有より高くブーストされる", () => {
    const tagDf = new Map([
      ["common", 3],
      ["rare", 1],
    ]);
    const totalPosts = 5;

    const commonOnly = computeTagIdfBoost(
      { tags: [{ name: "common" }] },
      { tags: [{ name: "common" }] },
      tagDf,
      totalPosts,
    );

    const commonAndRare = computeTagIdfBoost(
      { tags: [{ name: "common" }, { name: "rare" }] },
      { tags: [{ name: "common" }, { name: "rare" }] },
      tagDf,
      totalPosts,
    );

    assert.ok(commonAndRare > commonOnly);
  });
});

describe("cosineSimilarity", () => {
  it("同一ベクトルで 1.0 を返す", () => {
    const vec = new Map([
      [0, 3],
      [1, 4],
    ]);
    assert.strictEqual(cosineSimilarity(vec, vec), 1);
  });

  it("直交ベクトルで 0.0 を返す", () => {
    const vecA = new Map([[0, 1]]);
    const vecB = new Map([[1, 1]]);
    assert.strictEqual(cosineSimilarity(vecA, vecB), 0);
  });

  it("一方が空ベクトルの場合に 0.0 を返す", () => {
    const empty = new Map();
    const vec = new Map([[0, 1]]);
    assert.strictEqual(cosineSimilarity(empty, vec), 0);
    assert.strictEqual(cosineSimilarity(vec, empty), 0);
    assert.strictEqual(cosineSimilarity(empty, empty), 0);
  });

  it("既知のベクトル対で期待値を返す", () => {
    // vecA = [1, 2, 3], vecB = [4, 5, 6]
    // dot = 1*4 + 2*5 + 3*6 = 32
    // normA = sqrt(1 + 4 + 9) = sqrt(14)
    // normB = sqrt(16 + 25 + 36) = sqrt(77)
    // cosine = 32 / (sqrt(14) * sqrt(77))
    const vecA = new Map([
      [0, 1],
      [1, 2],
      [2, 3],
    ]);
    const vecB = new Map([
      [0, 4],
      [1, 5],
      [2, 6],
    ]);
    const expected = 32 / (Math.sqrt(14) * Math.sqrt(77));
    const result = cosineSimilarity(vecA, vecB);
    assert.ok(Math.abs(result - expected) < 1e-10);
  });

  it("部分的に重複するベクトルを正しく処理する", () => {
    // vecA = [1, 2, 0], vecB = [0, 3, 4]
    // Only dim 1 overlaps: dot = 2*3 = 6
    // normA = sqrt(1 + 4) = sqrt(5)
    // normB = sqrt(9 + 16) = sqrt(25) = 5
    // cosine = 6 / (sqrt(5) * 5)
    const vecA = new Map([
      [0, 1],
      [1, 2],
    ]);
    const vecB = new Map([
      [1, 3],
      [2, 4],
    ]);
    const expected = 6 / (Math.sqrt(5) * 5);
    const result = cosineSimilarity(vecA, vecB);
    assert.ok(Math.abs(result - expected) < 1e-10);
  });
});

describe("tokenize", () => {
  let tok;

  before(async () => {
    tok = await getTokenizer();
  });

  it("日本語テキストから名詞を抽出する", () => {
    const result = tokenize(tok, "プログラミング言語の比較");
    assert.ok(result.includes("プログラミング"));
    assert.ok(result.includes("言語"));
    assert.ok(result.includes("比較"));
  });

  it("非自立語を除外する", () => {
    const result = tokenize(tok, "ことができるものを考える");
    assert.ok(!result.includes("こと"));
    assert.ok(!result.includes("もの"));
  });

  it("1 文字の単語を除外する", () => {
    const result = tokenize(tok, "犬と猫の話をする");
    // 1文字の名詞は除外される
    assert.ok(!result.includes("犬"));
    assert.ok(!result.includes("猫"));
    assert.ok(!result.includes("話"));
  });

  it('basic_form が "*" の場合に surface_form を使用する', () => {
    const mockTokenizer = {
      tokenize: () => [
        {
          pos: "名詞",
          pos_detail_1: "一般",
          basic_form: "*",
          surface_form: "テスト語",
        },
      ],
    };
    const result = tokenize(mockTokenizer, "dummy");
    assert.deepStrictEqual(result, ["テスト語"]);
  });

  it("basic_form が利用可能な場合にそれを使用する", () => {
    const mockTokenizer = {
      tokenize: () => [
        {
          pos: "名詞",
          pos_detail_1: "一般",
          basic_form: "原形",
          surface_form: "活用形",
        },
      ],
    };
    const result = tokenize(mockTokenizer, "dummy");
    assert.deepStrictEqual(result, ["原形"]);
  });

  it("動詞・形容詞を除外する", () => {
    const result = tokenize(tok, "美しい花が咲く");
    // '美しい'(形容詞), '咲く'(動詞) は除外
    assert.ok(!result.includes("美しい"));
    assert.ok(!result.includes("咲く"));
  });
});
