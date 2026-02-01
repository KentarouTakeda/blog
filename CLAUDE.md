# CLAUDE.md

このファイルは、Claude Code (claude.ai/code) がこのリポジトリで作業する際のガイダンスを提供します。

## プロジェクト概要

Hexoベースの日本語技術ブログ「No hack, no life.」（https://no-hack-no.life）。

## コマンド

| コマンド | 用途 |
|---------|------|
| `npm run build` | 静的サイトを `/public` に生成（`hexo g`） |
| `npm run watch` | ライブリロード付き開発サーバー起動（`hexo s`） |
| `npm run lint` | textlintによる日本語記事の校正 |
| `hexo new post <title>` | 新規ブログ記事の雛形作成 |
| `hexo clean` | 生成ファイルとキャッシュの削除 |

## 記事執筆

- 記事は `source/_posts/YYYY-MM-DD-title.md` に配置する
- `post_asset_folder: true` のため、記事と同名のディレクトリに画像等を格納できる
- フロントマター形式:

```yaml
---
title: 記事タイトル
subtitle: 補足説明（任意）
description: OGP用の要約（任意）
date: YYYY-MM-DD HH:mm
tags:
  - タグ名
---
```

## textlintルール

設定: `.textlintrc.js` / プリセット: `ja-technical-writing`

- 1文の最大文字数: 150文字
- 句点（。）で終わること（「、」「…」「:」は許可）
- 引用ブロック・コードブロック・Hexoテンプレートタグ（`{% ... %}`）はlint対象外

## テーマ・CI/CD

テーマ（EJS/SCSS/JS）の編集時は `/theme` スキル、CI/CDパイプラインの編集時は `/cicd` スキルを参照。
