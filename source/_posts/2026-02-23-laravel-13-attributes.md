---
title: Laravel 13 新機能レポート Attributeによるクラス属性の設定
subtitle: プロパティ定義地獄からの解放と型安全な設定
description: Laravel 13開発版のAttribute対応を検証。29の新規Attributeにより、Eloquent・Queue・Console等のクラス設定がどう便利になるかを実際のコード例で解説。
date: 2026-02-24 22:00
tags:
  - PHP
  - Laravel
---

## はじめに

Laravel 13が3月上旬にリリースされる予定だ。

{% twitter https://x.com/taylorotwell/status/2021555106269831216 %}

それに先立ち、既に開発版 `13.x-dev` が公開されている。かねてより待ち望んでいたクラス属性のAttribute対応を試してみた。本記事ではその結果と所感をまとめる。

従来、Laravelのクラス設定はプロパティ定義が担ってきた。Eloquentモデルの`$fillable`、キューの`$tries`、コンソールの`$signature`。いずれも親クラスの値を上書きする形式だが、13.xではこれらの多くをAttributeで宣言できる。今回の追加で、**Laravelが提供するAttributeクラスの総数は29から58へ倍増した。**

本記事は`13.x`ブランチの2026年2月22日時点のコードに基づく先行レビューである。正式リリースまでに変更される可能性がある点は留意してほしい。

## 新規Attributeの一覧

追加された29個のAttributeを領域ごとに整理する。多くはクラスに付与するが、Testing領域の`#[SetUp]`と`#[TearDown]`はメソッドに付与する。

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

### フォームリクエスト: `Illuminate\Foundation\Http\Attributes`

- `#[RedirectTo]`: バリデーション失敗時のリダイレクト先URL
  1. `string $url`
- `#[RedirectToRoute]`: リダイレクトルート名
  1. `string $route`
- `#[StopOnFirstFailure]`: 最初の失敗でバリデーション停止（パラメータなし）

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

### 開発版である

13.xブランチは開発版であり、正式リリースまでにAttributeの追加・変更・削除が起こりうる。本記事のコードは2026年2月22日時点のものだ。

### Attributeとプロパティの併用

Attributeを導入したPRのdescriptionでは、Attributeは「非破壊的」だと明記されている。既存のプロパティ定義は引き続き動作するため、時間をかけて段階的に移行できる。

**同じ設定項目をプロパティとAttributeの双方で定義した場合の動作には注意が必要だ。** 現時点の動作は次のようになる:

* Eloquentモデル: プロパティ優先 — Attributeは、プロパティが未定義の場合のみ適用される。
* それ以外: Attribute優先 - Attributeが宣言されている場合、プロパティの定義は無視される。

この優先順位はドキュメントやプルリクエストのどこにも記載されていない。開発版ドキュメント（現時点の13.x向けドキュメント）からは、プロパティ設定に関する記載はほぼ消えている。今後はAttributesのみ推奨するということだろう。

従って、次のように覚えておくと良い:

* プロパティとAttributeを同時に宣言してはいけない
* Laravel 13で新たに書くコードはAttributeのみを使用する

## まとめ

私にとって最も印象的だったのは、Eloquentモデルの命名規約に準拠せず設定がファットになっていたモデルを`#[Table]`や`#[Connection]`に書き直した時の視覚的なインパクトだった。モデルクラスを開いた瞬間に設定の全体像が分かる体験は、従来とは明確に異なる。

`#[SetUp]`と`#[TearDown]`も個人的に嬉しい。ドキュメントに載っていない命名規則に頼る不安から解放される。Attributeを付けるだけで意図が伝わるのはチームメンバーにも優しい。

型制約の恩恵も実感した。`#[Tries('three')]`がIDEで即座に赤くなる体験も、かつてはなかったものだ。設定ミスをデプロイ前に潰せる安心感。

個人的な予測だが、この変更はおそらくLaravel 13リリースノートでも目玉として扱われるだろう。正式リリース後、ぜひ試してみて欲しい。

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
