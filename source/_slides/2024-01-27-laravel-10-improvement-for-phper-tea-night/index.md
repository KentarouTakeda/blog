---
title: Laravel 10 マイナーバージョンでの機能追加を振り返る
---

## Laravel 10

### マイナーバージョンでの<br>機能追加を振り返る

[PHPer Tea Night #15 - Laravel11直前回](https://phper-tea-night.connpass.com/event/306760/)

[#phperteanight](https://twitter.com/hashtag/phperteanight)

---

### なぜ今 `L10` を振り返るか？

`L9-L10` にかけて機能追加のサイクルが変わった

* 新機能も随時マイナーバージョンへ投入

* メジャーバージョンでは破壊的変更を消化

メジャーバージョンは新機能が少ない

---

### どうやって振り返るか？

ドキュメントからは機能追加を追いにくい

* マイナーバージョンはリリースノートなし

* ドキュメントの更新が遅い（または無い）

**方法: Pull Requestをひたすら追いかける**

---

### Pull Requestをひたすら追いかける 

<small>
  v10.0.0, v10.0.1, v10.0.2, v10.0.3, v10.1.0, v10.1.1, v10.1.2, v10.1.3, v10.1.4, v10.1.5, v10.2.0, v10.3.0, v10.3.1, v10.3.2, v10.3.3, v10.4.0, v10.4.1, v10.5.0, v10.5.1, v10.6.0, v10.6.1, v10.6.2, v10.7.0, v10.7.1, v10.8.0, v10.9.0, v10.10.0, v10.10.1, v10.11.0, v10.12.0, v10.13.0, v10.13.1, v10.13.2, v10.13.3, v10.13.5, v10.14.0, v10.14.1, v10.15.0, v10.16.0, v10.16.1, v10.17.0, v10.17.1, v10.18.0, v10.19.0, v10.20.0, v10.21.0, v10.21.1, v10.22.0, v10.23.0, v10.23.1, v10.24.0, v10.25.0, v10.25.1, v10.25.2, v10.26.0, v10.26.1, v10.26.2, v10.27.0, v10.28.0, v10.29.0, v10.30.0, v10.30.1, v10.31.0, v10.32.0, v10.32.1, v10.33.0, v10.34.0, v10.34.1, v10.34.2, v10.35.0, v10.36.0, v10.37.0, v10.37.1, v10.37.2, v10.37.3, v10.38.0, v10.38.1, v10.38.2, v10.39.0, v10.40.0, v10.41.0, v10.42.0
</small>

---

## 注目したい新機能を
#### 独断と偏見で
## ピックアップ

---

#### [1/10] クラスベースの追加バリデーション

* v10.8.0: 2023-08-19
  * Added Class based after validation rules
    * by [@timacdonald](https://github.com/timacdonald)
      in [#46757](https://github.com/laravel/framework/pull/46757)

---

#### [1/10] クラスベースの追加バリデーション

*Before:*

```php [1|5-6|8-9|10-14]
class HogeRequest extends FormRequest
{
  // 通常のバリデーション・省略

  // 追加バリデーション・バリデータがコールバックされるので、
  public function withValidator($validator)
  {
    // `after()` フックで追加処理を定義
    $validator->after(function ($validator) {
      // `rule()` の評価を全て終えた後に実行される。
      // 組み合わせバリデーションなどを行うことが多い。
      if ($this->somethingElseIsInvalid()) {
        $validator->errors()->add('field', 'バリデーションエラー！');
      }
    });
  }
}
```

---

#### [1/10] クラスベースの追加バリデーション

*After:* Request

```php [1|6-7|9-12]
class HogeRequest extends FormRequest 
  implements HogeRequestInterface
{
  // 通常のバリデーション・省略

  // `after()` メソッドインジェクションされた依存と共に
  protected function after(MyService $service): array
  {
    // 追加バリデーションを行うオブジェクトを配列で設定
    return [
      new AfterRule($this, $service),
    ];
  }
}
```

---

#### [1/10] クラスベースの追加バリデーション

*After:* Rule

```php [8-13]
class AfterRule
{
  public function __construct(
    private readonly HogeRequestInterface $request,
    private readonly MyService $service,
  ) {}

  public function __invoke($validator): void
  {
    if ($this->service->validate($request)) {
      $validator->errors()->add('field', 'バリデーションエラー！');
    }
  }
}
``` 

---

#### [2/10] ミドルウェアパラメータの直感的な構築

* v10.9.0: 2023-04-26
  * Added named static methods for middleware
    * by [@timacdonald](https://github.com/timacdonald)
      in [#46362](https://github.com/laravel/framework/pull/46362)

---

#### [2/10] ミドルウェアパラメータの直感的な構築

*Before:* Laravel Document

```php [4]
// パラメータを入力する際は `:` の後ろに入力
Route::put('/post/{id}', function (string $id) {
  // ...
})->middleware('role:editor');
```

```php [4]
// 複数パラメータはカンマで区切る
Route::put('/post/{id}', function (string $id) {
    // ...
})->middleware('role:editor,publisher');
```

---

#### [2/10] ミドルウェアパラメータの直感的な構築

*Before:*

```php [3]
// クラス指定のみ
Route::put(...)
  ->middleware(RequirePassword::class);
```

```php [3]
// クラス指定のみ + パラメータ + 変数（複数）
Route::put(...)
  ->middleware(RequirePassword::class . ':' . $route . ',' + $seconds);
```

*After:*

```php [3-6]
// Static Methodでパラメータを指定
Route::put(...)
  ->middleware(RequirePassword::using(
    redirectToRoute: 'admin',
    passwordTimeoutSeconds: 100,
  ));
```

---

#### [2/10] ミドルウェアパラメータの直感的な構築

<small>
  実装: 主要なミドルウェアへユースケース毎にstatic methodが追加された
</small>

```php
// RequirePassword.php

public static function using($redirectToRoute = null, $passwordTimeoutSeconds = null)
{
  return static::class.':'.implode(',', func_get_args());
}
```

```php
// ValidateSignature.php

public static function relative()
{
  return static::class.':relative';
}

public static function absolute()
{
  return static::class;
}
```

---

* laravel/laravel v11.x 2023-07-02
  * [11.x] Slim skeleton
    * by [@taylorotwell](https://github.com/taylorotwell)
      in [#6188](https://github.com/laravel/laravel/pull/6188)

> All middleware has been removed. Configuration of these middleware’s behavior can be done via static methods on the middleware themselves (see framework notes).

* L11の `app/Http/Middleware` はデフォルトで空
* 従来のカスタマイズは全てstatic methodで可能

---

#### [2/10] ミドルウェアパラメータの直感的な構築

*PR: 自作ライブラリに取り入れてみた*

```php [5|14]
public function handle(
  Request $request,
  \Closure $next,
  string $provider = '',
  bool $skipResponseValidation = false,
): Response { ... }

public static function config(
  string $provider = null,
  bool $skipResponseValidation = false
): string {
  return static::class.':'.implode(',', [
    $provider ?? '',
    $skipResponseValidation ? '1' : '0', // `'false'` is truthy
  ]);
}
```

* [kentaroutakeda/laravel-openapi-validator](https://packagist.org/packages/kentaroutakeda/laravel-openapi-validator)
  * [OpenApiValidator.php#L32-L44](https://github.com/KentarouTakeda/laravel-openapi-validator/blob/v0.10.1/src/Http/Middleware/OpenApiValidator.php#L32-L44)

---

#### [3/10] "Sleep" ヘルパ

* v10.10.0: 2023-05-10
  * Added Illuminate/Support/Sleep
    * by [@timacdonald](https://github.com/timacdonald)
      in [#46904](https://github.com/laravel/framework/pull/46904)
      [#46963](https://github.com/laravel/framework/pull/46963)

---

#### [3/10] "Sleep" ヘルパ

* 標準関数のラッパー

```php
Sleep::usleep(30000); // usleep(30000);
Sleep::sleep(2);// sleep(2);
Sleep::until(1682641623);// time_sleep_until(1682641623)
```

* `DateTimeInterface` 対応

```php
Sleep::until(now()->addMinute());
```

* メソッドチェーン

```php
Sleep::for(3)->minutes();

Sleep::for(3)->minutes()
  ->and(5)->seconds()
  ->and(9)->milliseconds();
```

---

#### [3/10] "Sleep" ヘルパ

* モック

```php
protected function setUp(): void
{
  parent::setUp();

  Sleep::fake();
}
```

---

#### [3/10] "Sleep" ヘルパ

* 「スリープされたこと」をアサーション

```php [|5|8-10|4|13|16-21]
public function testItRetriesWithBackoffForFailedWebhooks()
{
  $attempts = 0;
  Sleep::fake();
  Http::fake(['https://laravel.com' => function () use (&$attempts) {
    $attempts++;

    return $attempts++ === 3
      ? Http::response('', 200)
      : Http::response('', 500);
  }]); 

  Webhook::send('https://laravel.com');

  $this->assertSame(3, $attempts);
  Sleep::assertSleptTimes(3);
  Sleep::assertSequence([
    Sleep::for(100)->milliseconds(),
    Sleep::for(200)->milliseconds(),
    Sleep::for(300)->milliseconds(),
  ]);
}
```

---

#### [3/10] "Sleep" ヘルパ

* 「スリープされなかったこと」をアサーション

```php [|3-4|6|8]
public function testItSendsWebhookSuccessfluly()
{
  Sleep::fake();
  Http::fake(['https://laravel.com' => Http::response('', 200)]);

  Webhook::send('https://laravel.com');

  Sleep::assertNeverSlept(); // Let's find 🥚
}
```

---

#### [4/10] SQLログでのバインドパラメータ展開

* v10.15.0: 2023-07-11
  * Add toRawSql, dumpRawSql() and ddRawSql() to Query Builders
    * by [@tpetry](https://github.com/tpetry)
      in [#47507](https://github.com/laravel/framework/pull/47507)
  * Add getRawQueryLog() method 
    * by [@fuwasegu](https://github.com/fuwasegu)
      in [#47623](https://github.com/laravel/framework/pull/47623)

---

#### [4/10] SQLログでのバインドパラメータ展開

*Before:*

```php
User::query()
  ->where('id', 42)
  ->dump();
```
```
select * from "users" where "id" = ?
array:1 [
  0 => 42
]
```

*After:*

```php
User::query()
  ->where('id', 42)
  ->dumpRawSql();
```
```
select * from "users" where "id" = 42
```

---

#### [4/10] SQLログでのバインドパラメータ展開

```php [|2|4|6]
User::query()
  ->where('id', 23)
  ->whereHas('posts.tags', fn($q) => $q
    ->whereIn('name', ['foo', 'bar'])
  )
  ->whereRelation('posts', 'created_at', '>', now()->subDays(5))
  ->dump();
```

``` [|2|8|14|17|18-19|20-24]
select * from "users" where
  "id" = ?
  and exists (
    select * from "posts" where "users"."id" = "posts"."user_id"
    and exists (
      select * from "tags" inner join "post_tag" on "tags"."id" = "post_tag"."tag_id" where
        "posts"."id" = "post_tag"."post_id"
        and "name" in (?, ?)
    )
  )
  and exists (
    select * from "posts" where
      "users"."id" = "posts"."user_id"
      and "created_at" > ?
  )
array:4 [
  0 => 23
  1 => "foo"
  2 => "bar"
  3 => Illuminate\Support\Carbon @1704520465^ {#7579
    // 省略・Carbonインスタンスがdumpされる
    date: 2024-01-06 14:54:25.261130 Asia/Tokyo (+09:00)
  }
]
``` 

---

#### [4/10] SQLログでのバインドパラメータ展開

```php [|2|4|6]
User::query()
  ->where('id', 23)
  ->whereHas('posts.tags', fn($q) => $q
    ->whereIn('name', ['foo', 'bar'])
  )
  ->whereRelation('posts', 'created_at', '>', now()->subDays(5))
  ->dumpRawSql();
``` 

``` [|2|8|14]
select * from "users" where
  "id" = 23
  and exists (
    select * from "posts" where "users"."id" = "posts"."user_id"
    and exists (
      select * from "tags" inner join "post_tag" on "tags"."id" = "post_tag"."tag_id" where
        "posts"."id" = "post_tag"."post_id"
        and "name" in ('foo', 'bar')
      )
    )
    and exists (
      select * from "posts" where
        "users"."id" = "posts"."user_id"
        and "created_at" > '2024-01-06 14:54:57'
    )
```

---

#### [5/10] 秒単位のスケジューラー

* v10.15.0: 2023-07-11
  * Sub-minute Scheduling
    * by [@jessarcher](https://github.com/jessarcher)
      in [#47279](https://github.com/laravel/framework/pull/47279)

---

#### [5/10] 秒単位のスケジューラー

*Before:*

```php [4]
// app/Console/Kernel.php

$schedule->command(SecondlyCommand::class)
  ->everyMinute();
```

```php [7-13]
// app/Console/Commands/SecondlyCommand.php

public function handle()
{
  $until = now()->seconds()->addMinute();

  while(now() < $until) {
    $last = now();

    something();

    Sleep::until($last->addSecond());
  }
}
```

---

#### [5/10] 秒単位のスケジューラー

*After:*

```php [4]
// app/Console/Kernel.php

$schedule->command(SecondlyCommand::class)
  ->everySecond();
```

```php [5]
// app/Console/Commands/SecondlyCommand.php

public function handle()
{
  something();
}
```

---

#### [5/10] 秒単位のスケジューラー

*注意点:* プロセス内で1分間 **Laravelが自力でループ**

* 60を割り切れる秒数を指定
  ```php
  $schedule->command(...)->everySecond() // 1秒
  $schedule->command(...)->everyTwoSeconds() // 2秒
  $schedule->command(...)->everyFiveSeconds() // 5秒
  $schedule->command(...)->everyTenSeconds() // 10秒
  $schedule->command(...)->everyFifteenSeconds() // 15秒
  $schedule->command(...)->everyTwentySeconds() // 20秒
  $schedule->command(...)->everyThirtySeconds() // 30秒
  ```
* 分の途中でのデプロイは要注意
  ```bash
  # 必要に応じて旧バージョンの実行を中断
  php artisan schedule:interrupt
  ```
* メンテナンスモード解除後の動作
  * 次の分まで実行再開されない

---

#### [6/10] `config:show` コマンド

* v10.17.0: 2023-08-08
  * Add config:show command
    * by [@xiCO2k](https://github.com/xiCO2k)
      in [#47858](https://github.com/laravel/framework/pull/47858)

---

#### [6/10] `config:show` コマンド

*Before:* tinkerからの表示が最短

```
$ php artisan tinker 
Psy Shell v0.12.0 (PHP 8.3.1 — cli) by Justin Hileman
> config('app')
= [
    "name" => "Laravel",
    "env" => "local",
    "debug" => true,
    "url" => "http://localhost",
    // 省略
    "maintenance" => [
      "driver" => "file",
    ],
    "providers" => [
      "Illuminate\Auth\AuthServiceProvider",
      // 省略
      "App\Providers\RouteServiceProvider",
    ],
    "aliases" => [
      "App" => "Illuminate\Support\Facades\App",
      // 省略
      "Vite" => "Illuminate\Support\Facades\Vite",
    ],
  ]
```

---

#### [6/10] `config:show` コマンド

*After:* 専用コマンドで整形済みの値を表示

```
$ php artisan config:show app

  app .......................................................
  name .............................................. Laravel
  env ................................................. local
  debug ................................................ true
  url ...................................... http://localhost
  # 省略
  maintenance ⇁ driver ................................. file
  providers ⇁ 0 ......... Illuminate\Auth\AuthServiceProvider
  # 省略
  providers ⇁ 25 ......... App\Providers\RouteServiceProvider
  aliases ⇁ App .............. Illuminate\Support\Facades\App
  # 省略
  aliases ⇁ Vite ............ Illuminate\Support\Facades\Vite
```

---

#### [7/10] artisanコマンドでの対話的プロンプト

* v10.17.0:
  * Prompts
    * by [@jessarcher](https://github.com/jessarcher)
      in [#46772](https://github.com/laravel/framework/pull/46772)

---

#### [7/10] artisanコマンドでの対話的プロンプト 

*Before:*

```txt
$ php artisan make:controller

  What should the controller be named?
❯ ▓

  Which type of controller would you like: [empty]
  empty ................................................... 0
  api ..................................................... 1
  invokable ............................................... 2
  resource ................................................ 3
  singleton ............................................... 4
❯ ▓

  What model should this api controller be for? [none]
❯ ▓

  A App\Models\Some model does not exist. Do you want to generate it? (yes/no) [yes]
❯ ▓

  A App\Models\Some model does not exist. Do you want to generate it? (yes/no) [yes]
❯ ▓
```

---

#### [7/10] artisanコマンドでの対話的プロンプト

*After:*

```txt [3-5|7-13|15-21|23-25]
$ php artisan make:controller

 ┌ What should the controller be named? ────────────────────────┐
 │ E.g. UserController                                          │
 └──────────────────────────────────────────────────────────────┘

 ┌ Which type of controller would you like? ────────────────────┐
 │ › ● Empty                                                    │
 │   ○ Resource                                                 │
 │   ○ Singleton                                                │
 │   ○ API                                                      │
 │   ○ Invokable                                                │
 └──────────────────────────────────────────────────────────────┘

 ┌ What model should this api controller be for? (Optional) ────┐
 │                                                              │
 ├──────────────────────────────────────────────────────────────┤
 │ › Post                                                       │
 │   Tag                                                        │
 │   User                                                       │
 └──────────────────────────────────────────────────────────────┘

 ┌ A App\Models\Some model does not exist. Do you want to generate it? ┐
 │ ● Yes / ○ No                                                        │
 └─────────────────────────────────────────────────────────────────────┘
```

---

#### [7/10] artisanコマンドでの対話的プロンプト

```txt
 ┌ Which type of controller would you like? ────────────────────┐
 │ › ● Empty                                                    │
 │   ○ Resource                                                 │
 │   ○ Singleton                                                │
 │   ○ API                                                      │
 │   ○ Invokable                                                │
 └──────────────────────────────────────────────────────────────┘
```

```php
use function Laravel\Prompts\select;

$type = select('Which type of controller would you like?', [
  'empty' => 'Empty',
  'resource' => 'Resource',
  'singleton' => 'Singleton',
  'api' => 'API',
  'invokable' => 'Invokable',
]);
```

---

#### [8/10] Eloquentのレースコンディション対応

* v10.20.0 2023-08-23: 新設
  * Adds a `createOrFirst` method to Eloquent
    * by [@tonysm](https://github.com/tonysm)
      in [#47973](https://github.com/laravel/framework/pull/47973)
* v10.25.0 2023-09-27: リバート
  * Revert from using `createOrFirst` in other `*OrCreate` methods
    * by [@tonysm](https://github.com/tonysm)
      in [#48531](https://github.com/laravel/framework/pull/48531)
* v10.29.0 2023-10-25: 復活
  * Revival of the reverted changes in 10.25.0: `firstOrCreate` `updateOrCreate` improvement through `createOrFirst` + additional query tests
    * by [@mpyw](https://github.com/mpyw)
      in [#48637](https://github.com/laravel/framework/pull/48637)

---

#### [8/10] Eloquentのレースコンディション対応

1. `createOrFirst()`の新設
   1. まず`create()`を試みる
   2. 一意制約違反の場合`first()`を返却

2. `firstOrCreate()`も`createOrFirst()` を利用
   * [mpyw/laravel-retry-on-duplicate-key](https://github.com/mpyw/laravel-retry-on-duplicate-key) 相当機能

3. 以上を関連を含むEloquent全機能に適用

---

#### [8/10] Eloquentのレースコンディション対応

参考記事:
[createOrFirst の登場から激変した firstOrCreate, updateOrCreate に迫る！](https://zenn.dev/mpyw/articles/laravel-v10-create-or-first)
by [@mpyw](https://zenn.dev/mpyw)

| ユーザーA | ユーザーB |
|:-:|:-:|
| SELECT(結果なし) | |
| ︙ | SELECT(結果なし) |
| INSERT(成功) | ︙ |
| | **INSERT(エラー・キー重複)** |
| | **SELECT(回復・結果あり)** |

---

#### [8/10] Eloquentのレースコンディション対応

1. v10.20.0 2023-08-23: 新設
   * `createOrFirst` 自体は問題なかった

2. v10.25.0 2023-09-27: リバート
   * 新機能が既存機能の別の問題を尽く曝露
   * 問題は修正されたが新機能はリバート

3. v10.29.0 2023-10-25: 復活
   * [@mpyw](https://twitter.com/mpyw) が [@taylorotwell](https://twitter.com/taylorotwell) へメールで直談判
   * 既存機能を含む大量のテストを [@mpyw](https://twitter.com/mpyw) と [@fuwasegu](https://twitter.com/fuwasegu) がコントリビュート
---

#### [9/10] `afterCommit` 機能の拡張

* v10.30.0: 2023-10-31
  * Dispatch events based on a DB transaction result
    * by [@mateusjatenee](https://github.com/mateusjatenee)
      in [#48705](https://github.com/laravel/framework/pull/48705)
    * by [@taylorotwell](https://twitter.com/taylorotwell) in [the tweet](https://twitter.com/taylorotwell/status/1718014727438184934)

---

#### [9/10] `afterCommit` 機能の拡張

*Bad:*

```php [1-2|3-4|6-7|9-10|12-13]
// ユーザー作成処理 + 諸々
DB::transaction(function () {
  // ユーザー作成
  $user = User::create(...);  

  // イベント発火（リスナが外部システムへWebhookを送っていたとする）
  event(new UserRegistered($user));

  // 登録完了メールを送信
  dispatch(new SendWelcomeEmail($user));

  // **ここでトランザクション失敗したらどうなる？**
  ActivityLog::create(['user' => $user]);
});
```

---

#### [9/10] `afterCommit` 機能の拡張

*Before:*

```php [2]
dispatch(new SendWelcomeEmail($user))
  ->afterCommit() // commit後にディスパッチ
```

```php [|2|4]
class WebhookUserRegistration
  implements ShouldQueue // キュー投入可能なイベントリスナは、
{
  public $afterCommit = true; // commit後の投入を指示可能
}
```

---

#### [9/10] `afterCommit` 機能の拡張

*After:*

```php [1-2|7-8|13-14|19-20]
class ExampleEvent
  implements ShouldDispatchAfterCommit // commit後にディスパッチ
{
    // ...
}

class ExampleListener
  implements ShouldHandleEventsAfterCommit // commit後にハンドリング
{
    // ...
}

class ExampleJob
  implements ShouldQueueAfterCommit // commit後にキュー
{
    // ...
}

class SomeMailable extends Mailable
  implements ShouldQueueAfterCommit // commit後にメール送信
{
    // ...
}
```

---

#### [10/10] バッチジョブの動的なディスパッチ

* v10.31.0 2023-11-07
  * Allow placing a batch on a chain
    * by [@khepin](https://github.com/khepin)
      in [#48633](https://github.com/laravel/framework/pull/48633)

---

#### [10/10] バッチジョブの動的なディスパッチ

*参考: バッチジョブのチェーン*

```php
Bus::chain(
  // 3つのジョブを直列に実行
  [
    new InitializeJob(),
    // 外部API（ページング付き）から3ページ分データ取得
    Bus::batch([
      new LoadPage(page: 0), // 1ページ目を取得
      new LoadPage(page: 1), // 2ページ目を取得
      new LoadPage(page: 2), // 3ページ目を取得
    ]),
    new CompleteJob(),
  ]
)->catch(function (Throwable $e) {
  // 途中で失敗した場合の処理
})->dispatch();
```

---

#### [10/10] バッチジョブの動的なディスパッチ

*Before: Impossible:* 

```php [4|6|10]
Bus::chain([
  new InitializeJob(),

  // 外部API（ページング付き）から全権データ取得
  Bus::batch([
    new LoadPage(page: 0), // 開始しないとページ数がわからない
    new LoadPage(page: 1),
    new LoadPage(page: 2),
    // ...
    new LoadPage(page: $n), // $n が不明のためこのバッチは書けない
  ]),

  new CompleteJob(),
])->dispatch();
```

---

#### [10/10] バッチジョブの動的なディスパッチ

*Before: Alternative:*

```diff
 Bus::chain([
   new InitializeJob(),

   // 外部API（ページング付き）から並列でデータ取得
-  Bus::batch([
-    new LoadPage(page: 0), // 開始しないとページ数がわからない
-    new LoadPage(page: 1),
-    new LoadPage(page: 2),
-    // ...
-    new LoadPage(page: $n), // $n が不明のためこのバッチは書けない
-  ]),
+  new StartLoadPage(),
-
-  new CompleteJob(),
 ])->dispatch();
```

---

#### [10/10] バッチジョブの動的なディスパッチ

*Before: Alternative:*

```php [4-5|6-8|15-16|18-24]
// StartLoadPage.php
public function handle()
{
  Bus::batch([new LoadPage(page: 0)])
    ->then(function () {
      Bus::chain([
        new CompleteJob(),
      ])->dispatch();
    });
}

// LoadPage.php
public function handle()
{
  // 指定されたページを取得する処理（最初は 0 ページ目）
  // レスポンスに `$lastPage` が含まれる

  // 1ページ以降を追加ディスパッチ
  collect(range(1, $lastPage))
    ->each(fn ($page) => $this->batch()
      ->add(
        new static(page: $page)
      )
    );
}
```

---

#### [10/10] バッチジョブの動的なディスパッチ

*After:*

```diff
 Bus::chain([
   new InitializeJob(),

   // 外部API（ページング付き）からデータを取得
   Bus::batch([
-    new LoadPage(page: 0), // ジョブを開始しないとページ数がわからない。
+    new LoadPage(page: 0), // 後続のジョブを動的に追加できる
-    new LoadPage(page: 1),
-    new LoadPage(page: 2),
-    // ...
-    new LoadPage(page: $n), // $n が不明のためためこのバッチは書けない
   ]),

    new CompleteJob(),
 ])->dispatch();
```

---

### まとめ

---

#### 明日、朝一番に何をしますか？

---

`composer update laravel/framework`

---

#### 週に一度、何をすればいいでしょうか？

---

`composer update laravel/framework`

---

Thank you.
