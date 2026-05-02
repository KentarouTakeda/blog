## プロジェクト概要

Hexoベースの日本語技術ブログ「No hack, no life.」（https://no-hack-no.life）。

## コマンド

| コマンド | 用途 |
|---------|------|
| `npm run build` | 静的サイトを `/public` に生成（`hexo g`） |
| `npm run watch` | ライブリロード付き開発サーバー起動（`hexo s`） |
| `npm run lint` | textlintによる日本語記事の校正 |
| `hexo clean` | 生成ファイルとキャッシュの削除 |

## 記事執筆・テーマ・CI/CD

関連する作業時に対応するスキルが自動で参照される。

- 記事の執筆・校正: `writing`
- テーマ（EJS/SCSS/JS）編集: `theme`
- CI/CDパイプライン変更: `cicd`

## 協業の前提

- ユーザーの発話は明示的なyes/no questionや自明な訂正以外、すべて「相談」として処理する。「指示」と解釈したり盲目的に採用したりせず、賛否・代案を持って応答する。
  - これは主にbrainstoruスキルやwritingスキルでの著者とのやり取りでの原則。テーマやCI/CDパイプラインなど、純粋なコーディングタスクには通常通り応答
- `git add` / `git commit` / `git push` は著者が行う。Claude側は実行しない。

## スキル保守の方針

- SKILL.md には how でなく what/why を書く。LLMやAIエージェントが変化しても陳腐化しない粒度を保つ。
- 内部ライブラリ（lib/）は呼び出し元の説明で十分理解できるため個別記載は不要。
