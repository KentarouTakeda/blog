---
title: Eloquent In Memory Testing
subtitle: Eloquentモデルを速く小さく手軽にテストする
date: 2023-12-15 00:00
ogimage: ogimage.png
tags:
  - PHP
  - Laravel
  - Eloquent
  - SQLite
---

この記事は [Laravel Advent Calendar 2023](https://qiita.com/advent-calendar/2023/laravel) 15日目の投稿です。

## 概要

EloquentはLaravelにおける *"諸刃の剣"* だ。

Laravelのポテンシャルを十二分に引き出すための強力な武器である一方、Active Recordパターンがアプリケーションに与える弊害もまた無視できない。

中でも問題となりやすいのがテストだ。Eloquentモデルがアプリケーション全体に蔓延った結果あらゆるテストでデータベース接続が必要となる、それを防ぐために不毛なモックを書き続ける、何れもよく見られる光景だ。

本記事では、それらの困難を「テストの設定」「テストの書き方」「Eloquentの責務」という観点から解決する手法を紹介する。主に利用するのは **SQLite In-Memory Databases** だ。（どうかここでブラウザを閉じたりしないで欲しい。その懸念もこの記事のテクニックである程度は解消する。）

テストで使うデータベースは本番環境と同じ製品が望ましい。しかしSQLiteのポータビリティやIn Memory Databaseの高速動作も捨てがたい。

そこで、In Memory Databaseを **一部のテストでのみ利用** することで、多くのテストを **速く小さく手軽に** 実行する。同時に、Active Recordパターンではどのようなテストや実装が望ましいのか、それらのテクニックも論ずる。

### ソースコードについて

本記事に掲載されたソースコードは [KentarouTakeda/example-eloquent-in-memory](https://github.com/KentarouTakeda/example-eloquent-in-memory) に完全な形で公開している。

記事中では必要に応じたコードの断片しか掲載しないが、全体を見たい場合はこちらを参照してほしい。次のPull Requestに記事の構成と全く同じ順序でcommitを残している。

{% link_preview https://github.com/KentarouTakeda/example-eloquent-in-memory/pull/1/commits rel:noopener %}
*リンク先情報の取得に失敗しました*
{% endlink_preview %}

## In-Memory Databasesの選択的適用

Laravel初期状態のphpunit.xmlには次のような記述がある。

{% link_preview https://github.com/laravel/laravel/blob/v10.2.10/phpunit.xml#L24-L25 rel:noopener %}
*リンク先情報の取得に失敗しました*
{% endlink_preview %}

```xhtml ./phpunit.xml
<!-- <env name="DB_CONNECTION" value="sqlite"/> -->
<!-- <env name="DB_DATABASE" value=":memory:"/> -->
```

この2行をアンコメントすることで、テストでIn Memory Databaseが使われる。だが **この方法は推奨しない** 。全てのテストでIn Memory Databaseが使われてしまうため、本番環境との動作の差異に苦しむことになる。

一部のテストだけで使うには、テスト時に動的にデータベースを切り替える必要がある。

具体的には、次のコードをテストクラスの冒頭に追加する。この方法を使う場合、 `RefreshDatabase` などのデータベーステスト用トレイトは必要ない。

```php In Memory Databaseへの動的な切り替え
public function setUp(): void
{
  $this->refreshApplication();
  config()->set('database.default', 'sqlite');
  config()->set('database.connections.sqlite.database', ':memory:');

  parent::setUp();
  $this->artisan('migrate');
}
```

{% details 実装の詳しい解説 %}

* データベース設定は `parent::setUp()` よりも前に行う。

  `setUp()` をオーバーライドする場合、通常は `parent::setUp()` を先頭に書く。

  しかしここでは、それより前にアプリケーションの設定変更を行っている。 `parent::setUp()` を先に呼び出すと、そこでデータベース接続を含む全ての設定が反映されてしまうので、それ以前に変更する必要があるというわけだ．
  
  `$this->refreshApplication()` で明示的にアプリケーションを起動している点にも注目。これが行われた後に `parent::setUp()` が呼ばれても、そこで別のアプリケーションが再起動されてしまうことはない。

* アプリケーションを起動した後 `$this->artisan('migrate')` でマイグレーションを行う。

  `RefreshDatabase` などのトレイトは使わない。In Memory Databaseであれば、何もせずともテスト毎に初期化される。
  
  Laravelが予め用意しているそれぞれのトレイトには、マイグレーション以外の今回は不要な処理も含まれている。それらは使わず、今回はマイグレーションだけ行えば良い。

  テスト終了時の `tearDown()` で次のテストのために `migrate:reset` や `db:wipe` 行う必要も無い。何もせずともデータは消えてくれる辺りも In Memory Database の気軽さだ。

{% enddetails %}

なお、ここでは以上の処理をテストクラス内に直接書いたが、後のリファクタリングでそれは不要となる。開発者は、普段はこのコードを意識する必要は無い。

## モデルファクトリのテスト

LaravelデフォルトのUserモデルをそのまま使っているものとする。結論として、まずは次のテストを実装する。

```php tests/Feature/Models/UserTest.php
public function setUp(): void
{
  // 前掲につき省略・以後同じ
}

public function testFactory(): void
{
  $user = User::factory()->create();
  $this->assertInstanceOf(User::class, $user);
}
```

ユーザーを作成し、それがユーザーであることをアサーションする。

単独ではあまり意味のないテストだ。モデルファクトリという「テストのための仕組み」を更にテストしているに過ぎないとも言える。

だが、このテストが後に活きてくる。

## 新たなモデルとリレーションシップの定義

ここから先は、次のようなER図に相当するモデルやリレーションシップを実装することを目標にハンズオン形式で進めていく。

```plantuml
left to right direction

Entity User <<ユーザー>> {
  * id
  ---
  <i>省略</i>
}

Entity Post <<投稿>> {
  * id
  ---
  * user_id User
  ---
  * subject 件名
  * content 本文
  published_at 公開日時
}
Entity Tag <<タグ>> {
  * id
  ---
  * name 名前 unique
}

User ||--o{ Post
Post }o--o{ Tag
```

### Postモデルの作成（初期状態）

まずはPostモデルの雛形をLaravelに作成させる。

```sh
# make:model コマンドで Post モデルを作成。
# -m: マイグレーションを同時に作成
# -f: ファクトリを同時に作成
./artisan make:model Post -m -f
```

続けて、先ほどの UserTest と同等のテストをPostTestとして新たに作成し、以上の初期状態のPostモデルに対し実行する。これは当然成功するのでコードは割愛。

### Postモデルの作成（追加カラム）

ER図に基づいて「投稿者」「件名」「本文」「公開日」に相当するカラムを追加する。次のような変更になるだろう。

```diff
 Schema::create('posts', function (Blueprint $table) {
     $table->id();
     $table->timestampsTz();
     $table->foreignIdFor(User::class)->index()->constrained()>cascadeOnDelete();
+    $table->text('subject');
+    $table->text('content');
+    $table->dateTimeTz('published_at')->nullable();
 });
```

ここでテストが失敗するようになる。次のような点で、データベース定義の成約を満たさない。

* `NOT NULL` であるべきカラムに `NULL` を投入しようとしている。
  * `user_id` / `subject` / `content`
* 外部キーの参照先に必要な値が存在しない。
  * `posts.user_id REFERENCES users.id`

これらのエラーを解消しテストをパスさせてみよう。ファクトリに対し次のようなコード追加することになる。

```diff database/factories/PostFactory.php
 public function definition(): array
 {
   return [
+    'user_id' => User::factory(),
+    'subject' => fake()->sentence(),
+    'content' => fake()->paragraphs(3, true),
   ];
 }
```

ここで再び、テストは成功する。

`user_id` の値に実際の値ではなく `UserFactory` を指定していることに注目して欲しい。

{% link_preview https://laravel.com/docs/10.x/eloquent-factories#defining-relationships-within-factories rel:noopener %}
*リンク先情報の取得に失敗しました*
{% endlink_preview %}

ファクトリが実際の値ではなく別のファクトリを参照している場合、参照先のファクトリに基づき親のモデルも一緒に作成される。

つまりこのファクトリは `Post::factory()->create()` によるPostモデルだけでなく親となるUserモデルも同時に作成する。この動作は再帰的に行われるため、参照が連鎖している場合でも、1回の `Model::factory::create()`で、それが依存する全てのモデルを同時に作成できる。

複雑な参照関係を持つ一連のモデルをテストの度に作成できるのは非常に便利だが、この動作は当然、親となるモデルのファクトリが問題なく動作していることが前提となる。冒頭でまず `UserFactory` のテストを書いたのはこれが理由だ。

### 余談: ファクトリ実装とTDD

ここまでで示したコーディングのサイクルはTDDと似ている。次のような具合だ。

| サイクル | TDD | ファクトリ実装 |
| - | - | - |
| Red | 失敗するテストを書く | マイグレーションを修正（テストは失敗） | 
| Green | 成功するよう実装を修正 | 成功するようファクトリやモデルを修正 | 
| Refactor | コード品質の向上 | テーブルやモデルの改善（型やカラム順） |

本題の通り、このテストはメモリ内で高速に動作している。データベースを起動する必要すらない。マイグレーションのコードを間違えても、`migrate:rollback`を実行せずとも何度でもやり直せる。

大量のカラムやリレーションシップを必要とするマイグレーションやファクトリを、`migrate:rollback`コマンドを手で何度も実行しながら実装したことがあるかもしれない。この方法ならもうその必要はない。 **TDDに似た短いフィードバックループでデータベース設計を行える** わけだ。 phpunit-watcher などのテストランナーと併用するとなお良いだろう。

{% link_preview https://github.com/spatie/phpunit-watcher rel:noopener %}
*リンク先情報の取得に失敗しました*
{% endlink_preview %}

### Post BelongsTo User の実装

閑話休題。Postモデルは実装したがリレーションシップが無いため `$post->user` でユーザーを参照することが出来ない。同じようにTDDのサイクルでこれを実装しよう。

* *Red:* PostTestに次のテストを追加する。当然ながら失敗する。
  ```php tests/Feature/Models/PostTest.php
  public function testBelongsToUser(): void
  {
    $post = Post::factory()->create();
    $this->assertInstanceOf(User::class, $post->user);
  }
  ```

* *Green:* このテストをパスさせるPostモデルの実装は次のようになる。
  ```php app/Models/Post.php
  public function user(): BelongsTo
  {
    return $this->belongsTo(User::class);
  }
  ```

* *Refactor:* 追加分の実装のアノテーションなど。例えばide-helperでは次のようになる。
  ```diff app/Models/Post.php
   /**
    * App\Models\Post
    *
    * @property int $id
    * @property \Illuminate\Support\Carbon|null $created_at
    * @property \Illuminate\Support\Carbon|null $updated_at
  + * @property int $user_id
  + * @property string $subject
  + * @property string $content
  + * @property \Illuminate\Support\Carbon|null $published_at
  + * @property-read \App\Models\User $user
    * *省略*
    */
  ```

{% link_preview https://github.com/barryvdh/laravel-ide-helper rel:noopener %}
*リンク先情報の取得に失敗しました*
{% endlink_preview %}

### User HasMany Post の実装

* *Red:* UserTestへのテスト追加
  ```php tests/Feature/Models/UserTest.php
  public function testHasManyPosts(): void
  {
    $user = User::factory()->has(Post::factory())->create();
    $this->assertInstanceOf(Post::class, $user->posts->first());
  }
  ```

* *Green:* Userモデルへの実装追加
  ```php app/Models/User.php
  public function posts(): HasMany
  {
    return $this->hasMany(Post::class);
  }
  ```

* *Refactor:* ide-helper適用
  ```diff app/Models/User.php
   /**
    * App\Models\User
    *
    * @property int $id
    * @property string $name
    * *省略*
  + * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Post> $posts
    * *省略*
    */
   ```

### Post BelongsToMany Tag の実装

`belongsToMany()` やそのピボットモデルの実装も、ここまで見てきたやり方とほぼ一緒だ。記事では割愛する。サンプルコードでは全て実装してあるので参考にして欲しい。

## データベース初期化コードのリファクタリング

冒頭でテスト開始時に動的にデータベースを切り替えるコードを紹介した、ここまでの時点で、そのコードが4つのテストクラスにコピー＆ペーストされている。標準で提供されている `RefreshDatabase` などのように、テストクラス内で `use` するだけでそれが使えるようにしてみよう。

{% link_preview https://github.com/laravel/framework/pull/42394 rel:noopener %}
*リンク先情報の取得に失敗しました*
{% endlink_preview %}

```php
// trait名がたとえば FooBarBazだった場合、
trait InMemoryDatabaseForTesting
{
  // setUpFooBarBaz() というメソッドを定義する。
  public function setUpInMemoryDatabaseForTesting()
  {
    // そのメソッドはFeatureテストの配下ではuseするだけで呼び出される。
    $this->app['config']->set('database.default', 'sqlite');
    $this->app['config']->set('database.connections.sqlite.database', ':memory:');
    $this->artisan('migrate');
  }
}
```

これで集約化できた。今後は `use InMemoryDatabaseForTesting` と書くだけで、本記事で紹介した方法でのテストが行われる。既に `RefreshDatabase` などで多くのテストを書いていた場合、試しに置き換えて動作を見てみると良いかもしれない。

## この方法をどこまで適用するか？

ここまで紹介した範囲であればIn Memory Databaseと実際のデータベースとの挙動の差異は全く気にしなくて良い。`belongsTo()` などリレーションシップの定義だけであれば、データベース毎の挙動の違いは発生しない。

では、これより後の工程で必要となるUseCaseやControllerのテストでこの手法は使えるだろうか？

おそらくそれは難しい。E2Eに近い大きなユースケースでは、データベースの違いによる動作の差異が問題となり始める。しかし、この記事で述べている **速く小さく手軽に** 実装するテストも捨てがたい。ここから先の何らかのロジックを、これまでの小さな方法で実装できないだろうか？

この回答に相当するアイディアを、以前 [PHPerKaigi2023の登壇](https://youtu.be/QHjRGPw34EI?si=MWb-1v1i1S5MG0eE) で話させて頂いたことがある。該当箇所を引用する。

{% link_preview https://speakerdeck.com/kentaroutakeda/laravelhenoyi-chang-naai-qing-matahasi-haru-he-nisitexin-pei-surunowozhi-meteeloquentwoai-suruyouninatutaka?slide=57 rel:noopener %}
*リンク先情報の取得に失敗しました*
{% endlink_preview %}

> ### Eloquentの機能で宣言的に実装するメリット
> * 再利用可能性
>   * **責務の小さなローカルスコープ** をチェーンし大きなユースケースを満たす

この観点で責務を分割しモデルに閉じ込めれば、それらだけを小さくテストすることは出来そうだ。

この考え方は、テストピラミッドの維持にも繋がる。「バッチ処理の中で使われる複雑怪奇なクエリビルダ実装」をIn Memory Databaseでテストするのはおそらく難しい。小さく分割されたローカルスコープであればそれは容易い。

実例として今回は、作成したモデルに次のような機能を追加してみる。

*  「公開済みの記事」を取得するクエリ（ローカルスコープ）
* 「アクティブユーザー」を取得するクエリ（ローカルスコープ）


####  「公開済みの記事」を取得するクエリ（ローカルスコープ）

* *Red:* テスト
  ```php tests/Feature/Models/PostTest.php
  #[Test]
  public function 公開済の記事_公開日時が現時刻より後の場合は未公開()
  {
    $this->travelTo(now());
    Post::factory(['published_at' => now()->addMinutes(1)])->create();

    $post = Post::query()->whereIsPublished()->first();

    $this->assertNull($post);
  }

  #[Test]
  public function 公開済の記事_公開日時が現時刻より前の場合は公開済()
  {
    $this->travelTo(now());
    Post::factory(['published_at' => now()])->create();

    $post = Post::query()->whereIsPublished()->first();

    $this->assertNotNull($post);
  }
  ```

* *Green:* 実装
  ```php app/Models/Post.php
  public function scopeWhereIsPublished(Builder $query): void
  {
    $query->where('published_at', '<=', now());
  }
  ```

* Refactor: ide-helper
  ```diff app/Models/Post.php
   /**
    * App\Models\Post
    *
    * *省略*
  + * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Post whereIsPublished()
    * *省略*
    */
  ```

#### 「アクティブユーザー」を取得するクエリ（ローカルスコープ）

* *Red:* *テストは割愛*

* *Green:* 実装
  ```php app/Models/Post.php
  public function scopeWhereIsActive(Builder $query): void
  {
    $query->whereHas(
      'posts',
      fn (Builder|Post $q) => $q
        ->whereIsPublished()
        ->where('updated_at', '>=', now()->subDays(7))
    );
  }
  ```

* Refactor: ide-helper
  ```diff app/Models/Post.php
   /**
    * App\Models\User
    *
    * *省略*
  + * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\User whereIsActive()
    * *省略*
    */
  ```

先に実装した `Post::query()->whereIsPublished()` を後で実装する `User::query()->whereIsActive()` で再利用している点に注目してほしい。同じことは当然、UseCaseやControllerでも行える。

このような小さな実装のチェーンにより、それぞれのローカルスコープでのクエリは `where()` かせいぜい `whereHas()` で事足りるようになるだろう。これなら In Memory Database で全く問題ない。アクセサやキャスタで同じアプローチを採ることもできる。

{% link_preview https://laravel.com/docs/10.x/eloquent-mutators rel:noopener %}
*リンク先情報の取得に失敗しました*
{% endlink_preview %}

Eloquentモデルへのテストの時点で境界やカバレッジの網羅が十分に行われていれば、UseCaseやControllerのテストでは大きく正常系を確認する程度のテストでも信頼性はカバーできる。これが理想的なテストピラミッドだ。

最後に。この方法に頼り切っては当然いけない。やろうと思えばUseCaseやControllerも全てIn Memory Databaseでカバーできるが、DB固有の挙動に精通した上でないと「本番固有の不具合」を出しかねない。マイグレーションでどうしても必要となってしまったDB固有DDLの迂回ハックに苦しむことにもなるかもしれない。

責務に応じた適切なテスト方法の選択が重要だ。これを行えば自然と設計もクリーンになる。その上で、最高のポータビリティと動作速度を誇るSQLiteを活用して欲しい。
