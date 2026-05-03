---
title: 'Laravel 13: FormRequest, Policy, ValidationRule が完成形に至るまでの変遷'
subtitle: 入口の疎結合 - 規約とアトリビュートで実現する「薄いコントローラー」
description: Laravel 13のFormRequest、Policy、ValidationRule、`#[Authorize]`、`#[Middleware]`の使い方を、GitHub風プルリクエストワークフローで解説。Laravel 9から完成形に至るAPI変遷も振り返り、規約とアトリビュートで判断のないコントローラーを書く。
date: 2026-05-03
tags:
  - PHP
  - Laravel
---

## 1. 肥大化との戦い、入口と出口

リクエストを受け取りレスポンスを返す。たったそれだけのはずなのに、コードはなぜか数百行になる。コントローラーメソッドの先頭が「似通ったコード」で埋まり、肝心のビジネスロジックに辿り着いた頃には読む気が失せている、そんな経験はないだろうか？

Laravelは、コントローラーから入口と出口の両側に「決まりきった処理」を切り離す仕組みがある。出口は{% post_link 2026-04-26-decoupling-with-laravel-events 前回の記事 %}で扱った。今回は入口を見ていこう。認証、認可、バリデーションを一気に取り扱う。

これらの仕組みは、雛形通りに使うだけでコントローラーを急激に薄くする。既に使いこなしている方も多いと思うが、Laravelのバージョンと共にシンタックスやベストプラクティスが変わってきた。

本記事はLaravel 13を前提とし、最新形で入口の構造を説明する。変遷の経緯そのものは最終章で改めて見る。

## 2. 入口の構造 ─ FormRequest と Policy

入口で扱う処理を分解すると、認証（このリクエストは誰のものか）、認可（その人にこの操作の権限があるか）、バリデーション（入力値は正当か）に分けられる。これらはフレームワーク側の前処理に閉じ込めることができる。

フレームワークがリクエストを受け取ってからコントローラー本体に到達するまでの流れは次のようになる:

```plantuml
actor User
participant Laravel
participant Controller

User -> Laravel : GET /posts/{post}

group フレームワーク
  group middleware: auth
    Laravel -> Laravel : 認証
    Laravel --> User : 失敗時は401
  end

  group Route Model Binding
    Laravel -> Laravel : モデル取得
    Laravel --> User : 失敗時は404
  end

  group Authorize
    Laravel -> Laravel : 認可
    Laravel --> User : 失敗時は403
  end

  group FormRequest
    Laravel -> Laravel : バリデーション
    Laravel --> User : 失敗時は422
  end

  Laravel -> Controller : コントローラー呼び出し
end

group アプリケーション
  Controller -> Controller : 固有の処理
end

group フレームワーク
  Controller -> User : 200 + Resource
end
```

Laravel 13での書き方を示す。

認証は `#[Middleware]` 属性で要求する:
```php app/Http/Controllers/PostController.php
#[Middleware('auth')]
public function show(ShowPostRequest $request, Post $post)
{
    //
}
```

`FormRequest` はバリデーションルールを宣言する。コントローラーでは `$request->validated()` で通過済の入力値だけを受け取る:

```php app/Http/Requests/ShowPostRequest.php
class ShowPostRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'include' => [
                'nullable',
                'string',
                Rule::in(['comments', 'reactions']),
            ],
        ];
    }
}
```

`Policy` は認可判定を持つ。第1引数の `User` は認証済みユーザーが自動で注入される:
```php app/Policies/PostPolicy.php
class PostPolicy
{
    public function view(User $user, Post $post): bool
    {
        return $post->isPublic() || $post->author->is($user);
    }
}
```

`#[Authorize]` 属性で、コントローラーメソッドに認可をアタッチする。

```php
#[Authorize('view', 'post')]
public function show(ShowPostRequest $request, Post $post)
{
    //
}
```

これらの処理はフレームワークから自動的に呼び出され、失敗すればそこで打ち切られる。コントローラー本体に処理が入った時点で、リクエストはすべてのチェックを確実に通過済みだ。

これは単に行数が減る以上の意味を持つ。入力値の安全性や正当性は開発者の手に渡った時点で保証され、開発者は「危険な操作」を行いようがない。

自前のValidatorやAuthorizerに切り出してコントローラーから呼ぶ形でも行数だけは減る。しかし、結線のためのコードは依然必要で、書き忘れればセキュリティ事故に直結する。フレームワークの規約に乗せればその心配がなくなる。

次章ではより具体的な例と共に、フレームワーク機能を使わない素朴な書き方と、Laravel 13の機能を活用した書き方を比較してみよう。

## 3. 具体例: GitHub 風のプルリクエストワークフロー

題材としてGitHub風のプルリクエストワークフローを扱う。説明のため簡略化する箇所はあるが、基本的にGitHubをモデルに読んでほしい。状態遷移や認可の組み合わせが豊富で、入口が複雑になりがちな好例だ。

ドメインを最低限だけ確認する:

```plantuml
hide empty members

entity ユーザー

enum ロール <<pivot>> {
  * maintainer
  * committer
  * reader
}

entity リポジトリ {
}

entity プルリクエスト {
  state
  ..
  * draft
  * open
  * closed
  * merged
}

ロール ||-u-o{ リポジトリ
ロール ||-d-o{ ユーザー
ユーザー ||-r-o{ プルリクエスト
リポジトリ ||-r-o{ プルリクエスト
```

後続の実装例の前提となるEloquentモデルは次のようになる:

{% details ユーザー・リポジトリ・プルリクエストを表現したEloquentモデル %}

```php app/Models/User.php
class User extends Authenticatable
{
    public function pullRequests(): HasMany
    {
        return $this->hasMany(PullRequest::class, 'author_id');
    }

    public function repositories(): BelongsToMany
    {
        return $this->belongsToMany(Repository::class)
            ->withPivot('role');
    }
}
```

```php app/Models/Repository.php
class Repository extends Model
{
    public function collaborators(): BelongsToMany
    {
        return $this->belongsToMany(User::class)
            ->withPivot('role');
    }
}
```

```php app/Enums/PullRequestState.php
enum PullRequestState: string
{
    case Draft = 'draft';
    case Open = 'open';
    case Closed = 'closed';
    case Merged = 'merged';
}
```

```php app/Models/PullRequest.php
class PullRequest extends Model
{
    protected function casts(): array
    {
        return [
            'state' => PullRequestState::class,
        ];
    }

    public function repository(): BelongsTo
    {
        return $this->belongsTo(Repository::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }
}
```

{% enddetails %}

題材は「プルリクエストの更新」に絞る。タイトル・本文・baseブランチを変更するエンドポイントだ。

### 素朴に書くと

HTTPレイヤーのLaravel機能を一切使わず、Symfony Request を受け取り Response を返すだけの形で書いてみる。認証、認可、バリデーションを全部コントローラー本体に並べる:

{% details 素朴版コントローラーの全文 %}

```php app/Http/Controllers/UpdatePullRequest.php
class UpdatePullRequest
{
    public function __invoke(Request $request, int $number): Response
    {
        // 認証: Bearer トークンから User を解決
        $token = $this->extractBearerToken($request);
        if ($token === null) {
            return new JsonResponse([
                'message' => 'Unauthenticated'
            ], 401);
        }

        $user = User::query()->where('api_token', $token)->first();
        if ($user === null) {
            return new JsonResponse([
                'message' => 'Unauthenticated'
            ], 401);
        }

        // リソース取得
        $pullRequest = PullRequest::query()->where('number', $number)->first();
        if ($pullRequest === null) {
            return new JsonResponse([
                'message' => 'Not Found'
            ], 404);
        }

        // 認可: 作者か、メンテナー権限の協力者。状態は open または draft のみ
        $isAuthor = $pullRequest->author_id === $user->id;
        $isMaintainer = $pullRequest->repository
            ->collaborators
            ->contains(fn (User $collaborator) =>
                $collaborator->id === $user->id
                && $collaborator->pivot->role === 'maintainer'
            );

        if (! $isAuthor && ! $isMaintainer) {
            return new JsonResponse([
                'message' => 'Forbidden'
            ], 403);
        }

        if (! in_array($pullRequest->state, [PullRequestState::Open, PullRequestState::Draft], true)) {
            return new JsonResponse([
                'message' => 'Forbidden'
            ], 403);
        }

        // バリデーション
        $payload = json_decode($request->getContent(), true) ?? [];
        $errors = [];

        $title = $payload['title'] ?? null;
        if (! is_string($title) || $title === '') {
            $errors['title'] = '件名が入力されていません';
        } elseif (mb_strlen($title) > 255) {
            $errors['title'] = '件名が長すぎます';
        }

        $body = $payload['body'] ?? null;
        if ($body !== null && ! is_string($body)) {
            $errors['body'] = '本文の入力に誤りがあります';
        }

        $baseRef = $payload['base_ref'] ?? null;
        if ($baseRef !== null && ! is_string($baseRef)) {
            $errors['base_ref'] = '宛先ブランチの入力に誤りがあります';
        }

        if (! empty($errors)) {
            return new JsonResponse([
                'errors' => $errors
            ], 422);
        }

        // 更新
        $pullRequest->update([
            'title' => $title,
            'body' => $body,
            'base_ref' => $baseRef,
        ]);

        return new JsonResponse($pullRequest->toArray(), 200);
    }

    private function extractBearerToken(Request $request): ?string
    {
        $header = $request->headers->get('Authorization', '');
        if (! str_starts_with($header, 'Bearer ')) {
            return null;
        }

        return substr($header, 7);
    }
}
```

{% enddetails %}

90行ほどになる。HTTP リクエストの分解から始まって、ユーザー解決、リソース取得、認可、バリデーション、ようやく更新処理。本来やりたい「プルリクエストの更新」までの道のりが遠い。

### Laravel 13の規約に乗せると

同じ機能を `#[Middleware]` + `#[Authorize]` + `FormRequest` + `Policy` で書き直すと、コントローラー本体はこうなる:

```php app/Http/Controllers/UpdatePullRequest.php
class UpdatePullRequest
{
    #[Middleware('auth')]
    #[Authorize('update', 'pullRequest')]
    public function __invoke(
        UpdatePullRequestRequest $request,
        PullRequest $pullRequest,
    ): PullRequestResource {
        $pullRequest->update($request->validated());

        return $pullRequest->toResource();
    }
}
```

メソッドの実装は2ステップだけになった。「プルリクエストの更新」以外は全てメソッドの外に追い出されている:

{% details 認可 %}

```php app/Policies/PullRequestPolicy.php
class PullRequestPolicy
{
    public function update(User $user, PullRequest $pullRequest): bool
    {
        if (! in_array($pullRequest->state, [PullRequestState::Open, PullRequestState::Draft], true)) {
            return false;
        }

        if ($pullRequest->author_id === $user->id) {
            return true;
        }

        return $pullRequest->repository
            ->collaborators
            ->contains(fn (User $collaborator) =>
                $collaborator->id === $user->id
                && $collaborator->pivot->role === 'maintainer'
            );
    }
}
```

{% enddetails %}

{% details バリデーション %}

```php app/Http/Requests/UpdatePullRequestRequest.php
class UpdatePullRequestRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'body' => ['nullable', 'string'],
            'base_ref' => ['nullable', 'string', new BranchName()],
        ];
    }
}
```

{% enddetails %}

### 行数は減らない、責務が分かれる

もちろん、Beforeの90行をトータルで「数行」にできたわけではない。意味は別のところにある。

Beforeでは「プルリクエストの更新」という本筋が、認証や認可、バリデーションの分岐に埋もれていた。Afterではそれらが責務ごとに別ファイルへ切り出される。コントローラー本体に残るのは更新処理だけだ。

バリデーションルールを直したければ `FormRequest`、認可を変えたければ `Policy`、修正対象が一意に決まる。`#[Authorize]` のability名（認可アクション名）はPolicyのメソッド名そのものだから、IDEから認可判定のコードへ瞬時に飛べる[^vscode-laravel]。

## 4. ユニットテストに収まる三層

前章で分けた責務は、ただ移動しただけではない。FormRequest・Policy・Eloquentモデルのいずれも、インスタンスを作成しメソッドを叩くだけで軽量なテストが可能だ。

代表的なのはポリシーだ。`PullRequestPolicy::update()`は`User`と`PullRequest`を受け取りboolを返すだけの純粋なメソッド。テストはこう書ける:

```php tests/Unit/PullRequestPolicyTest.php
#[Test]
public function 作者はプルリクエストを更新できる(): void
{
    $author = new User()->forceFill(['id' => 42]);

    $pullRequest = new PullRequest([
        'author_id' => 42,
        'state' => PullRequestState::Open,
    ]);

    $policy = new PullRequestPolicy();

    $this->assertTrue($policy->update($author, $pullRequest));
}
```

データベースもサービスコンテナも要らない。Joel Clermontはこの軽さについて自身のブログ[^mastering-laravel-policy-refactor]で次のように書いている:

> I can test a policy by just creating a model and calling the policy method with that model. I no longer had to set up a more complex feature test and simulate a request into the application to exercise the policy logic.
>
> （拙訳: モデルを1つ作ってポリシーメソッドを呼ぶだけで、ポリシーをテストできる。ポリシーロジックを動かすために、複雑なフィーチャーテストを組み立ててアプリケーションへのリクエストをシミュレートする必要はもうない）

ポリシーの実装が薄いのは、認可モデルを枠で強制しないことの裏返しでもある。所有者やロール、リレーションシップの存在、パラメータの評価、いずれも普通のPHPのメソッドとして書ける。

バリデーションも同じ性質を持つ。`interface ValidationRule`の`validate()`メソッド1つを書けばよい。本記事の冒頭で触れたカスタムルールの単一責務化はこの形だ。先ほど`base_ref`で使った`BranchName`ルールはこう書ける:

```php app/Rules/BranchName.php
class BranchName implements ValidationRule
{
    public function validate(
        string $attribute,
        mixed $value,
        Closure $fail,
    ): void
    {
        if (! preg_match('#^[\w\-/]+$#', (string) $value)) {
            $fail('The :attribute must be a valid branch name.');
        }
    }
}
```

テストもシンプルだ。それぞれのカスタムバリデーションやそれに対する入力がユニットテストの粒度になる。

あまり知られていないが、Eloquentモデルを使ったテストもDBなしで書ける。`new`と`setRelation()`でドメインを組み立てテストにそのまま渡せば良い:

```php
$user = new User()->forceFill(['id' => 23]);
$user->setRelation('pivot', new Pivot([
    'role' => 'maintainer'
]));

$repository = new Repository();
$repository->setRelation('collaborators', collect([$user]));

$pullRequest = new PullRequest([
    'author_id' => 42,
    'state' => PullRequestState::Open,
]);
$pullRequest->setRelation('repository', $repository);

$policy = new PullRequestPolicy();
$this->assertTrue($policy->update($user, $pullRequest));
```

リレーションを辿ってロールを判定するコードを、まるごとユニットテストとして実装できた。

## 5. 応用編: 状態遷移認可

ここまで題材は「プルリクエストの更新」に絞ってきた。より現実に近い例も見ていこう。クローズされたプルリクエストの再オープン、承認済プルリクエストのマージ、状態遷移を伴う操作の認可は、ここまで紹介した形に素直に当てはめると落とし穴に陥る。

### 単一エンドポイントの落とし穴

教科書通りのCRUD実装の場合、状態を更新するエンドポイントを1本立て、リクエストパラメータの`state`で遷移先を指定する形になるだろう。だがこれは、Policyの実装に厄介な問題を持ち込む:

```php app/Policies/PullRequestPolicy.php
public function update(User $user, PullRequest $pullRequest): bool
{
    $next = request()->enum('state', PullRequestState::class);

    if ($next === PullRequestState::Closed && $pullRequest->state === PullRequestState::Open) {
        return $this->canCloseBy($user, $pullRequest);
    }

    if ($next === PullRequestState::Open && $pullRequest->state === PullRequestState::Closed) {
        return $this->canReopenBy($user, $pullRequest);
    }

    if ($next === PullRequestState::Merged && $pullRequest->state === PullRequestState::Open) {
        return $this->canMergeBy($user, $pullRequest);
    }

    // ... draft → open など

    return false;
}
```

`request()`からのパラメータ取り出しにより、ユニットテストが不可能になってしまった。加えて、`update()` というひとつのメソッドが「権限」「状態遷移ルール」を兼ね肥大化した。

### 状態遷移ごとに切り分ける

操作を1本のエンドポイントに集約せず、状態遷移ごとにエンドポイントとPolicyメソッドを分ける。

```php routes/api.php
Route::post('/pulls/{pullRequest:number}/close', CloseController::class);
Route::post('/pulls/{pullRequest:number}/reopen', ReopenController::class);
Route::post('/pulls/{pullRequest:number}/merge', MergeController::class);
```

```php app/Http/Controllers/MergeController.php
class MergeController
{
    #[Middleware('auth')]
    #[Authorize('merge', 'pullRequest')]
    public function __invoke(PullRequest $pullRequest): PullRequestResource
    {
        $pullRequest->merge();

        return $pullRequest->toResource();
    }
}
```

```php app/Policies/PullRequestPolicy.php
class PullRequestPolicy
{
    public function update(User $user, PullRequest $pullRequest): bool
    {
        /* タイトル・本文・baseブランチの更新ルール */
    }

    public function close(User $user, PullRequest $pullRequest): bool {
        /* open → closed への遷移ルール */
    }

    public function reopen(User $user, PullRequest $pullRequest): bool {
        /* closed → open への遷移ルール */
    }

    public function merge(User $user, PullRequest $pullRequest): bool {
        /* open → merged への遷移ルール */
    }
}
```

各メソッドがひとつの状態遷移を担い、`request()` への依存は消える。ユニットテストを維持できた。

`php artisan route:list -v` コマンドで各ルートの認可条件の一覧化も可能だ。単一エンドポイントの設計ではPolicyの中に埋もれていた情報が、ルート定義のメタデータとして可視化できる。

### リレーションシップによる認可

プルリクエストのマージ可否は権限だけでは決まらない。「メンテナー権限を持つユーザーが、レビュアーから規定数の承認を集めたプルリクエストのみマージできる」というルールを考えよう。`PullRequest` に `reviews()` リレーションを、`Repository` に `required_approvals` カラムを足すとして、Policy はこう書ける:

```php app/Policies/PullRequestPolicy.php
public function merge(User $user, PullRequest $pullRequest): bool
{
    $isMaintainer = $pullRequest->repository
        ->collaborators
        ->contains(fn (User $collaborator) =>
            $collaborator->id === $user->id
            && $collaborator->pivot->role === 'maintainer'
        );

    if (! $isMaintainer) {
        return false;
    }

    $approvals = $pullRequest->reviews
        ->where('state', ReviewState::Approved)
        ->count();

    return $approvals >= $pullRequest
        ->repository
        ->required_approvals;
}
```

ロール判定のための`BelongsToMany`、承認を数える`HasMany`、リレーションシップがそのまま認可の言葉になっている。

GitHubの権限モデルは、リポジトリへのロールと、プルリクエストごとのレビュー関係が組み合わさって決まる。後者のようなモデルをReBAC[^rebac] と呼ぶが、Laravelではこういった分類を意識する必要がない。Policyが認可モデルの形を強制しないため、Eloquentモデルの語彙を素直に実装に書き下せばそのまま認可ロジックになる、というわけだ。

状態遷移を含む複雑な要件まで、規約の枠内で素直に解ける。

ところで、Laravel自身もこの形に到達するまでに長い時間をかけてきた。最後に、入口の認証認可APIがたどってきた経緯を振り返ってみよう。

## 6. 完成形までの経緯

起点は8年前に遡る。2018年12月、Taylor Otwellは当時のTwitterでこう呟いた:

{% twitter https://x.com/taylorotwell/status/1078494087525908481 %}

> （拙訳: Policy を作って `AuthServiceProvider` に登録するプロセスがあまり好きじゃない。そこには規約が見える。定義のきれいな方法と、ユーザーが無効化できる仕組みがあればいい）

「規約が見えるから、定義のきれいな方法を」。Taylorのこの呟きを起点に「入口」のAPIは大きく整理されてきた。変遷を時系列で並べる。

1. Laravel 10: カスタムバリデーションルールの実装を`interface ValidationRule`に統一
   - Laravel 9: メソッド1つだけを実装する形式
   - Laravel 10: `Rule` / `InvokableRule` の2契約が1本化
     - `make:rule` の雛形もこの形に変更
2. Laravel 10.8: `FormRequest::after()` による追加バリデーションの簡略化
   - 従来は `withValidator($validator)` でバリデータインスタンスを直接操作
   - `after(): array` で複数のルールオブジェクトの列挙も可能
   - DIコンテナによるメソッドインジェクションで任意のサービスを利用可能
3. Laravel 11: Policy自動検出が標準に
   - **冒頭の呟きへの、6年越しの直接の答え**
   - `App\Models\Foo` と `App\Policies\FooPolicy` が名前空間規約で対応付け
     - `AuthServiceProvider` への登録は不要に
   - 命名規約から外れるときは `#[UsePolicy]` 属性で上書き可能[^policy-discovery]
4. Laravel 11: `authorizeResource` メソッドが公式ドキュメントから事実上消えた
   - 非標準アクションでの認可スキップ問題[^securing-laravel-resource]を抱えていた
5. Laravel 11/13: 認可呼び出しを `#[Authorize]` 属性に集約
   - Laravel 11でコントローラー基底クラスから `AuthorizesRequests` trait が撤去
   - `$this->authorize()` 経由の呼び出しはLaravel 13の `#[Authorize]` 属性へ
6. Laravel 11/13: ミドルウェア宣言を `#[Middleware]` 属性に集約
   - 以前はコンストラクタ内で `$this->middleware('auth')` を宣言する形式
   - Laravel 11で `HasMiddleware` interface に置き換わる
   - Laravel 13で `#[Middleware]` 属性へ

一連のAPIはLaravel 13で完成形へ辿り着いた、これが筆者の見立てだ。バリデーション・認可・ミドルウェア、それぞれ独立した改善だが、向かう先は「規約とアトリビュートで責務を薄いクラスへ切り出す」という点で一貫している。

一方、同じプロジェクトの中で書き方が不揃いだったり、最新のLaravelなのにサポート終了したバージョンの書き方を続けていたり、そんなコードも現在進行形で見かける。

そこに一石を投じたく、この記事を書いた。

[^vscode-laravel]: 認可アクション名など「文字列」をキーとしたジャンプは[Official Laravel VS Code Extension](https://marketplace.visualstudio.com/items?itemName=laravel.vscode-laravel)がサポートしている。他にも、翻訳キーや環境変数、`config()`設定のジャンプなど、通常のIDEではサポートされないLaravel特有の構文の多くに対応している。Laravel Wayで開発するなら必須の拡張機能だ。

[^mastering-laravel-policy-refactor]: Joel Clermont [Refactoring logic into a policy method](https://masteringlaravel.io/daily/2024-06-19-refactoring-logic-into-a-policy-method)

[^rebac]: Relationship-Based Access Control。関係そのものを認可判定の根拠にする設計の総称。[Relationship-based access control - Wikipedia](https://en.wikipedia.org/wiki/Relationship-based_access_control)

[^policy-discovery]: [Laravel 13.x ドキュメント（日本語版）「認可 - ポリシーの登録」](https://readouble.com/laravel/13.x/ja/authorization.html#registering-policies)

[^securing-laravel-resource]: Stephen Rees-Carter [Securing Laravel「Security Tip: Watch out for Resource Authorisation」](https://securinglaravel.com/security-tip-watch-out-for-resource/)
