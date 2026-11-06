---
title: モダンLaravelを体験しよう！
subtitle: いつからLaravelがサーバサイドフレームワークだと錯覚していた？
description: PHPMatsuri Reboot in Hackoneで開催予定のハンズオン資料。Laravel + Wayfinder + Inertia.js + React + Laravel AI SDKによるAI時代のフルスタックLaravel開発
date: 2026-11-05 23:30
updated: 2026-11-07 00:00
tags:
  - PHP
  - Laravel
---

PHPMatsuri Reboot in Hackone[^phpmatsuri]で11月7日に開催予定のハンズオン[^handson]資料。参加者以外の方が記事を読みながら手元で体験できる構成にもなっている。

## ハンズオンの内容と目的

Laravelと聞いて、何を思い浮かべるだろうか？

多くの人は「PHP用のサーバサイドフレームワーク」と答えるだろう。間違いではないが、それは現代のLaravelの一面しか捉えていない。

2026年現在、LaravelはモダンフロントエンドやAIエージェント開発、ゼロスケールを含むオートスケール完備のクラウドデプロイ環境までを内包するようになった。それを体験するのがこのハンズオンの目的だ。デプロイはGitHub連携だけで済んでしまうので、このハンズオンではモダンフロントエンドとAIエージェント開発に焦点を当てる。

「前提環境」の確認、余裕があれば「セットアップ」の実施を済ませておくと、当日のHackoneが捗るはずだ。

## 前提環境

- PHP: `>=8.4.1`
  - `memory_limit >= 256M`
  - `pdo_sqlite`
- Composer: `>=2.10`
- Node.js: `^22.18 || ^24.11 || >=26`
- お好みのAIプロバイダ（このハンズオンはClaude Codeで動作確認した）
  - コーディングエージェントの動作する環境
  - Laravel AI SDKで使うAPIキー

## セットアップ

**このハンズオンではWayfinder（後述）の開発版を使う。** 安定版での実行も可能だが、型安全なフロントエンド開発の体験が一部失われる。是非とも開発版で試してみて欲しい。

開発版はLaravelの標準インストールに対していくつかの調整が必要なため、予めそれらを済ませたリポジトリを用意した。次の手順でセットアップできる:

Wayfinder開発版対応スターターキット（Laravel Cloudへのデプロイも試す場合は、forkしたリポジトリをclone）:

```sh
git clone \
  https://github.com/KentarouTakeda/modern-laravel-hands-on-2026.git
cd modern-laravel-hands-on-2026
```

Laravelセットアップ・`install` ではなく `setup` である点に注意:

```sh
composer setup
```

Laravel Boostセットアップ・コーディングエージェントをインストールした後に実行:

```sh
php artisan boost:install --no-interaction
```

Wayfinder開発版の利用に抵抗がある方のために、安定版のセットアップ方法も記載しておく。

{% details 参考: Wayfinder安定版を使う場合 %}

Laravel Installerのインストールまたは最新版への更新:

```sh
composer global require laravel/installer
```

このハンズオンと同等（Wayfinderのみ安定版）のセットアップ・コーディングエージェントをインストールした後に実行:

```sh
laravel new modern-laravel-hands-on-2026 \
  --react \
  --phpunit \
  --npm \
  --boost \
  --no-interaction
cd modern-laravel-hands-on-2026
```

*または*、対話プロンプトで好みのオプションを指定:

```sh
laravel new modern-laravel-hands-on-2026
cd modern-laravel-hands-on-2026
```

{% enddetails %}

どちらのセットアップも、次の方法で動作確認できる:

1. `composer dev` を実行
2. `http://localhost:8000` にアクセス
3. 確認: Laravelのウェルカムページが表示される


## 例題と解説: CfP投稿システムとAIによる講評

以上のセットアップの後は、実はやることは多くない。要点を押さえたごく短いプロンプトだけで、モダンフロントエンドに対応したAIエージェント内蔵アプリケーションが完成する。

カンファレンス登壇希望者がプロポーザルを投稿し、希望に応じてAIがその文章を講評する、そんなシステムを作ってみよう。「投稿」「AI講評」の指示をそれぞれAIに与え、その成果物を通じて、モダンLaravelの特徴を見ていこう。

### プロポーザルの投稿

#### 実装プロンプト

```md
プロポーザルのCRUDを作って。
種別はトーク・LT・ワークショップ。TSの型は手書きしないで。
test@example.com でログインして試せるよう、サンプルも入れておいて。
```

#### 成果物: [modern-laravel-hands-on-2026#4](https://github.com/KentarouTakeda/modern-laravel-hands-on-2026/pull/4)

![プロポーザルの一覧画面](proposals-index.png)

![プロポーザルの作成画面。種別の選択肢を開いたところ](proposals-create.png)

#### 解説: Wayfinder + Inertia.js による型安全なモダンフロントエンド

フロントエンドはInertia.jsで作られている。Inertia.jsは、サーバ側の言語を問わず、Next.jsのようなフルスタック構成のアプリをAPIなしで作れるライブラリだ[^inertia]。Wayfinderは、そのサーバとフロントの間を型でつなぐ。

模範的なLaravelアプリでは、URLはソースコードに直書きしない。予め定義されたルート名やパスパラメータを使い、次のように書くことが多いだろう:

```html
<!-- <a href="/proposals/42"> -->
<a href="{{ route('proposals.show', $proposal) }}">
```

Wayfinderはこれらのルート定義や型をフロントエンド向けに自動生成する。コードは次のようになる:

```tsx resources/js/pages/proposals/create.tsx
// <form action="/proposals" method="post">
<Form {...ProposalController.store.form()}>
```

```tsx resources/js/pages/proposals/index.tsx
// <a href="/proposals/42">
<Link href={ProposalController.show(proposal)}>
```

モダンフロントエンドの導入のためにサーバとフロントを分けた場合、URLのtypoやパスパラメータの取り違え、メソッドの不一致などの些細なミスに悩まされることが意外と多い。上のコードでは、その余地がほぼなくなっている。

生成されるのはルートだけではない。コントローラーからInertiaに渡すデータにも型が付く:

```php app/Http/Controllers/ProposalController.php
return Inertia::render('proposals/show', [
    'proposal' => $proposal,
]);
```

```tsx resources/js/pages/proposals/show.tsx
export default function ProposalsShow({ proposal }: Inertia.Pages.Proposals.Show) {
    proposal; // App.Models.Proposal
    proposal.title; // string
    proposal.type; // "talk" | "lightning_talk" | "workshop"

    // ...
}
```

コントローラーがInertiaに渡している配列の形式を正確に読み取っている。Eloquentモデルの型も認識している。`type`はPHP側では`enum ProposalType`だが、enumの定義も反映されている。これらの型情報は自動での同期も可能だ。

*余談:* プロンプトに「TSの型は手書きしないで」と入れたのはこのためだ。これらはWayfinder開発版の機能で、AIはまだ十分に学習していない。わざわざそう書かないと、TS側にモデルの型を手書きしてしまうことが多い。正式版のリリース後は、AIの学習が進んで不要になるだろう。

ここまで「Laravelとの連携において有利な点」を紹介したが、Inertia.jsは、モダンフロントエンドのライブラリにある機能を一通り備えている。主なものを挙げる:

- リンク先のプリフェッチ: `<Link href={...} prefetch>`
- propsのレイジーロード: `Inertia::defer(fn () => ...)`
- 画面に入った時点でロード: `<WhenVisible data="reviews">`
- UIの楽観的更新: `optimistic: (props) => ({ ... })`
- ページ遷移アニメーション: `<Link href={...} viewTransition>`
- サーバ側と連携しフォームの部分バリデーション: `validate('title')`

### AIによる講評

#### 準備: Laravel AI SDKのインストールと設定

インストール:

```sh
composer require laravel/ai
```

デフォルトの `openai` を変更する場合は設定ファイルをエクスポートし修正:

```sh
php artisan vendor:publish --provider="Laravel\Ai\AiServiceProvider"
```

```diff config/ai.php
-    'default' => 'openai',
+    'default' => 'anthropic',
```

環境変数にAPIキーを設定:

```diff .env
+ANTHROPIC_API_KEY=***
```

#### 実装プロンプト

```md
Laravel AI SDK で、プロポーザルをAIに講評してもらえるようにして。
講評は保存して、TSの型は手書きしないで。
```

#### 成果物: [modern-laravel-hands-on-2026#5](https://github.com/KentarouTakeda/modern-laravel-hands-on-2026/pull/5)

![プロポーザルの詳細画面と、保存されたAIの講評](proposal-review.png)

#### 解説: Laravel AI SDK による簡潔かつ安全な実装

開発者（特にLaravel開発者）にとって、Laravel AI SDKの嬉しさは、徹頭徹尾「いつもの書き方」が通用する点にあると感じている。

`php artisan make:agent ProposalReviewer` を実行すれば、適切なディレクトリにレビュー用エージェントの雛形が作成される。いつも通りだ。これに主な機能を一通り盛り込むと、次のようになる:

```php
#[UseSmartestModel] // 最上位のモデル
#[Timeout(120)]     // タイムアウト秒数
#[MaxTokens(2000)]  // 出力の上限
#[Provider([        // 利用するAI
    Lab::Anthropic, // 第1候補
    Lab::OpenAI,    // 障害やレート制限時の切替先
])]
class ProposalReviewer implements
    Agent,               // instructions(): システムプロンプト
    HasStructuredOutput, // schema(): 応答の型
    HasTools,            // tools(): エージェントに使わせるツール
    Conversational,      // messages(): 会話の履歴
    HasMiddleware        // middleware(): ミドルウェア
{
    use Promptable;      // prompt(), queue(), fake() など

    // ...
}
```

最近のLaravelを使う開発者にとって、既視感しかない見た目になっている。これまで幾度となく書いてきたEloquentモデル、コントローラー、イベントリスナ、それらと同じ書き心地、やはりいつも通り。Laravel 13で完成形に至った「規約とアトリビュートで責務を薄いクラスへ切り出す」形[^form]が、AI SDKにも引き継がれている。もちろん、使う側の書き心地もこれまでと変わらない:

```php
// その場で呼びレスポンスを待つ
$response = (new ProposalReviewer)->prompt($text);

// キューに積む
ProposalReviewer::make()->queue($text);
```

中でも嬉しいのは`HasStructuredOutput`だろう。AIから応答を受ける際の型をJSON Schemaで指示できる。この機能はLaravelとのかみ合わせが非常に良く、次のようなコードを書ける:

```php
// エージェント: キーをProposalReviewモデルのフィールドと揃える
public function schema(JsonSchema $schema): array
{
    return [
        'score' => $schema->integer()->min(1)->max(10)->required(),
        'summary' => $schema->string()->required(),
        'strengths' => $schema->array()->required()
            ->items($schema->string()),
        'improvements' => $schema->array()->required()
            ->items($schema->string()),
    ];
}
```

```php
// コントローラー: AIからの応答をそのまま保存する
$response = (new ProposalReviewer)->prompt($text);
$proposal->reviews()->create($response->structured);
```

薄いコントローラー[^form]である。FormRequestの入力をそのまま使い `create($request->validated())` で作成するのと同じ形。Eloquentモデルの期待する入力をAIの応答形式としてJSON Schemaで宣言し、AI SDKがそれをAIに伝えることで、このコードを実現している。

エージェントを実装せず気軽に使いたい場合も多いだろう。既存のAPIと融合する形で様々なヘルパが用意されている:

- 要約: `Str::of($proposal->abstract)->summarize()`
- Yes/Noの判定: `Str::of($proposal->abstract)->decide('PHPに関する発表か？')`
- Enumからの選択: `collect(ProposalType::cases())->decide('この発表の種別は？', $proposal->abstract)`
- Eloquentモデルからの選択: `Reviewer::all()->decide('適任の審査員は？', $proposal->abstract, by: 'name', describe: 'expertise')`
- 関連度による並べ替え: `Proposal::all()->rerank('abstract', 'AIエージェントの実践')`
- ベクトル検索: `Proposal::whereVectorSimilarTo('embedding', 'フロントエンドの型安全')->get()`
- インスタントエージェント: `agent('あなたは辛口の編集者です。')->prompt($proposal->abstract)`
- 画像生成: `Image::of('提灯が並ぶ夏祭りの会場')->landscape()->generate()`
- 音声合成: `Str::of('まもなく次の発表が始まります')->toAudio()`
- 文字起こし: `Transcription::fromStorage('session-recording.mp3')->generate()`

注意: 一部の機能はAIプロバイダやバックエンドのDBの設定に依存する。

テストもやはり既視感の塊だ:

```php
// Arrange: エージェントをモック（応答はすべて schema() に準拠する）
ProposalReviewer::fake();

// Act
$this->actingAs($proposal->user)
    ->post(route('proposals.reviews.store', $proposal));

// Assert: エージェントへの入力をアサーション
ProposalReviewer::assertPrompted(
    fn (AgentPrompt $prompt) => $prompt->contains($proposal->title),
);

// 応用例: AIの障害を再現する
ProposalReviewer::fake(
    fn () => throw new ProviderOverloadedException('Overloaded'),
);

// 応用例: フェイク応答が定義されていないAI呼び出しを例外にする
ProposalReviewer::fake()->preventStrayPrompts();
```

`Mail::fake()` や `Http::fake()` と同じ要領で書けば良い。

## フルスタック・モダンLaravel

2つの短いプロンプトで、型安全なモダンフロントエンドと、AIによる講評を備えたアプリケーションが完成した。記事中のサンプルでは、どちらのプロンプトも3分強で実装を終えている。

同じ機能は、他のフレームワークでも作れるだろう。だがLaravelでは、フロントエンドもAIも「いつもの書き方」が通用する。人間が迷わない形は、AIも迷わない[^design]。Laravel Boostがその知識をAIに伝えれば[^boost]、短いプロンプトでも完成度は高い。

いつからLaravelがサーバサイドフレームワークだと錯覚していた？ 今のLaravelは、フロントエンドからAIまでを同じ形で書けるフルスタックフレームワークだ。

[^phpmatsuri]: [PHPMatsuri Reboot in Hackone](https://phpmatsuri.asumikam.com/)
[^handson]: プロポーザル: [モダンLaravelを体験しよう！ — いつからLaravelがサーバサイドフレームワークだと錯覚していた？](https://fortee.jp/phpmatsuri-reboot-2026/proposal/1bb88df0-8fb7-42df-b8ed-f49fdae75b58)
[^inertia]: 筆者の登壇資料: [Inertia.jsのサーバサイド実装から学ぶ依存逆転原則の応用](https://speakerdeck.com/kentaroutakeda/inertia-dot-jsnosabasaidoshi-zhuang-karaxue-buyi-cun-ni-zhuan-yuan-ze-noying-yong)
[^form]: 筆者の過去記事: {% post_link 2026-05-03-decoupling-with-laravel-form-request-and-policy %}
[^design]: 筆者の過去記事: {% post_link 2026-02-01-good-design-works-for-ai-too %}
[^boost]: 筆者の登壇資料: [Laravel Boostに学ぶ、AIにPHPを書かせる技術 〜OSSの実装から蒸留するエージェント制御の王道〜](https://speakerdeck.com/kentaroutakeda/laravel-boostnixue-bu-ainiphpwoshu-kaseruji-shu-ossnoshi-zhuang-karazheng-liu-suruezientozhi-yu-nowang-dao)
