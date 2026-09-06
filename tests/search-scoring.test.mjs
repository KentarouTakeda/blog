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
    assert.strictEqual(results.length, 10);
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

  it("前方一致が無いとき複合語クエリを索引の単語で拾う", () => {
    const data = {
      posts: [
        { t: "TS解説", s: "", e: "", p: "ts", d: "2025-01-01" },
        { t: "Py解説", s: "", e: "", p: "py", d: "2025-01-01" },
      ],
      index: { typescript: [0], 入門: [0, 1], python: [1] },
    };
    // typescript は 10/12 で拾い、入門 は 2/12 で下限に満たない
    assert.deepStrictEqual(
      search("typescript入門", data).map((r) => r.p),
      ["ts"],
    );
  });

  it("前方一致があるときは逆向きの一致を使わない", () => {
    const data = {
      posts: [
        { t: "A", s: "", e: "", p: "fwd", d: "2024-01-01" },
        { t: "B", s: "", e: "", p: "rev", d: "2026-01-01" },
      ],
      index: { hexo: [0], he: [1] },
    };
    assert.deepStrictEqual(
      search("hexo", data).map((r) => r.p),
      ["fwd"],
    );
  });

  it("逆向きの一致はクエリを覆う割合が下限未満なら捨てる", () => {
    const data = {
      posts: [{ t: "SQL", s: "", e: "", p: "sql", d: "2025-01-01" }],
      index: { sql: [0] },
    };
    // 3/10 は下限ちょうど、3/11 は下限未満
    assert.deepStrictEqual(
      search("postgresql", data).map((r) => r.p),
      ["sql"],
    );
    assert.deepStrictEqual(search("postgresqlx", data), []);
  });

  it("逆向きの一致はクエリを覆う割合だけ減衰する", () => {
    const data = {
      posts: [
        { t: "A", s: "", e: "", p: "short", d: "2026-01-01" },
        { t: "B", s: "", e: "", p: "long", d: "2024-01-01" },
      ],
      index: { abcde: [0], abcdefgh: [1] },
    };
    // 減衰が無いと同点になり、日付降順で short が先に来る
    assert.deepStrictEqual(
      search("abcdefghij", data).map((r) => r.p),
      ["long", "short"],
    );
  });

  it("同スコアなら新しい記事を先に返す", () => {
    const data = {
      posts: [
        { t: "テスト", s: "", e: "", p: "old", d: "2024-01-01" },
        { t: "テスト", s: "", e: "", p: "new", d: "2026-01-01" },
        { t: "テスト", s: "", e: "", p: "mid", d: "2025-01-01" },
      ],
      index: {},
    };
    assert.deepStrictEqual(
      search("テスト", data).map((r) => r.p),
      ["new", "mid", "old"],
    );
  });

  it("日付が空の記事は同スコア内で最後に来る", () => {
    const data = {
      posts: [
        { t: "テスト", s: "", e: "", p: "dated", d: "2025-01-01" },
        { t: "テスト", s: "", e: "", p: "undated", d: "" },
      ],
      index: {},
    };
    assert.deepStrictEqual(
      search("テスト", data).map((r) => r.p),
      ["dated", "undated"],
    );
  });

  it("不正なデータでエラーを伝播する", () => {
    assert.throws(() => search("test", null));
    assert.throws(() => search("test", { posts: [], index: null }));
  });
});
