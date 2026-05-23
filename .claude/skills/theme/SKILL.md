---
name: theme
description: Hexoテーマ（EJS/SCSS/JS）の編集時に参照。レイアウト変更、スタイル修正、stylelint、テーマカスタマイズ時に使う。
user-invocable: false
---

## テーマ構成

カスタムテーマは `themes/default/` に配置されている。

### EJSレイアウト

- `layout/layout.ejs` — 全ページ共通のベーステンプレート
- `layout/post.ejs`, `index.ejs`, `archive.ejs`, `tag.ejs` — 各ページ種別のテンプレート
- `layout/_partial/` — 共通パーツ
  - `head.ejs` — meta/CSS読み込み
  - `nav.ejs` — ナビゲーション
  - `post.ejs` — 記事表示
  - `sidebar.ejs` — サイドバー
  - `google-analytics.ejs` — GAトラッキング
  - `gen-structured-data.ejs` — Schema.org構造化データ
  - `archive.ejs`, `date.ejs`, `thumbnail.ejs` — 補助パーツ

### SCSS

- エントリファイル: `source/assets/style.scss`
- パーシャル（`source/assets/style/`配下）:
  - `_variables.scss` — 変数定義
  - `_post.scss` — 記事スタイル
  - `_pagination.scss` — ページネーション
  - `_details.scss` — detailsタグ
  - `_link-preview.scss` — OGPリンクプレビュー
  - `_hexo-reveal-embed.scss` — スライド埋め込み
- レンダラー: hexo-renderer-dartsass（Dart Sass）

### stylelint

設定: `.stylelintrc.json`

- プロパティはアルファベット順に並べる（`order/properties-alphabetical-order`）
- カラーコードは長形式（`#ffffff`、`#fff` は不可）
- Prettierと連携
- 自動修正: `npm run fix`（pre-commitフックでも自動実行される）

### テーマスクリプト（`themes/default/scripts/`）

- `og-image.js` — OG画像の自動生成（テーマのカラー・フォントを使用。日英で別画像）
- `i18n-en.js` — 記事単位の日英両配信（`.en.md` 検出・`/en/` URL導出・一覧/フィード/検索からの除外・`post.lang` 注入・hreflang/og:locale・言語切替リンク・lang対応 `post_link`）

### プロジェクトスクリプト（`scripts/`）

- `amp-fallback.js` — AMP URLから元記事へのリダイレクト
- `details.js` — `{% details %}` 折りたたみタグプラグイン
- `footnote.js` — 脚注記法の拡張（marked-footnote）
- `related-posts.js` — 記事間の類似度算出、`related_posts`ヘルパー提供
- `search-index.js` — サイト内検索用インデックス（`/assets/search-index.json`）の生成

### クライアント側JavaScript（`themes/default/source/assets/`）

- `script.js` — 画像ポップアップ、コードコピー、TOCハイライト、スライド埋込
- `search.js` — 検索パネルUI
- `search-scoring.js` — 検索クエリのスコアリング

### 多言語 / i18n

- 一部記事を日英両配信する（仕組みは `i18n-en.js`）。言語は `.en.md` から注入される `page.lang` で決まる
- UI文字列は Hexo ネイティブ i18n。`languages/{ja,en}.yml` に置き、テンプレートで `__('key')` で出す
- 検索UI/JS・サイドバー「最近の記事」・タグ/関連/前後ナビは `page.lang === 'ja'` で囲い、英語ページでは出していない（英語版は簡素化する方針）
