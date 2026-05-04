---
title: Laravel 13 新機能レポート Attributeによるクラス属性の設定
subtitle: プロパティ定義地獄からの解放と型安全な設定
description: Laravel 13のAttribute対応を検証。35の新規Attributeにより、Eloquent・Queue・Console等のクラス設定がどう便利になるかを実際のコード例で解説。
date: 2026-02-24 22:00
updated: 2026-05-04 12:00
tags:
  - PHP
  - Laravel
---

<small>
  {% details classes: 更新履歴 %}
    - 2026-02-24: 2月22日時点の `13.x-dev` の内容を元に公開
    - 2026-05-04: v13.0.0リリースまでに追加された次の6つのAttributeを追記
      - `#[Middleware]`
      - `#[Authorize]`
      - `#[ErrorBag]`
      - `#[Help]`
      - `#[Hidden]`
      - `#[Usage]`
  {% enddetails %}
</small>

## はじめに

Laravel 13が2026年3月17日にリリースされた。

かねてより待ち望んでいたクラス属性のAttribute対応をようやく試せた。検証結果と所感をまとめる。

従来、Laravelのクラス設定はプロパティ定義が担ってきた。Eloquentモデルの`$fillable`、キューの`$tries`、コンソールの`$signature`。いずれも親クラスの値を上書きする形式だが、Laravel 13ではこれらの多くをAttributeで宣言できる。今回の追加で、**Laravelが提供するAttributeクラスの総数は従来の29から64へ倍増した。**

## 新規Attributeの一覧

追加された35個のAttributeを領域ごとに整理する。多くはクラスに付与するが、Testing領域の`#[SetUp]` `#[TearDown]`はメソッドへ、Routing/Controllers領域の`#[Middleware]` `#[Authorize]`はクラス・メソッドの双方に付与する。

### Eloquentモデル: `Illuminate\Database\Eloquent\Attributes`

- `#[Table]`: テーブル名等の一括設定（全パラメータoptional）
  1. `?string $name`: テーブル名
  2. `?string $key`: 主キー名
  3. `?string $keyType`: キーの型
  4. `?bool $incrementing`: 自動増分IDの利用有無
  5. `?bool $timestamps`: タイムスタンプの利用有無
  6. `?string $dateFormat`: 日付のフォーマット
- `#[Fillable]`: 複数代入を許可するカラム
  1. `array<int, string> $columns`
- `#[Guarded]`: 複数代入を拒否するカラム
  1. `array<int, string> $columns`
- `#[Unguarded]`: 複数代入を全て許可（パラメータなし）
- `#[Visible]`: シリアライズ時に表示するカラム
  1. `array<int, string> $columns`
- `#[Hidden]`: シリアライズ時に非表示にするカラム
  1. `array<int, string> $columns`
- `#[Appends]`: シリアライズ時に追加するアクセサ
  1. `array<int, string> $columns`
- `#[Connection]`: DB接続名
  1. `string $name`
- `#[Touches]`: 更新時にタイムスタンプを更新するリレーションシップ
  1. `array<int, string> $relations`

### ジョブ: `Illuminate\Queue\Attributes`

- `#[Tries]`: リトライ回数
  1. `int $tries`
- `#[Backoff]`: リトライ待機秒数。配列で段階的な指定も可能
  1. `array<int, int>|int $backoff`
- `#[Timeout]`: タイムアウト秒数
  1. `int $timeout`
- `#[MaxExceptions]`: 例外の上限回数
  1. `int $maxExceptions`
- `#[UniqueFor]`: 一意ロックの秒数
  1. `int $uniqueFor`
- `#[FailOnTimeout]`: タイムアウト時に失敗扱いにする（パラメータなし）
- `#[Connection]`: キュー接続名
  1. `string $connection`
- `#[Queue]`: キュー名
  1. `string $queue`

### Artisanコマンド: `Illuminate\Console\Attributes`

- `#[Signature]`: シグネチャとエイリアス
  1. `string $signature`
  2. `?array<int, string> $aliases`
- `#[Description]`: コマンドの説明
  1. `string $description`
- `#[Help]`: 詳細な説明（`--help`時に表示）
  1. `string $help`
- `#[Usage]`: 使用例。複数指定可能
  1. `string $usage`
- `#[Hidden]`: コマンド一覧から非表示にする（パラメータなし）

### フォームリクエスト: `Illuminate\Foundation\Http\Attributes`

- `#[RedirectTo]`: バリデーション失敗時のリダイレクト先URL
  1. `string $url`
- `#[RedirectToRoute]`: リダイレクトルート名
  1. `string $route`
- `#[ErrorBag]`: バリデーションエラーバッグ名
  1. `string $name`
- `#[StopOnFirstFailure]`: 最初の失敗でバリデーション停止（パラメータなし）

### コントローラ: `Illuminate\Routing\Attributes\Controllers`

- `#[Middleware]`: ミドルウェアの適用。クラス・メソッドの双方に付与でき、繰り返し指定も可能
  1. `Closure|string $middleware`
  2. `?array<int, string> $only`: 適用対象のメソッド名
  3. `?array<int, string> $except`: 除外するメソッド名
- `#[Authorize]`: 認可の適用。`#[Middleware]`を継承しPolicyへの委譲を担う。クラス・メソッドの双方に付与可能で、繰り返し指定も可能
  1. `UnitEnum|string $ability`: アビリティ名
  2. `array<int, string>|string|null $models`: 関連モデル
  3. `?array<int, string> $only`
  4. `?array<int, string> $except`

### テストの初期化やライフサイクル: `Illuminate\Foundation\Testing\Attributes`

- `#[Seed]`: テスト実行前にデフォルトシーダを実行
- `#[Seeder]`: 実行するシーダクラス
  1. `class-string<Seeder> $class`
- `#[SetUp]`: Bootable Traitのセットアップメソッドに付与（メソッドに付与・後述）
- `#[TearDown]`: Bootable Traitの終了処理メソッドに付与（メソッドに付与・後述）

### ファクトリ: `Illuminate\Database\Eloquent\Factories\Attributes`

- `#[UseModel]`: ファクトリに対応するモデルクラスを明示
  1. `class-string<Model> $class`

### APIリソースコレクション: `Illuminate\Http\Resources\Attributes`

- `#[Collects]`: リソースコレクションに含まれるAPIリソースクラス
  1. `class-string<JsonResource> $class`
- `#[PreserveKeys]`: 配列キーを保持するマーカー（パラメータなし）

## 新旧比較とAttributes記法の優位性

各グループから代表的なAttributeを選び、従来のプロパティ定義とAttributeでの宣言を対比する。視覚的なインパクトやイディオムの構造化に注目して欲しい。

### Eloquent: `#[Table]` ― 6つのプロパティを1つに統合

`#[Table]`は新規Attributeの中で最もパラメータが多い:

```php
// 従来の書き方: プロパティを個別に定義
class Order extends Model
{
    protected $table = 'orders';
    protected $primaryKey = 'order_id';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;
    protected $dateFormat = 'U';
}
```

```php
// 新たな書き方: Attributeで一括宣言
#[Table(
    name: 'orders',
    key: 'order_id',
    keyType: 'string',
    incrementing: false,
    timestamps: false,
    dateFormat: 'U',
)]
class Order extends Model
{
}
```

プロパティ定義はクラス本体の至るところに散らばる可能性がある。ファットクラスのレビューは本当に煩わしい。設定項目による`public`と`protected`の使い分けも頭が痛く、私自身、散々書いているはずなのに未だに覚えられない。

新たな書き方ではそれらが全て解決する。モデルを開いた瞬間に「このクラスの設定は何か」が把握できる。設定と振る舞いの視覚的な分離だ。

全パラメータがoptionalなので、必要なものだけを指定すればよい:

```php
// テーブル名だけ変えたい場合
#[Table(name: 'order_items')]
class OrderItem extends Model
{
}
```

### Eloquent: `#[Fillable]` ― よくあるモデル定義

実務で最も頻出する設定:

```php
// 従来の書き方
class User extends Model
{
    protected $fillable = [
        'name',
        'email',
        'password',
    ];
}
```

```php
// 新たな書き方
#[Fillable(['name', 'email', 'password'])]
class User extends Model
{
}
```

これらの設定は大きくなりがちだ。重要な設定なので削ることもできない。レビューを始めた矢先に、大量のカラム名が目に飛び込んできて気が遠くなる経験をした方は多いと思う。それらをクラス外部に押し出して書く場所を統一できる。このメリットは大きい。

今回紹介した以外にも、Attributeを駆使すればEloquentモデルの設定は今より大幅に簡潔になるはずだ。

### Queue: 複数Attributeの積み重ね

キュー設定も複数のプロパティにまたがるためAttributeの恩恵が大きい:

```php
// 従来の書き方
class ProcessPayment implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
    public $timeout = 60;
    public $backoff = [1, 5, 10];
    public $maxExceptions = 2;
    public $connection = 'redis';
    public $queue = 'payments';
}
```

```php
// 新たな書き方
#[Tries(3)]
#[Timeout(60)]
#[Backoff([1, 5, 10])]
#[MaxExceptions(2)]
#[Connection('redis')]
#[Queue('payments')]
class ProcessPayment implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
}
```

複数のAttributeを使う時は、このように単純に積み重ねれば良い。

ここで嬉しいのは型付けだ。`Model`を継承するEloquentモデルと異なり、ジョブクラスは *Plain Old PHP Object* として書けるためプロパティの名前や型に対して全く制約がかからない。要は、名前や型は完全に暗記勝負となりtypoに気づく手段が全く無い。

Attributeであれば、そこに適切な制約がかかる。`#[Backoff]`の`array<int, int>|int`型も注目。`#[Backoff(10)]`で固定秒数、`#[Backoff([1, 5, 10])]`で段階的な待機と、型で用途を使い分けられる。型に関する話題はこの後も取り上げる。

### Console: `#[Signature]` + `#[Description]`

```php
// 従来の書き方
class SendEmails extends Command
{
    protected $signature = 'mail:send {user} {--queue}';
    protected $description = 'Send emails to a user';
    protected $aliases = ['mail:dispatch'];
}
```

```php
// 新たな書き方
#[Signature('mail:send {user} {--queue}', aliases: ['mail:dispatch'])]
#[Description('Send emails to a user')]
class SendEmails extends Command
{
}
```

従来は3つの設定が並列に並んでいたが、新たな書き方では2つに集約された点に注目。シグネチャとエイリアスは密接に関連するため1つのAttributeにまとめたのだろう。Eloquentの例でも、基本的には1つの設定に対し1つのAttributeだったが、`#[Table]`だけは関連する複数設定を1つに束ねていた。これは、言語機能の進化によりフレームワークのデザインの選択肢が広がったことを示す好例だ。

### Routing/Controllers: `#[Middleware]` ― 散らばっていた宣言の集約

`Route::apiResource`は、CRUDを1行で定義できる代わりにメソッド単位でミドルウェアを切り分けるのが難しかった。この制限により、少しトリッキーなコードが必要になることもあった:

```php
// 従来の書き方（routes/web.php）
Route::apiResource('posts', PostController::class)
    ->middleware('throttle:api');
```

```php
// 従来の書き方（コントローラ）
class PostController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('cache.headers:public;max_age=600', only: ['index']),
            new Middleware('cache.headers:public;max_age=3600', only: ['show']),
        ];
    }
}
```

`throttle:api`と`cache.headers`で指定が2箇所に分散している。メソッド単位の設定の調整のため`only:`と組み合わせた冗長な指定が必要になっている。

`#[Middleware]`はAttributeを対象メソッドの直近に置き、両方の問題を解消する:

```php
// 新たな書き方（PostController に集約）
#[Middleware('throttle:api')]
class PostController extends Controller
{
    #[Middleware('cache.headers:public;max_age=600')]
    public function index(Request $request): JsonResponse
    {
        // ...
    }

    #[Middleware('cache.headers:public;max_age=3600')]
    public function show(Request $request, Post $post): JsonResponse
    {
        // ...
    }
}
```

クラスへの付与で全アクションに、メソッドへの付与でそのアクションだけに作用する。`Route::apiResource`は1行に戻り、ミドルウェアの全貌はコントローラを開けば見渡せる。

### Testing: `#[SetUp]` + `#[TearDown]` ― マジックメソッドからの脱却

この2つは他の新設Attributeと異なり、`Attribute::TARGET_METHOD`を対象とする。Bootable Traitという仕組みなのだが、広く使われている割にLaravelのドキュメントには記載されていない。少し詳しく解説する。

EloquentとFeature Testには「自動起動トレイト」という仕組みが用意されている。従来のトレイトは、クラスに対し単純にメソッドをmixinするだけだが、自動起動トレイトはインスタンスの作成や破棄に応じて初期化や解放の処理を自動的に行わせることができる。次のような具合だ:

```php
class UserControllerTest extends TestCase
{
    // useを宣言するだけでテスト開始時の初期化まで行われる
    use ActingAsUser;

    #[Test]
    public function 詳細画面が表示される(): void
    {
        // テストデータの生成やリクエスト前の認証設定はトレイト側で自動的に完了している
        $this->get("users/me")
            ->assertOk()
            ->assertSee($this->user->name);
    }
}
```

自動起動の宣言は、従来は「命名規則」で賄っていた。例えば `trait Foo`というトレイト名の場合、`setUpFoo()`, `tearDownFoo()`というメソッドを定義しておくと、テストの開始終了時に自動的に呼び出される。これをAttributeで宣言できるようになった。

```php
// 従来の書き方: マジックメソッド命名規則
trait InteractsWithSearch
{
    // メソッド名がトレイト名と一致している必要がある
    public function setUpInteractsWithSearch(): void
    {
        $this->initializeSearchEngine();
    }

    public function tearDownInteractsWithSearch(): void
    {
        $this->cleanupSearchIndex();
    }
}
```

```php
// 新たな書き方: Attributeで明示的に宣言
trait InteractsWithSearch
{
    // メソッド名は自由
    #[SetUp]
    public function initializeSearch(): void
    {
        $this->initializeSearchEngine();
    }

    #[TearDown]
    public function cleanupSearch(): void
    {
        $this->cleanupSearchIndex();
    }
}
```

命名規則を用いた設計には問題がある。例えば `setUpFoo()` とすべきところを `satUpFoo()` と間違えても、IDEも静的解析も警告を出さず、テスト実行時にエラーが発生することもなく、ただ静かに誤動作する。`#[SetUp]`や`#[TearDown]`はそれらのリスクを大幅に緩和する。

## 型システムによる正当性担保

Attributeへの移行は、単なる記法の変更ではない。型システムによる制約が加わることで、設定の正しさがコーディング中に検証できるようになる。

### パラメータの型制約

プロパティ定義時代は型の制約が弱い:

```php
// プロパティには型宣言があっても、値は実行時まで検証されない
class ProcessPayment implements ShouldQueue
{
    // 誤って文字列を指定してもその場ではエラーにならない: 後続の処理で問題が発生する
    public $tries = 'three';
    public $timeout = '1';
}
```

Attributeのコンストラクタには型が付く。`#[Tries]`は`int $tries`、`#[Timeout]`は`int $timeout`を要求する。文字列や不正な値を渡すと、Attribute生成時にTypeErrorが発生する:

```php
declare(strict_types=1); // strictモードでの動作が前提

// Attribute生成時にエラーになる: fail fastによる問題の早期発見
#[Tries('three')] // TypeError: Argument #1 ($tries) must be of type int
#[Timeout('1')]   // TypeError: Argument #1 ($timeout) must be of type int
class ProcessPayment implements ShouldQueue
{
}
```

せっかくなのでAttributeのコードも少し読んでおこう:

```php src/Illuminate/Queue/Attributes/Timeout.php
// 重要な箇所のみ抜粋
#[Attribute(Attribute::TARGET_CLASS)]
class Timeout
{
    public function __construct(public int $timeout)
    {
    }
}
```

`$timeout`に対しネイティブタイプヒントとして`int`で型付けしている点に注目。

ここ数年Laravel Frameworkでの型に関する議論を見てきた筆者として、この判断は大きな前進と考えている。より安全な型付けを誰しもが望んでいる一方で、型を狭めることにより既存のコードが壊れるリスクを取れない有名フレームワークとしては、対応は後ろ向きにならざるを得ない。現に今でも、多くの型付けがPHPDocに留まっている。

しかし今回のAttribute対応は完全な新機能だ。既存のコードを壊すこと無く、新たに書かれるコードをより安全にするための制約の導入。この点も、私が今回の対応を歓迎する理由の1つだ。

### マーカーAttributeのゼロ引数設計

`#[Unguarded]`、`#[FailOnTimeout]`、`#[StopOnFirstFailure]`、`#[PreserveKeys]`。これらはコンストラクタを持たないマーカーAttributeだ。

```php
// 従来の書き方: boolプロパティの冗長さ
class Post extends Model
{
    protected static $unguarded = true;
}
```

```php
// 新たな書き方: 存在自体が意味を持つ
#[Unguarded]
class Post extends Model
{
}
```

`$unguarded = true`には`= false`という別の状態がある。だが`#[Unguarded]`には「存在する」か「存在しない」の2状態しかない。`= false`を書いてしまう余地がなく、意図が曖昧になりえない。これがマーカーAttributeの強みだ。

### `class-string<T>`による制約

LaravelのEloquent Attributeは、PHPDocの`class-string<T>`パターンで引数を制約している:

```php
// CollectedByのPHPDoc
/** @param class-string<\Illuminate\Database\Eloquent\Collection<*, *>> $collectionClass */

// UseFactoryのPHPDoc
/** @param class-string<\Illuminate\Database\Eloquent\Factories\Factory> $factoryClass */

// UseEloquentBuilderのPHPDoc
/** @param class-string<\Illuminate\Database\Eloquent\Builder> $builderClass */
```

PHPStanはこれらの注釈を解釈する。`#[UseFactory]`に`Factory`を継承しないクラスを渡すと、静的解析で型エラーとして検出される。

```php
// PHPStanが警告する
#[UseFactory(UserController::class)] // NO: UserControllerはFactoryを継承していない

// PHPStanが通す
#[UseFactory(UserFactory::class)]    // OK: UserFactoryはFactoryを継承している
```

プロパティ定義の`protected static $factory = UserController::class`では、このレベルの静的検証は得られない。IDEの補完も`class-string<Factory>`の制約に従って候補を絞り込むため、誤ったクラスを指定するリスクが減る。

## 注意点・制限事項

### Attributeとプロパティの併用

Attributeを導入したPRのdescriptionでは、Attributeは「非破壊的」だと明記されている。既存のプロパティ定義は引き続き動作するため、時間をかけて段階的に移行できる。

**同じ設定項目をプロパティとAttributeの双方で定義した場合の動作には注意が必要だ。** Laravel 13では次のように動作する:

* Eloquentモデル: プロパティ優先 — Attributeは、プロパティが未定義の場合のみ適用される。
* それ以外: Attribute優先 - Attributeが宣言されている場合、プロパティの定義は無視される。

この優先順位はドキュメントやプルリクエストのどこにも記載されていない。Laravel 13向けの公式ドキュメントからは、プロパティ設定に関する記載はほぼ消えている。今後はAttributeのみ推奨するということだろう。

従って、次のように覚えておくと良い:

* プロパティとAttributeを同時に宣言してはいけない
* Laravel 13で新たに書くコードはAttributeのみを使用する

## まとめ

私にとって最も印象的だったのは、Eloquentモデルの命名規約に準拠せず設定がファットになっていたモデルを`#[Table]`や`#[Connection]`に書き直した時の視覚的なインパクトだった。モデルクラスを開いた瞬間に設定の全体像が分かる体験は、従来とは明確に異なる。

`#[SetUp]`と`#[TearDown]`も個人的に嬉しい。ドキュメントに載っていない命名規則に頼る不安から解放される。Attributeを付けるだけで意図が伝わるのはチームメンバーにも優しい。

`#[Middleware]`はコントローラ周りの整理に効いた。コンストラクタとルート定義の両方を行き来していた宣言群が、コントローラのクラス宣言部に集約される。動作を変えずに「どこに何が書いてあるか」だけが整う改修なのに、レビュー時の往復が一気に減る効果は、実装を書いてみて初めて分かった。

型制約の恩恵も実感した。`#[Tries('three')]`がIDEで即座に赤くなる体験も、かつてはなかったものだ。設定ミスをデプロイ前に潰せる安心感。

このAttribute対応はLaravel 13で書き方そのものを変える追加だ。ぜひ試してみて欲しい。

## 参考PR

{% link_preview https://github.com/laravel/framework/pull/58578 %}
#58578 Attributes
{% endlink_preview %}

{% link_preview https://github.com/laravel/framework/pull/58685 %}
#58685 Add Setup/TearDown trait attributes
{% endlink_preview %}

{% link_preview https://github.com/laravel/framework/pull/58874 %}
#58874 Allow aliases to be set in Signature Attribute
{% endlink_preview %}

{% link_preview https://github.com/laravel/framework/pull/58908 %}
#58908 Respect DeleteWhenMissingModels attribute on queued notifications
{% endlink_preview %}

{% link_preview https://github.com/laravel/framework/pull/59030 %}
#59030 Add controller middleware attribute
{% endlink_preview %}

{% link_preview https://github.com/laravel/framework/pull/59033 %}
#59033 Add ErrorBag attribute support for FormRequest
{% endlink_preview %}

{% link_preview https://github.com/laravel/framework/pull/59048 %}
#59048 Add Authorize controller middleware attribute
{% endlink_preview %}

{% link_preview https://github.com/laravel/framework/pull/59204 %}
#59204 Add additional Artisan attributes for usage, help and hidden
{% endlink_preview %}
