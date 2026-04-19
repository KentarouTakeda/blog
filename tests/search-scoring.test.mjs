import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { search } = require("../themes/default/source/assets/search-scoring.js");

const makeData = () => ({
  posts: [
    {
      t: "JavaScript入門",
      s: "基礎から学ぶ",
      e: "JSの基本を解説",
      p: "js-intro",
      d: "2025-01-01",
    },
    {
      t: "TypeScript入門",
      s: "",
      e: "TSの型システム",
      p: "ts-intro",
      d: "2025-02-01",
    },
    {
      t: "Pythonプログラミング",
      s: "データ分析",
      e: "Python入門ガイド",
      p: "python",
      d: "2025-03-01",
    },
  ],
  index: {
    javascript: [0],
    typescript: [1],
    python: [2],
    入門: [0, 1, 2],
    基礎: [0],
    プログラミング: [2],
    データ: [2],
    分析: [2],
  },
});

describe("search", () => {
  it("空クエリで空配列を返す", () => {
    const data = makeData();
    assert.deepStrictEqual(search("", data), []);
    assert.deepStrictEqual(search("  ", data), []);
  });

  it("空白のみのクエリで空配列を返す", () => {
    const data = makeData();
    assert.deepStrictEqual(search("\t\n", data), []);
  });

  it("インデックスの語で記事を検索する", () => {
    const data = makeData();
    const results = search("入門", data);
    assert.ok(results.length >= 3);
  });

  it("タイトル一致を上位にランクする", () => {
    const data = makeData();
    const results = search("javascript", data);
    assert.ok(results.length > 0);
    assert.strictEqual(results[0].p, "js-intro");
  });

  it("複数キーワードでフレーズ一致ボーナスを適用する", () => {
    const data = makeData();
    // "JavaScript 入門" should boost js-intro via phrase match on title
    const results = search("JavaScript 入門", data);
    assert.ok(results.length > 0);
    assert.strictEqual(results[0].p, "js-intro");
  });

  it("サブタイトルフィールドに一致する", () => {
    const data = makeData();
    const results = search("データ分析", data);
    assert.ok(results.length > 0);
    // Python post has 'データ分析' as subtitle
    assert.ok(results.some((r) => r.p === "python"));
  });

  it("説明フィールドに一致する", () => {
    const data = makeData();
    const results = search("型システム", data);
    assert.ok(results.length > 0);
    assert.ok(results.some((r) => r.p === "ts-intro"));
  });

  it("結果を 10 件に制限する", () => {
    const manyPosts = Array.from({ length: 20 }, (_, i) => ({
      t: `記事${i}テスト`,
      s: "",
      e: "テスト",
      p: `post-${i}`,
      d: "2025-01-01",
    }));
    const manyData = {
      posts: manyPosts,
      index: { テスト: manyPosts.map((_, i) => i) },
    };
    const results = search("テスト", manyData);
    assert.ok(results.length <= 10);
  });

  it("1 文字キーワードでフィールド一致を適用しない", () => {
    const data = {
      posts: [{ t: "AとBの比較", s: "", e: "", p: "ab", d: "2025-01-01" }],
      index: {},
    };
    // Single char keyword 'A' should not get field match bonus
    const results = search("A", data);
    assert.strictEqual(results.length, 0);
  });

  it("不正なデータでエラーを伝播する", () => {
    assert.throws(() => search("test", null));
    assert.throws(() => search("test", { posts: [], index: null }));
  });
});
