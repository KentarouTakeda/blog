---
title: 使い倒し系Laravelコーディング規約
subtitle: 小中規模案件を爆速で回す
description: 小中規模案件向けLaravelコーディング規約。Eloquent、マイグレーション、ルーティング、認可、テストなどLaravelを使い倒すための実践的なルール集。
date: 2022-07-17 17:00
edit: 2022-07-31 12:00
tags:
  - PHP
  - Laravel
---

**「このLaravelとあのLaravel、全く別物じゃないか。」** 

Laravelは自由度が高い。Eloquentなどハイレベルな機能も提供されているが低レイヤーのAPIも存在し実装クラスの配置にも制限はほぼ無い。これら自由度のおかげで他フレームワーク経験者もスムーズにLaravelに入門できる一方、現場でしばしば聞かれるのが冒頭に挙げた声だ。

自由度は重要だが状況（プロジェクトの規模や背景）をある程度固定した上でのルール導入もまた有用と考え、今回は **小中規模の案件** を対象に **Laravelを使い倒す** という観点で規約を作成した。

* *小中規模のみ想定。設計のレイヤー化が生産性を大きく左右するような規模は想定しない。*  
  （この想定を超えるプロジェクトはそもそもLaravelを採用すべきでない）

* *フレームワークへのロックイン防止も考慮しない。*  
  （小中規模であれば、ここにコストを払うより必要に応じ使い捨てた方が早い）

以上のような ~少々偏った~ 状況であれば **Laravelを使い倒す** 考え方が生産性を大いに向上させる。その方法論の規約化が本文章だ。

**Laravelを使い倒す** というコンセプトのためPHPや他のフレームワークに存在しない特有の設計や概念が多く登場する。それらの詳しい解説は割愛するが、最低限のコードや関連文書へのリンクは用意した。Laravelをより深く知るためのコンテンツとしても活用されることを期待している。改善の提案も [歓迎](https://github.com/KentarouTakeda/blog/blob/master/source/_posts/2022-07-17-laravel-coding-guideline.md) しています。

## プロジェクト開始方法・環境設定

* **非推奨** [公式ドキュメントに記載](https://laravel.com/docs/9.x#your-first-laravel-project)された  `composer create-project` による開始は非推奨
* **推奨** [laravel/laravel](https://github.com/laravel/laravel) やそのforkの `git clone` による開始を推奨
* **任意** プロジェクトの「雛形」となるカスタマイズ版 laravel/laravel を必要に応じて管理

{% details サンプル: プロジェクト開始方法 %}

* **非推奨** `composer create-project` による開始
  ``` sh 
  $ composer create-project laravel/laravel .
  ```
* **推奨** `git clone` による開始
  ``` sh
  $ git clone https://github.com/laravel/laravel.git .
  $ composer install
  ```
* **推奨** laravel/laravel のforkよりアプリケーションの開発を開始
  ``` sh laravel/laravel を予め fork-of/laravel へforkした例
  $ git clone https://github.com/fork-of/laravel.git .
  $ git remote add laravel https://github.com/laravel/laravel.git
  $ composer install
  ```

{% enddetails %}

{% details 目的・ねらい %}

1. `composer create-project` によるアプリケーション作成には次の課題がある
   * アプリケーションの初期状態は [Packagistへの登録内容](https://packagist.org/packages/laravel/laravel) に準ずる。
   * Packagistへの登録内容は随時更新されている。
   * 以上より *いつ作成されたアプリケーションなのかによって初期状態が異なる* ということが起こる。
   * laravel/laravel はマイナーバージョンアップに有用な仕様変更が含まれることもある。
   * `composer create-project` を行った後はこれらを自動的に取り込むことができない。
2. これら課題に対し、アプリケーションを laravel/laravel のforkから開始することで次のようなメリットが生まれる。
   * 例えば `git merge laravel/vX.Y.Z` で開始後も取り込める。結果アプリケーションを最新に保てる。
   * 提供される機能は `composer create-project` と同等なので取り込む必要がない場合は特に何もしなくて良い。
   * マージ時のconflictの発生有無により（実際にマージを行わないとしても）Laravelメジャーバージョンアップ時の非互換を予見できる可能性がある。
3. forkをカスタマイズしそれを雛形とすることで次のようなことが可能となる。
   * コードの補間や整形、静的解析、各種ツール、それらの設定、これらが全て済んだ状態よりプロジェクトを開始出来るようになる。
   * カスタマイズによるプロジェクトの迅速な立ち上げは、序文 *必要に応じ使い捨て* に対し特に有効に作用。
   * このカスタマイズに対し laravel/laravel をマージすることで雛形を最新に保つ。

{% enddetails %}

* **非推奨** Git管理外ファイルである *.env* での環境設定は行わない
* **推奨** Git管理下かつデプロイに影響を与えない方法で環境設定
  * **禁止** ただし *config/* 配下を（環境設定のみを目的に）変更してはいけない

{% details サンプル: 環境変数の設定 %}

* **非推奨** .env より設定
  ```ini .env
  APP_DEBUG=true
  APP_KEY=base64:u1x6gW5zQkAMXHIL/TAf/EprM60zNSg9I7g9eG2Cmjw=
  APP_ENV=local
  ```
* **推奨** docker-compose.yml より設定
  ```yaml docker-compose.yml
  services:
    php:
      environment:
        - APP_DEBUG=${APP_DEBUG:-true}
        # アプリケーションキーは32バイトの文字列であれば何でも良い
        - APP_KEY=${APP_KEY:-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX}
        - APP_ENV=local
  ```

{% enddetails %}

## Eloquent・クエリビルダ

* **推奨** データベースアクセスは原則 [Eloquent](https://laravel.com/docs/9.x/eloquent) で実装
  * **必須** HTTPリクエストに対しレスポンスを返却する程度の処理はEloquentのみで実装
    * クエリは [Eloquentビルダ](https://laravel.com/docs/9.x/eloquent#building-queries) で生成
  * **任意** 大量データ処理などEloquentでは深刻なパフォーマンス問題が発生する場合は [クエリビルダ](https://laravel.com/docs/9.x/queries) を使って良い

{% details 目的・狙い %}

Eloquentのデメリットとして一般的に次のようなものが挙げられる。

* N+1問題の発生
* パフォーマンスの劣化
* メモリ利用量の増大

しかし *HTTPリクエストに対しレスポンスを返却する程度の処理* に限っては次の通り問題にはなりにくい。

* *N+1問題の発生*
  * クエリビルダであっても実装によっては発生する。
  * 解決方法が `join()` か `with()`  かの違いのみ。
  * `join()` よりも `with()` の方がコードは簡潔。
* *パフォーマンスの劣化*
  * Eloquentとクエリビルダとではパフォーマンスに5〜8倍の差があるが *HTTPリクエストに対しレスポンスを返却する程度の処理* （fetch行数が大きくない場合）では体感できる差は発生しない。
* *メモリ利用量の増大*
  * 前項と同じく小さな誤差。
  * Eloquentが追加で利用するメモリは [アクセサのキャッシュ](https://laravel.com/docs/9.x/eloquent-mutators#accessor-caching) などパフォーマンスに寄与する面もある

一方Eloquentには次のようなメリットがある。

* Eloquent自体の機能
  * [リレーション](https://laravel.com/docs/9.x/eloquent-relationships) / [アクセサ / ミューテタ / キャスト](https://laravel.com/docs/9.x/eloquent-mutators)
  * [イベント](https://laravel.com/docs/9.x/eloquent#events)
  * [クエリスコープ](https://laravel.com/docs/9.x/eloquent#query-scopes)
  * [モデルファクトリ](https://laravel.com/docs/9.x/database-testing#defining-model-factories)
  * [モデルの整理（Prunable）](https://laravel.com/docs/9.x/eloquent#pruning-models)
* Eloquent外から利用できる機能
  * [モデル結合ルート](https://laravel.com/docs/9.x/routing#route-model-binding)
  * [ポリシー](https://laravel.com/docs/9.x/authorization#creating-policies)
  * [model:show コマンド](https://github.com/laravel/framework/pull/43156) 等によるメタデータの生成<!-- TODO マニュアルに掲載次第URLを変更-->
* 外部ツール
  * モデルへの `@property` アノテーションの付与によるコード補完
  * 同じく静的解析

{% enddetails %}

{% details サンプル: レコードの取得 %}

* **禁止** テーブルを参照しクエリビルダでレコードを特定
  ```php
  $user = DB::table('users')->where('id', 1)->first();
  // $user-> /* コード補完が効かない */
  ```
* **必須** モデルを参照しEloquentでモデルを特定
  ```php
  $user = User::find(1);
  // $user-> /* 後述例のアノテーションによりコード補完が効く */
  ```

{% enddetails %}

{% details サンプル: レコードの検索 %}

* **禁止** テーブルを参照しクエリビルダからレコードを取得
  ```php
  DB::table('users')->where('name', 'taylorotwell')->first();
  ```
* **必須** モデルを参照しEloquentビルダからモデルを取得
  ```php
  User::query()->where('name', 'taylorotwell')->first();
  ```

{% enddetails %}

{% details サンプル: リレーションの取得 %}

* サンプル中のリレーション構造
  ```php
  class User extends Model
  {
    // Userは複数のPostを持つ
    public function posts()
    {
      $this->hasMany(Post::class);
    }
  }

  class Post extends Model
  {
    // PostはUserに所属する
    public function user()
    {
      $this->belongsTo(User::class);
    }
  }
  ```
* **非推奨** Eloquentリレーションを利用せず実装側でリレーションを管理
  ```php
  $user = User::find($user_id);
  $posts = Post::query()->where('user_id', $user_id)->get();
  ```
* **非推奨** クエリビルダと `join()` を使った取得
  ```php
  $postsWithUser = DB::table('users')
    ->where('user_id', $user_id)
    ->join('posts', 'users.id', '=', 'user_id')
    ->get();
  ```
* **推奨** Eloquentリレーションから取得
  ```php
  $posts = User::find(1)->posts;
  ```
* *基本的にはEloquentリレーション推奨だが性能は `join()` が有利。データ量（目安として1万件超）に応じて適切な使い分けが必要*

{% enddetails %}

{% details サンプル: N+1問題への対処 %}

* 前項のリレーションを前提に *複数のPostに対するUserへのN+1問題を* 考える
* **禁止** N+1問題の発生例
  ```php
  $posts = Post::all();
  foreach($posts as $post) {
    // **N+1問題** $postsの件数だけクエリされる
    $post->user->name;
  }
  ```
* **非推奨** クエリビルダと `join()` を使った取得
  ```php
  $postsWithUser = DB::table('posts')
    ->join('user', 'users.id', '=', 'user_id')
    ->get();
  ```
* **推奨** [Eagerロード](https://laravel.com/docs/9.x/eloquent-relationships#eager-loading) による取得
  ```php
  $posts = Post::query()->with('user')->get();
  ```
* *前項と同様適切な使い分けが必要*

{% enddetails %}

* **必須** Eloquentモデルに `@property` アノテーションでカラム情報を付与
  * **必須** マイグレーションをcommitする際はそれに対応するアノテーションの修正を含める
* **推奨** アノテーションは [Laravel IDE Helper Generator](https://github.com/barryvdh/laravel-ide-helper) 等で自動化

{% details サンプル: アノテーションとその自動化 %}

* アノテーションの例
  ```php
  /**
   * @property int $id
   * @property string $name
   * ...
   * @property \Illuminate\Support\Carbon|null $created_at
   * @property \Illuminate\Support\Carbon|null $updated_at
   */
  class User extends Authenticatable
  {
    /* ... */
  }
  ```
* Laravel IDE Helper Generatorによるアノテーション付与の自動化
  ```sh
  # Laravel IDE Helper Generatorのインストール
  $ composer require --dev barryvdh/laravel-ide-helper
  # 設定ファイルをGit管理
  $ php artisan vendor:publish --provider="Barryvdh\LaravelIdeHelper\IdeHelperServiceProvider" --tag=config
  ```
  ```php config/ide-helper.php
  <?php
  return [
    /* ... */
    'post_migrate' => [
        'ide-helper:models --write', // デフォルト設定を変更
    ],
  ]
  ```

{% enddetails %}

* **必須** リレーションは利用の有無を問わず参照と被参照の両方を定義
* **推奨** リレーションは `@comment` でアノテーション

{% details 目的・ねらい %}

* たとえ利用が無かったとしても Documentation as Code として設計を明示する。
* Laravel IDE Helper Generator はリレーションメソッドの `@comment` アノテーションよりモデルへのアノテーションを生成する

{% enddetails %}

{% details サンプル: リレーション定義とアノテーション %}

* 両方向からの定義と `@comment` によるアノテーション
  ```php
  // laravel-ide-helperによる自動生成 / 「全投稿」「投稿主」は `@comment` より自動生成
  /**
   * @property-read Collection|\App\Models\Post[] $posts 全投稿
   * @property-read \App\Models\User $posts 投稿主
   */
  class User extends Model
  {
    /**
     * @comment 全投稿
     */
    public function posts()
    {
      $this->hasMany(Post::class);
    }
  }

  // laravel-ide-helperによる自動生成 / 「投稿主」は `@comment` より生成される
  /**
   * @property-read \App\Models\User $user 投稿主
   */
  class Post extends Model
  {
    /**
     * @comment 投稿主
     */
    public function user()
    {
      $this->belongsTo(User::class);
    }
  }
  ```

{% enddetails %}

## マイグレーション・テーブル構成

* **推奨** 開発初期など **共有環境が存在しない段階** ではマイグレーション運用を簡略化。
  * **必須** `down()`は存在自体が誤解の元となるためメソッド削除。
  * **禁止** 既存テーブルに修正を加えるためのマイグレーションを実装しない。
  * **必須** 既存テーブルに修正を加える際は元となるマイグレーション自体を修正。
  * **任意** 以上と同等の運用を実現する例えば[Laravel-Dacapo](https://github.com/ucan-lab/laravel-dacapo)などのツールを導入しても良い
* **必須** 以上はあくまで開発初期の運用であり **共有環境が用意された時点** でLaravel標準の運用へ切り替える
  * **任意** 切り替えた後も `down()` の実装は任意。 `down()` の実装に注意を払うよりそれ自体が決して必要とならないマイグレーション運用やブランチ運用に務めるべき。

{% details サンプル: マイグレーションファイルの内容 %}

* **禁止** `down()` は実装しない（例示はコメントアウトだが実際には削除）
  ```php database/migrations/2014_10_12_000000_create_users_table.php
  return new class() extends Migration {
    public function up()
    {
      Schema::create('users', function (Blueprint $table) {
        $table->id();
        /* ... */
        $table->timestamps();
      });
    }

    /*
    public function down()
    {
      Schema::dropIfExists('users');
    }
    */
  };
  ```
* **禁止** 既存テーブルに対する修正マイグレーション
  ```php database/migrations/2022_07_10_000000_add_votes_to_users.php
  Schema::table('users', function (Blueprint $table) {
    $table->integer('votes'); // 既存テーブルを変更する新規マイグレーション
  });
  ```
* **必須** 既存テーブルに修正を加える際は元のマイグレーションを修正
  ```php database/migrations/2014_10_12_000000_create_users_table.php
  Schema::create('users', function (Blueprint $table) {
    $table->id();
    /* ... */
    $table->timestamps();
    $table->integer('votes'); // 新規作成せず既存のマイグレーションを修正
  });
  ```

{% enddetails %}

*前項の規約を採用した場合、特に複数人での開発時のデータベース運用に制約が発生する。それらを解決するための規約を以下に示す。*

* **必須** マイグレーションの適用は常に `migrate:fresh --seed` を想定
  * **禁止** マイグレーション管理外リソースを作成してはならない
  * **推奨** 主要な機能全てにアクセス可能な十分な初期データをシーダとして実装

{% details 目的・ねらい %}

* *マイグレーションの適用は常に `migrate:fresh --seed` を想定する*
  * 適用済マイグレーションに対する修正は `migrate` では反映されない
  * `down()` が実装されないため `migrate:refresh` は使えない
* *マイグレーション管理外リソースを作成してはならない*
  * 作成しても `migrate:fresh` により削除される
* *主要な機能全てにアクセス可能な十分な初期データをシーダとして実装*
  * 日常的にデータが初期化されたとしても速やかに各機能へアクセスする手段として

{% enddetails %}

* **推奨** カラムへのコメント付与
  * **任意** `id` / `created_at` など意味が自明なカラムは任意
  * **必須** 意味の把握にプロジェクト固有の知識が必要なカラムは必須

{% details サンプル: マイグレーションからのコメント付与 %}

* コメント付与の例（付与の有無サンプル）
  ```php database/migrations/2014_10_12_000000_create_users_table.php
  Schema::create('users', function (Blueprint $table) {
    $table->id(); // フレームワークの標準機能の範囲内の利用（任意）
    $table->text('email')->unique(); // 名前より意味が容易に推測可能（任意）
    $table->timestamp('last_login_at')->nullable()
      ->comment('最終リクエスト日時'); // 意味は自明だが仕様の理解が必要（必須）
    $table->timestamps(); // フレームワークの標準機能の範囲内の利用（任意）
    $table->softDeletes()
      ->comment("「アカウント無効化」を論理削除で実装"); // フレームワーク標準だが用途が固有（必須）
  }
  ```

{% enddetails %}

* リレーションと外部キー制約
  * **推奨** リレーションに関連する命名（テーブル名・カラム名）はEloquentの規約に準ずる
    * **任意** 規約が要件やドメインと合致しない場合は準拠しなくても良い
  * **必須** リレーションの参照テーブルには外部キー制約を付与
  * **必須** リレーションの参照列にはにはインデックスを作成
* Eloquentの規約に準拠した場合のカラム定義
  * **必須** 規約準拠を明確に示すためそれ用のメソッドを使う
  * **必須** 参照はテーブルではなくモデルに対して行う

{% details サンプル: リレーションの定義 %}

* **禁止** テーブルやカラムを直接参照しており規約準拠も明示されていない
  ```php
  $table->foreign('user_id')->references('id')->on('users')->index();
  ```
* **禁止** 規約準拠は明示されているがインデックスが作成されてない
  ```php
  $table->foreignIdFor(User::class)->constrained();
  ```
* **必須** 規約準拠を明示しインデックスを作成
  ```php
  $table->foreignIdFor(\App\Models\User::class)->index()->constrained();
  ```

{% enddetails %}

## シーディング・モデルファクトリ

* **必須** ダミー値や乱数の生成はLaravelが提供するfakerインスタンスを使う
* **必須** `db:seed` 開始直後にfakerインスタンスのseedを固定値で初期化

{% details 目的・ねらい %}

乱数元とそのシード値を固定することでダミーデータに再現性を持たせる。

シーダやファクトリが修正されない限りいつシーディングを実行しても生成されるデータは同一となり、次のような問題が回避できる。

* 複数人で開発している際の各環境でのデータの差異
* ダミーデータのランダム性が原因となるフレイキーテスト

{% enddetails %}

{% details サンプル %}

* **禁止** faker以外の方法でダミーデータを生成
  ``` php database/factories/UserFactory.php
    public function definition()
    {
        return [
            'uuid' => uuid_create(UUID_TYPE_RANDOM),
            'name' => substr(str_shuffle("ABCDEFGHJKLMNPQRSTUVWXYZ"), 0, 5),
            'token' => sha1(uniqid()),
            'rank' => mt_rand(1, 10),
        ];
    }
    ```
* **必須** ダミーデータはfakerで生成
  ``` php database/factories/UserFactory.php
    public function definition()
    {
        return [
            'uuid' => fake()->uuid(),
            'name' => fake()->name(),
            'token' => sha1(fake()->lexify('?????????????')),
            'rank' => fake()->numberBetween(1, 10),
        ];
    }
    ```
* **必須** シーディング開始時にfakerのシード値を固定
    ```php database/seeders/DatabaseSeeder.php
    public function run(): void
    {
      fake()->seed(42);
      /* ... */
    }
    ```

{% enddetails %}

* **禁止** 外部キー制約の参照列の値をモデルファクトリで直接設定しない

{% details サンプル %}

* **禁止** ファクトリの中でリレーションを確立（動作が他のモデルの存在に依存）
  ```php database/factories/PostFactory.php
  public function definition()
  {
      return [
          'user_id' => fake()->randomElement(User::pluck('id')), // NG
          'category_id' => 1, // NG
      ];
  }
  ```
* **必須** 既存のモデルは参照せず参照先モデルの同時作成をデフォルト動作とする
  ```php database/factories/PostFactory.php
  public function definition()
  {
      return [
          'user_id' => User::factory(), // OK
          'category_id' => Category::factory(), // OK
      ];
  }
  ```
  ```php database/seeders/PostSeeder.php
  public function run()
  {
    // 投稿と所属先のユーザーやカテゴリを同時に作成
    $post = Post::factory()->create();

    // 既に存在するユーザーやカテゴリに所属する投稿を作成
    $user = User::query()->latest('id');
    $category = Category::query()->latest('id');
    $post = Post::factory()
      ->for($user)
      ->for($category)
      ->create();
  }
  ```

{% enddetails %}

## サービスコンテナ・ファサード

* [ファサード](https://laravel.com/docs/9.x/facades)の利用可否は次の通り
  * **任意** コントローラー、[コマンド](https://laravel.com/docs/9.x/artisan#command-structure)、[Bladeコンポーネント](https://laravel.com/docs/9.x/blade#passing-data-to-components)での利用は任意。
  * **必須** 利用する場合 `Illuminate\Support\Facades\` 配下の完全修飾クラス名を利用。
  * **禁止** Eloquentモデル及びその依存先からの利用は禁止。
  * **禁止** Bladeテンプレートでの利用は禁止。次の手段で代替。
    * [ヘルパ関数](https://laravel.com/docs/9.x/helpers#miscellaneous)
    * [Bladeディレクティブ](https://laravel.com/docs/9.x/blade#blade-directives)
  * **禁止** [リアルタイムファサード](https://laravel.com/docs/9.x/facades#real-time-facades) の利用は禁止。
* サービスコンテナの利用可否は以下の通り
* **禁止** `app()` 等によるサービスコンテナの直接利用は禁止。
  * コンストラクタインジェクションやメソッドインジェクションを使う。
* **推奨** ファサードとサービスコンテナとで同じ機能が実現できる場合どちらを利用するか統一。

{% details サンプル: Bladeテンプレート内での認証 %}

* **禁止** ファサードによる認証
  ```php
  @if (Auth::check())
    ログインしています。
  @endunless
  ```
* **必須** Bladeディレクティブでの認証
  ```php
  @auth
    ログインしています。
  @endauth
  ```

{% enddetails %}

{% details サンプル: ファサードは完全修飾クラス名を利用 %}
* **禁止** エイリアスを経由した利用
  ```php
  $user = \Auth::user();
  ```
* **必須** 完全修飾クラス名の利用
  ```php
  use Illuminate\Support\Facades\Auth;

  $user = Auth::user();
  ```
{% enddetails %}

{% details サンプル: ファサードとコンストラクタインジェクション %}

* **非推奨** 同等の機能が異なる方法で混在して使われている
  ```php
  // 全く同じ機能が提供される契約とファサード
  use Illuminate\Contracts\Filesystem\Filesystem;
  use Illuminate\Support\Facades\Storage;

  class StorageService
  {
    public function __construct(
      private readonly Filesystem $storage,
    ) {
      parent::__construct();
    }

    public function size(string $path)
    {
      // サービスコンテナから注入されたインスタンスを利用
      return = $this->storage->size($destination);
    }

    public function put(string $path, string $content)
    {
      // ファサードを利用
      Storage::put($path, $content);
    }
  }
  ```
{% enddetails %}

## ルーティング

* **必須** 次の場合を除き[名前付きルート](https://laravel.com/docs/9.x/routing#named-routes)必須
  * 同じURIが複数のリクエストメソッドを受け付ける（代表となる1つのみ必須）
  * アプリケーションから直接参照されないURI（APIやコールバックURLなど）
  * [フォールバックルート](https://laravel.com/docs/9.x/routing#fallback-routes)
  * [リダイレクトルート](https://laravel.com/docs/9.x/routing#redirect-routes)
* **禁止** 次の場合を除きクロージャによるアクション実装は禁止
  * フォールバックルート
* **必須** アプリケーション内でのURLの生成するはルート名を使う

{% details サンプル %}

* ルート名・クロージャ・URL生成
  ```php routes/web.php
  Route::controller(CommentController::class)->group(function () {
    // 必須: GETを代表とみなし底に対して命名
    Route::get('/comments/{comment}', 'show')->name('comments.show');
    // 任意: 同一URIでメソッドが異なるのみなので任意
    Route::put('/comments/{comment}', 'update');
  });

  // 任意: JavaScriptからの参照（アプリケーション内から参照されない）
  Route::get('/api/ping', PingController::class);
  // 任意: サービス外からの参照（アプリケーション内から参照されない）
  Route::get('/twitter/callback', TwitterCallback::class);
  // 任意: リダイレクトルート
  Route::redirect('/legacy-url.php', '/correct-url', 301);

  // 任意: フォールバックルートは命名任意、クロージャ可
  Route::fallback(fn () => abort(404)); 
  ```
* **必須** ルート名よりURLを生成
  ```php resources/views/welcome.blade.php
  <a href="{{ route('comments.show', ['comment' => $comment]) }}">
    コメント表示
  </a>
  ```
* **禁止** URLを直接記述
  ```php resources/views/welcome.blade.php
  <a href="/comments/{{ $comment->id }}">
    コメント表示
  </a>
  ```

{% enddetails %}

* **必須** パラメータの文字列バリデーションは正規表現制約またはそのヘルパで実装
* **必須** パラメータからモデルを特定する場合モデル結合ルートで実装
  * **必須** モデル結合ルートのパラメータ名はモデル名のローワーキャメルケース
  * **推奨** 結合は[明示的に宣言](https://laravel.com/docs/9.x/routing#explicit-binding)
* **必須** URL上の数値を受け取る場合アクション側ではintでタイプヒント

{% details サンプル %}

* パラメータ名・バリデーション
  ```php routes/web.php
  Route::get('/posts/{post}', PostController::class) // パラメータ名はモデル名
    ->whereNumber('post') // 書式チェックはルーティングの段階で行う
    ->name('posts.show');
  ```
* モデル結合ルート
  ```php app/Http/Controllers/User/PostController.php
  // ($foo) や (int $foo) ではなく (Model $foo) として受け取る
  public function __invoke(Post $post)
  {
    /* ... */
  }
  ```
* 結合の明示的な宣言
  ```php app/Providers/RouteServiceProvider.php
  public function boot()
  {
      Route::model('user', User::class);
  }
  ```
* 数値の受け取り
  ```php routes/web.php
  Route::get('/list/pages/{page}', ListController::class)
    ->whereNumber('page') // 書式（数値）の確認はルータが行い
    ->name('list');
  ```
  ```php app/Http/Controllers/ListController.php
  // アクションではintで受け取る
  public function __invoke(int $page)
  {
    /* ... */
  }
  ```

{% enddetails %}

## HTTPリクエスト

*本稿は [HTTPリクエスト](https://laravel.com/docs/9.x/requests) に関する規約。フォームリクエストは別途定める。*

* *禁止* `$request->foo` による値の取得は禁止
* *非推奨* `$request->input('foo')` / `$request->all()` などメソッドとを区別しない手段は非推奨
  * ペイロードは `$request->post('foo')` 、クエリパラメータは `$request->query('foo')` と言ったように取得元に応じて適切に使い分ける。

{% details サンプル %}

* **禁止・非推奨** 動的プロパティによる取得 / GET,POSTを区別しない取得
  ```php
  // ページング機能つきの投稿一覧画面 / 投稿に対するコメントも同じURLでPOSTで受け取る
  public function list(Request $request) {
    $page = $request->page; // ページング番号
    $post_id = $request->input('post_id'); // コメントする投稿
    $comment = $request->input('comment'); // コメント
  }
  ```
* **推奨** GET, POSTを区別し取得
  ```php
  public function list(Request $request) {
    $page = $request->query('page'); // ページング番号はURLパラメータで渡される
    $post_id = $request->post('post_id'); // コメント情報はPOSTパラメータで渡される
    $comment = $request->post('comment'); // コメント情報はPOSTパラメータで渡される
  }
  ```

{% enddetails %}

## 認可

* **必須** モデルに対する認可処理は次の通り実装
  * **必須** [ポリシー](https://laravel.com/docs/9.x/authorization#generating-policies) を [自動検出](https://laravel.com/docs/9.x/authorization#policy-auto-discovery) が可能なクラスとして実装
  * **必須** アクションでは [コントローラーヘルパ](https://laravel.com/docs/9.x/authorization#via-controller-helpers) 又は同等のシグネチャを持つメソッドで認可を実装

{% details サンプル %}

* **禁止** 認可処理をアクションへ直接実装
  ```php app/Http/Controllers/User/PostController.php
  use App\Http\Controllers\Controller;

  class PostController extends Controller
  {
    public function edit(Post $post) 
    {
      abort_unless($post->user_id === Auth::id(), 403);
      /* ... */
    }
  }
  ```
* **必須** 認可処理はポリシーを実装しアクションからはそれを利用
  ```php app/Models/Policies/PostPolicy.php
  public function edit(User $user, Post $post): bool
  {
    return $post->user_id === $user->id;
  }
  ```
  ```php app/Http/Controllers/User/PostController.php
  use App\Http\Controllers\Controller;

  class PostController extends Controller
  {
    public function edit(Post $post) 
    {
      $this->authorize('edit', $post);
      /* ... */
    }
  }
  ```

{% enddetails %}

## バリデーション・フォームリクエスト

* **必須** 次に該当するバリデーションは[フォームリクエスト](https://laravel.com/docs/9.x/validation#form-request-validation)で実装
  * 入力値の書式やファイルアップロード結果、その組わせのみで完結する処理
  * モデル結合ルートの解決結果やそのリレーションを使った処理
  * 認証結果やそのリレーションを使った処理
  * 更新対象テーブル単独で完結する処理（テーブル内の値の重複チェックなど）
* **禁止** 前項以外の処理をフォームリクエストで行ってはならない
* **必須** フォームリクエストへのアノテーション
  * バリデーション対象パラメータは `@property-read` でアノテーション
    * FormRequest内で値を加工する場合、加工後の型を定義
    * モデル結合ルートへのリクエストを前提としている場合、結合されるモデル
    * 認証を伴うリクエストは認証結果として期待されるモデル

{% details サンプル %}

* バリデーションの実装
  ```php app/Http/Requests/PostRequest.php
  use Illuminate\Support\Facades\Gate;

  /**
   * @property-read string $content 本文
   * @property-read null|array<null|string> $tags タグ
   * @property-read App\Models\Post|null $post
   * @method App\Models\User user()
   */
  class PostRequest extends FormRequest
  {
    public function authorize(): bool
    {
      // 更新: PUT /posts/{post}
      // モデル結合ルート（明示的な結合）より `$this->post` の型が保証される
      if($this->post) {
        return Gate::authorize('update', $post);
      }

      // 作成: `POST /posts`
      // 新規作成を同じFormRequestで処理する場合 `$this->post` はnullable
      return Gate::authorize('create', $post);
    }

    public function rules(Request $request): array
    {
      return [
        // このルールにより $this->tags が配列であることが保証される
        'tags.*' => [
          'nullable',
        ],
        // このルールにより $this->content の存在が保証される
        'content' => [
          'required',
        ],
      ];
    }
  }

  public function withValidator($validator)
  {
    $validator->after(function ($validator) {
      // Illuminate\Http\Request::user() は本来mixedが返却されるが、
      // クラス冒頭の `@method` により認証済モデルの型は絞り込みが行われている。
      // その絞り込み結果に基づくコード補完や静的解析が可能
      if ($this->user()->is_suspended) {
        $validator->errors()->add('content', '投稿は制限されています。');
      }
    });
  }
  ```
* バリデーション済リクエストのアクションからの利用
  ```php app/Http/Controllers/PostController.php
  public function update(PostRequest $request, Post $post)
  {
    // バリデーションにより存在が保証されやアノテーション済の動的プロパティを利用
    $post->content = $request->content;
    $post->save();
    /* ... */
  }
  ```

{% enddetails %}

## JsonAPI（APIリソース）

* **必須** JsonAPI形式のレスポンスは [APIリソース](https://laravel.com/docs/9.x/eloquent-resources) で生成。
* **必須** 実装は `App\Http\Resources` 配下としクラス名には元となるモデル名とサフィックス `Resource` を含める。
* **必須** 公式ドキュメント記載 `$this->foo` ではなく `$this->resource->foo` の形で実装。
* **必須** APIリソースの生成元となる型を `@property-read` でアノテーション。
* **必須** 日付や日時は次の何れかの形式。
  * ISO 8601: `now()->toIso8601String()`
  * UnixTime: `now()->getTimestamp()`
  * UnixTimeMS: `now()->getTimestampMs()`
* **禁止** `parent::toArray()` 等による返却の生成は禁止

{% details 目的・ねらい %}

* *JsonAPI形式のレスポンスはAPIリソースで生成。*
* *実装は `App\Http\Resources` 配下としクラス名には元となるモデル名とサフィックス `Resource` を含める。*
  * 実装を特定のディレクトリを集約し名称に規則性を設けることでAPI仕様を一元管理。
* *公式ドキュメント記載 `$this->foo` ではなく `$this->resource->foo` の形で実装。*
  * `$this->foo` はLaravel側で `$this->resource->foo` へ[委任](https://github.com/laravel/framework/blob/v9.19.0/src/Illuminate/Http/Resources/DelegatesToResource.php#L131-L140)されている。
* *APIリソースの生成元となる型を `@property-read` でアノテーション。*
  * 前項と併せ `$this->resource` へ型付けによりコード補完や静的解析を利用。
* *日付や日時は次の何れかの形式。*
  * JavaScriptを含むあらゆる処理系で確実にパース可能。
* *`parent::toArray()` 等による返却の生成は禁止*
  * [Eloquent側でJSONを生成](https://laravel.com/docs/9.x/eloquent-serialization) することによりAPIの仕様と実装とが異なる場所で管理されるのを避ける。
  * テーブル定義が変更された際APIの仕様が意図せず変わってしまうことを防ぐ。特に `$hidden` の指定漏れによる機密データの漏洩を確実に防ぐ。

{% enddetails %}

{% details サンプル %}

* APIリソース実装例
  ```php app/Http/Resources/PostResource.php
  /**
   * @property-read Post $resource
   */
  class PostResource extends JsonResource
  {
    public function toArray($request): array
    {
      return [
        'id' => $this->resource->id,
        'title' => $this->resource->name,
        'created_at' => $this->resource->created_at->toIso8601String(),
        'updated_at' => $this->resource->created_at->toIso8601String(),
      ];
    }
  }
  ```
* アクションからの返却
  ```php app/Http/Controllers/User/PostController.php
  public function show(Post $post) 
  {
      return new PostResource($post);
  }
  ```

{% enddetails %}

## ログ

* **禁止** [ログ出力先の制御](https://laravel.com/docs/9.x/logging#writing-to-specific-channels)はアプリケーションからは行わない
  * アプリケーションからは[ログの出力](https://laravel.com/docs/9.x/logging#writing-log-messages)のみを行う
* **必須** ログ出力先の制御は環境変数から行えるようにする。
  * *config/logging.php* では `default` チャンネルの設定は変更せず環境変数 `LOG_CHANNEL` で制御
* **任意** 本番環境でのアラートなど高度なフィルタ要件が存在する場合 `stack` チャンネルの設定を変更しても良い
  * **推奨** ただし可能な限りインフラ側（CloudWatch Logs等）による[ログイベントのフィルタ](https://docs.aws.amazon.com/ja_jp/AmazonCloudWatch/latest/logs/MonitoringLogData.html) などを使うことが望ましい。

{% details 目的・ねらい %}

*次のような要件やインフラ変更に容易に対応。*

* アプリケーションの冗長化やコンテナ化を行うケース  
  例えばコンテナ化の場合 `LOG_CHANNEL` を `stderr` に変更するのみでログは永続化される。
* 同一アプリケーションを異なるログ要件で稼働させるケース  
  タスクスケジューラやキューワーカーを別個で稼働させる等。
* エラー発生時のアラート設定  
  特に外部サービスへの通知などはローカル環境での開発に制限が生じるためこれら要件はアプリケーションは関知すべきでない。

{% enddetails %}

## Bladeテンプレート

* **必須** *resources/views/* 配下のディレクトリ構成
  |ディレクトリ名|用途|説明|
  |-|-|-|
  |`components/`|Bladeコンポーネント|[標準構成](https://laravel.com/docs/9.x/blade#components)|
  |`components/layouts/`|レイアウト（[コンポーネント](https://laravel.com/docs/9.x/blade#layouts-using-components)を利用する場合）|*本規約独自*|
  |`layouts/`|レイアウト（[テンプレート継承](https://laravel.com/docs/9.x/blade#layouts-using-template-inheritance)を利用する場合）|*本規約独自*|
  |`errors/`|エラー（主にHTTPエラー）時の出力画面|[標準構成](https://laravel.com/docs/9.x/errors#custom-http-error-pages)|
  |`emails/`|メール本文を生成するためのテンプレート|[ドキュメント](https://laravel.com/docs/9.x/mail#configuring-the-view)|
  |`pages/`|ページレンダリングの起点となるテンプレート|*本規約独自*|

## メール送信

* **必須** メール送信は [Laravelのメール機能](https://laravel.com/docs/9.x/mail) のみで実装
* **必須** `ShouldQueue` を実装し [デフォルトでキューを利用](https://laravel.com/docs/9.x/mail#queueing-by-default)

{% details 目的・ねらい %}

* *メール送信はLaravelのメール機能のみで実装*
  * 全てのメール送信を環境変数のみで制御可能な状態とする。
  * 以上より、特にローカル環境で `array` / `log` ドライバや [MailHog](https://github.com/mailhog/MailHog) / [MailCatcher](https://mailcatcher.me/) 等のツールを活用しインシデントを防止。
* *`ShouldQueue` を実装しデフォルトでキューを利用*
  * Mailableに対するテストは実装側でのキューの利用有無に応じて使うべきアサーション `assertSent()` / `assertQueued()` が変わる。
  * `ShouldQueue` を実装してもその動作を環境変数で抑制することは可能。逆は不可能。
  * 以上より `ShouldQueue` / `assertQueued()` で予め統一することでキューの利用有無を変更する度にテストを修正する必要がなくなる。
  * 実際の利用有無は実装でなく環境変数 `QUEUE_CONNECTION` で制御。
  * [デフォルト設定](https://github.com/laravel/laravel/blob/v9.2.1/config/queue.php#L16) は `sync` なので何も設定しない場合キューは使われない

{% enddetails %}

{% details サンプル: メール送信のキュー制御 %}

* **必須** キューの有無に関わらず `ShouldQueue` は常に実装
  ```php app/Mail/WelcomeMail.php
  // use Illuminate\Bus\Queueable;
  use Illuminate\Contracts\Queue\ShouldQueue;

  class WelcomeMail extends Mailable
    implements ShouldQueue // 必ず指定
  {
    // アプリケーションからはキュー制御は行わないのであれば不要
    /* use Queueable; */ 

    /* ... */
  }
  ```
* **必須** アサーションは `assertQueued()` に統一
  ```php tests/Feature/Http/Controllers/UserControllerTest.php
  /**
   * @test
   */
  public function testAssertMailSent()
  {
    Mail::fake();

    /* ... */

    // アサーションは `assertQueued()` に統一
    Mail::assertQueued(WelcomeMail::class);
  }
  ```

{% enddetails %}

## ファイルストレージ

* **推奨** 単一のアプリケーションは単一の[ファイルストレージ](https://laravel.com/docs/9.x/filesystem)のみ利用

*以上の規約に準拠する場合ファイルストレージは次の通り設計。*

* **必須** アプリケーションからは `default` のみ参照
* **必須** `default` の設定は変更せず `FILESYSTEM_DISK` 環境変数で利用先を制御。
* **必須** デフォルト設定に存在しないドライバを利用する場合を除き *config/filesystems.php* に予め用意されたドライバを使う。
* **必須** ローカル環境では `public` ではなく `local` を使う
* **推奨** `storage:link` が生成する `public/storage` を `public/public` に変更

{% details 目的・ねらい %}

* *アプリケーションからは `default` のみ参照*
* *`default` の設定は変更せず `FILESYSTEM_DISK` 環境変数で利用先を制御*
* *デフォルト設定に存在しないドライバを利用する場合を除き config/filesystems.php に予め用意されたドライバを使う。*
  * プロジェクト固有設定や標準外ストレージの存在によるメンテコスト増大を防止
  * 異なる環境（例：ローカル＆本番）であっても環境変数の変更のみで対応
* *`public` ディスクは使わず `local` ディスクを使う*
  * `local` からは `public` 相当領域を参照できる。逆はできない。
  * パーミッション（publicアクセスの可否）はインフラ側で制御。
* *`storage:link` が生成する `public/storage` を `public/public` に変更*
  * *`local` ディスクの`public/` 配下に設置したファイルはWebサーバ上の `/storage/` に公開* がデフォルトの動作だが、本変更でパスとURLとが一致することで次のような構成が可能となる
    * ローカル環境 - `FILESYSTEM_DISK=local`  
      `disk://public/` 設置したファイル は `storage/app/public/` へ配置されWebサーバからはシンボリックリンクを経由し **`/public/` を起点に閲覧可能**
    * 本番環境 - `FILESYSTEM_DISK=s3`  
      `disk://public/` 配下に設置したファイルは例えば `s3://AWS_BUCKET/public/` へ配置されそれをオリジンとする CloudFront Behavior により **`/public/` を起点に閲覧可能**
    * **ローカル環境と全く同じパス構成をCDNやロードバランサへ設定可能とする**

{% enddetails %}

{% details 参考コード・参考コマンド %}

* ストレージ設定 `storage:link` 時のリンク作成先を変更する例
  ```php config/filesystems.php
  return [
    /* ... */
    'links' => [
      // public_path('storage') => storage_path('app/public'),
      public_path('public') => storage_path('app/public'),
    ],
  ]
  ```
* `storage:link` は変更せず本規約自体をcommitする例
  ```sh
  # 本規約の変更に対応するリンクを作成
  $ ln -s ../storage/app/public public/public
  # 作成したリンクをcommit
  $ git add public/public
  $ git commit
  ```

{% enddetails %}

## タスクスケジューラー

* **推奨** cronではなく[タスクスケジューラ](https://laravel.com/docs/9.x/scheduling)を使う
* **推奨** 要件を満たせる限り、スケジュール定義には `onOneServer()` / `withoutOverlapping()` 双方を指定

{% details 目的・ねらい %}

* **推奨** *cronではなくタスクスケジューラを使う*
  * バッチ処理のスケジューリングはアプリケーションの実装や設計と密結合することが多い。
  * バッチ処理の追加や修正（Git管理内）を行った際は前提となるcron等の設定（Git管理外）を別途でデプロイしなければならない、という状況を避ける
* **推奨** *要件を満たせる限り、スケジュール定義には `onOneServer()` / `withoutOverlapping()` 双方を指定する*
  * タスクスケジューラを冗長化する状況を想定（バッチ処理の排他制御）
  * 排他制御の必要のないタスク、並列化すべきタスク、これらへの指定は当然不要

{% enddetails %}

{% details サンプル: 並列化を考慮したタスクスケジュール %}

* `onOneServer()` / `withoutOverlapping()` を利用する例としない例
  ```php app/Console/Kernel.php
  protected function schedule(Schedule $schedule)
  {
    // 1時間に1回: 一時ファイルをクリーンアップ / **全サーバで実行**
    $schedule->cron('0 * * * *')->exec('tmpwatch 240 /path/to/tmp')
      ->withoutOverlapping(); // `onOneServer()` **不要**

    // 1日1回: 投稿数の集計 / 並列化の有無を問わず **1回だけ** 実行
    $schedule->cron('0 0 * * *')->command(CountPostsCommand::class)
      ->withoutOverlapping()->onOneServer(); // `onOneServer()` **必要**

    // 毎分（常時）: ヘルスチェック成功を監視サーバへ通知 / 全サーバで常時実行
    $schedule->cron('* * * * *')->command(HealthCheckCommand::class)
      ->pingOnSuccess($healthCheckUrl)
      ; // `onOneServer()` / `withoutOverlapping()` **双方不要**
  }
  ```

{% enddetails %}

## フロントエンド

* **推奨** デプロイの際にフロントエンドのビルドが必要な場合、リソースは *resources/* 配下（又は更に下）に配置。

{% details 目的・ねらい %}

依存を局所化することが目的だが特にアプリケーションをコンテナ化する際のビルド時間の短縮に寄与する。フロントエンドのビルドに必要なアセットを専用ディレクトリ配下に閉じることでDockerレイヤーキャッシュのヒット率向上を見込む。つまりフロントエンドとは関係のないファイルしか更新されていない場合にも再ビルドが行われてしまうのを防止する。

{% enddetails %}

## テスト

* **必須** `vendor/laravel` に依存するテストは `Feature` に配置
  * **必須** `Tests\TestCase` を又はそのサブクラスを継承
  * **禁止** `Tests\TestCase` の実装を修正しない
* **必須** `vendor/laravel` に依存しないテストを `Unit` に配置
  * **禁止** `Tests\TestCase` や `Illuminate\Foundation\Testing\TestCase` を継承してはならない
* **必須** `Tests\Feature\` `Test\Unit\` と `App\` 配下とで名前空間の階層名を揃える
* **必須** テスト対象となるクラス名にサフィックス `Test` を付与したものがテストクラス名。
  * `$this->get()` / `$this->post()` 等の疑似リクエストはコントローラーを対象としたテストと見做す

{% details サンプル: テスト対象とテストの配置・テスト作成コマンド %}

* **必須** テストクラスの配置例
  ```text
  app
  └─ Services
    ├─ FizzBuzzService.php # FizzBuzz計算を行うクラス
    └─ StorageService.php # ストレージアクセスを行うクラス
  tests
  ├─ Feature
  │└─ Services # app配下の階層とあわせる
  │  └─ StorageServiceTest.php # Laravelの機能を利用するためFeature
  └─ Unit
      └─ Services # app配下の階層とあわせる
        └─ FizzBuzzServiceTest.php # Laravelの機能を利用しないのでUnit
  ```
* 参考 `make:test` によるテスト作成
  ```sh
  # `Tests\TestCase` の継承と適切なディレクトリ配置が行われる
  $ ./artisan make:test Services/StorageServiceTest
  # `--unit` でUnit配下へ作成され継承元クラスも変更される
  $ ./artisan make:test Services/FizzBuzzServiceTest --unit
  ```

{% enddetails %}

## 参考記事・関連記事

* [【Laravel】 Cron タスクスケジューラの onOneServer() と withoutOverlapping() の違い - Qiita](https://qiita.com/mpyw/items/15d14d920250a3b9eb5a) by [@mpyw](https://twitter.com/mpyw)
* [5年間 Laravel を使って辿り着いた，全然頑張らない「なんちゃってクリーンアーキテクチャ」という落としどころ](https://zenn.dev/mpyw/articles/ce7d09eb6d8117) by [@mpyw](https://twitter.com/mpyw)
* [Docker Buildにおけるリードタイム短縮のための3つの改善ポイント | PLAID engineer blog](https://tech.plaid.co.jp/improve_docker_build_efficiency)
* [Docker friendly PHP / Laravel Laravel.shibuya #11 Online](https://www.slideshare.net/KentarouTakeda/docker-friendlyphp-laravel) by 筆者
* [EC-CUBEのバージョンアップを見据えたカスタマイズ方法2020年度版 - Qiita](https://qiita.com/nanasess/items/7ad3592073458adae09d) by [@nanasess](https://twitter.com/nanasess)
* [Eloquent or Query Builder: When to Use Which? - YouTube](https://www.youtube.com/watch?v=uVsY_OXRq5o) by [@PovilasKorop](https://twitter.com/PovilasKorop)
* [Laravel × Dacapo で始める快適マイグレーション生活！ - Qiita](https://qiita.com/ucan-lab/items/8d23dc08fc5f964a3e72) by [@ucan_lab](https://twitter.com/ucan_lab)
* [Laravel × Docker AlpineでER図を自動生成する - Qiita](https://qiita.com/Canon11/items/02e1ec6b46a3c1011a5c) by [@canon1ky](https://twitter.com/canon1ky)
* [Laravel の request() や Request::__get() は地雷， Request::input() と Request::route() を使え](https://qiita.com/mpyw/items/d26f0ffac1529399a35f) by [@mpyw](https://twitter.com/mpyw)
* [Query BuilderとEloquentどっちがどれくらいなぜ速いのか証明しようず！ - Qiita](https://qiita.com/taisei_otsuka/items/f4890b23b06eaa338c41)
* [フレーキーテストにまつわるあれこれ - Qiita](https://qiita.com/seigot/items/bec2c934b762a2f50821)
* [目的に沿ったDocumentation as Codeをいかにして実現していくか / PHPerKaigi 2021 - Speaker Deck](https://speakerdeck.com/k1low/phperkaigi-2021) by [@k1LoW](https://twitter.com/k1LoW)

{% details 更新履歴 %}

* 2022年7月31日
  * 「Eloquent・クエリビルダ」リレーション実装目的を変更 [#19](https://github.com/KentarouTakeda/blog/pull/19)
  * Eloquent利用に関する補足やサンプルコードを充実化 [#20](https://github.com/KentarouTakeda/blog/pull/20)

{% enddetails %}
