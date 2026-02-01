---
name: cicd
description: CI/CDパイプラインの編集時に参照。GitHub Actionsワークフローやデプロイ設定の変更時に使う。
user-invocable: false
---

## ワークフロー

### test.yml（CI）

- トリガー: push / pull_request
- Node v24
- 手順:
  1. `npm i`
  2. `npm run lint`（textlint）
  3. `npm run build`（リトライ3回、タイムアウト10分）

### deploy.yml（CD）

- トリガー: masterへのpush
- PlantUMLサーバーを起動
  - サービスコンテナ、ポート8080
- `_config.yml` の `# GHA: uncomment-before-build` 行を自動アンコメント
  - PlantUMLサーバーURLの有効化
- `--prod --ignore-scripts` で依存関係をインストール

## デプロイフロー

1. ビルド: `npm run build`（リトライ3回）
2. 検証:
   - `public/index.html` の存在
   - `public/post/` ディレクトリの存在
   - 空ファイルがないこと
3. S3同期: `aws s3 sync --delete`
   - Cache-Control:
     - HTML: 1時間
     - フォント: 1年
     - CSS/JS/画像: 1日
     - その他: 1週間
4. CloudFront無効化: `/*`

## 必要なSecrets

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_DEFAULT_REGION`
- `S3_BUCKET`
- `CLOUDFRONT_DISTRIBUTION_ID`
