---
title: Laravelで理解するREST設計の基本
subtitle: Eloquentとartisanが導く「正しい構造」
description: LaravelのREST設計を最小構成で実装。Eloquentのリレーション、artisanの自動生成、APIリソースによる責務分離までを一気通貫で体験できるチュートリアル。設計崩壊を防ぐための基本がここにある。
date: 2025-10-29 19:00
ogimage: ogimage.webp
twitter_large_card: true
tags:
  - PHP
  - Laravel
  - Eloquent
---

## はじめに

Laravelは非常に多機能で、自由に書けるがゆえに破綻しやすい。特に中〜大規模化すると、“Laravelの思想に沿わない独自設計”が技術的負債となるケースが少なくない。

本記事では、Laravelが意図した設計の流れを最短経路でたどりながら、その裏にある考え方を明らかにしていく。題材として「Todo管理アプリのバックエンドAPI」を素早く作る流れを示す。目的は細かな実装手順を全て網羅することではなく、"API一式を素早く用意する方法" の考え方と主要なポイントを理解することにある。

### TechTrain「メンターライブコーディング」

本記事に沿って実装を進める様子を、TechTrain主催イベント「【メンターライブコーディング】Laravelスペシャリスト直伝！１時間で学ぶLaravelの魅力」でライブコーディングとして公開するする予定だ。

{% link_preview https://techtrain.connpass.com/event/368970/ %}
{% endlink_preview %}

記事自体はライブコーディングを観なくとも単独で成立するようになっているが、Laravelの豊富な機能を活用し素早く開発する「リズム感」は文字だけでは伝わりにくい。お時間の合う方は是非ともオンラインイベントにも参加して欲しい。

### 取り上げる範囲と期待値

- 注目すべき点:
  - Laravelの機能群がどのように協調してAPIを構成するか？
  - どこまで自動生成に頼り、どこから開発者が実装するか？
- 深掘りが不要な点:
  - 個々の実装の詳細な解説。

実際のコマンド例やコードは載せるが、まずは開発ワークフローや設計観点にフォーカスしてほしい。補足が必要な箇所は公式ドキュメントや解説記事へのリンクを用意した。

### ソースコード

本記事に対応する動作可能なソースコードを公開した。コミットの順序は以降の説明とほぼ一致している。記事と対でご覧頂きたい。

{% link_preview https://github.com/KentarouTakeda/laravel-api-resource-tutorial %}
{% endlink_preview %}

## PHP実行環境の構築

### 推奨: Dockerを使わずローカルのみで動作する環境

このチュートリアルを試す場合、Dockerによる仮想環境や実サーバは使わず、ローカル環境から直接実行可能なPHPを用意することを推奨する。データベースもPostgreSQLやMySQLなどの重厚な製品は使わず、ローカル環境の単一ファイルのみで完結するSQLiteを使う。

後述の3つのコマンドだけでLaravelアプリは動く。環境構築不要、それは壊してもすぐ作り直せることを意味する。プログラミングの学習は試行錯誤がつきものだが、重厚な「環境構築手順」が必要な環境はおいそれと壊せない。壊せない環境は試行錯誤が難しい、つまり学習には不向きなのだ。

壊してもすぐ作り直せる—それが学習効率を格段に高める。

### 必要コマンド

* 必須: `php`
* 必須: `composer`
* 推奨: `sqlite3`

### WSL2(Ubuntu)の場合

```
apt-get install \
  composer \
  php \
  php-curl \
  php-sqlite3 \
  php-xml \
  sqlite3
```

### macOS(Homebrew)の場合

```
brew install \
  composer \
  php \
  sqlite3
```

### 構築結果の確認

`composer` と `sqlite3` が動作すれば問題ない。例えば次のような出力になる:

```bash
$ composer -V
Composer version 2.8.8 2025-04-04 16:56:46
PHP version 8.4.11 (/usr/bin/php8.4)
Run the "diagnose" command to get more detailed diagnostics output.

$ sqlite3 -version
3.46.1 2024-08-13 09:16:08 c9c2ab54ba1f5f46360f1b4f35d849cd3f080e6fc2b6c60e91b16c63f69aalt1 (64-bit)
```

### 推奨エディタ

Laravelアプリの開発にはVisual Studio CodeまたはPHPStormとそれに対応したLaravel用拡張機能の導入を強く推奨する。

Laravelはクラスやメソッドの仕組みを独自に拡張しているため、通常のPHP用エディタでは補完が十分に効かない箇所がある。それらを専用の拡張機能が補ってくれる。

#### Visual Studio Codeを使う場合

- 拡張機能: [PHP Intelephense](https://marketplace.visualstudio.com/items?itemName=bmewburn.vscode-intelephense-client)
  - 一般的なPHPコードの補完
- 拡張機能: [Official Laravel VS Code Extension](https://marketplace.visualstudio.com/items?itemName=laravel.vscode-laravel)
  - Laravel固有コードの補完

#### PHPStormを使う場合

- 拡張機能: [Laravel Idea](https://laravel-idea.com/)
  - Laravel固有コードの補完

## Laravelアプリのセットアップ

### Laravelアプリの新規作成

```bash
$ composer create-project laravel/laravel laravel-api-resource-tutorial
$ cd laravel-api-resource-tutorial
```

公式ドキュメントでは `laravel new` コマンドが紹介されている。どちらを使っても構わない。Laravel Installerも内部では `composer create-project` を実行しているだけだ。デフォルト以外のスターターキットを使いたい場合[このリンク](https://github.com/orgs/laravel/repositories?q=starter-kit)から配布元のリポジトリ名を調べられる。

### PHPUnit Watcherの導入（任意）

```bash
$ composer require --dev spatie/phpunit-watcher
```

TDDスタイルでの開発に非常に有効なツール。既に紹介したSQLiteの軽快な動作とLaravelの提供するHTTPテスト機能を組み合わせることで、本来はE2Eテストで担保するようなテストケースもTDDで高速に回せる。

動作を簡単に紹介する:

1. ファイル名を指定しテストファイルを監視
   ```
   vendor/bin/phpunit-watcher watch tests/Feature/ExampleTest.php
   ```
   * 初回のテストが実行され成功する
   * コマンドは終了せず待機状態になる
2. エンターキーを押す
   * 同じテストが再度実行される
3. テストファイルを編集し保存
   ```diff tests/Feature/ExampleTest.php
    public function test_the_application_returns_a_successful_response(): void
    {
        $response = $this->get('/');

   -    $response->assertStatus(200);
   +    $this->fail();
    }
   ```
   * ファイルの更新を検知し自動的にテストが実行される
   * 上のコードの通りテストは失敗する

*参考: [GitHub spatie/phpunit-watcher](https://github.com/spatie/phpunit-watcher)*

## Laravelアプリの初期状態を観察する—覚えておきたいartisanコマンド一覧

Laravelを深く理解するためには、“コードを書く前にフレームワークを観察する”ことが重要だ。ここでは`artisan`コマンドに注目する。Laravelはどのような機能をどのコマンドで提供しているか、最初に簡単に確認しよう。

### ルート一覧

```
php artisan route:list
```

Laravelアプリに設定されているルート（URL）が一覧表示される。セットアップ直後であれば3つのルートが存在するはずだ。

開発とともにルートは増えていく。筆者は、既存のLaravelアプリを引き継いだ場合、必ずこのコマンドを最初に実行している。ルート一覧は機能一覧とほぼイコールなので、この一覧を見れば、そのアプリケーションが何をしているのか、概ね把握できる。

### マイグレーションの確認

```
php artisan migrate:status
```

データベース変更の適用履歴が一覧表示される。セットアップ直後では3つのマイグレーションが存在し、何れも `Ran` というステータスで適用完了しているはずだ。

アプリケーションの全体像を把握するにはデータベースの確認も欠かせない。整ったプロジェクトでは、マイグレーション名は `create_FOOs_table` や `modify_BARs_table` と言ったようにある程度統一されているはずだ。一覧を見ることでそのアプリケーションがどのように「成長」してきたのか、時系列で俯瞰できる。

### モデルの確認

```
php artisan model:show User
```

ここではLaravel初期状態に確実に存在する `User` モデルの詳細を表示している。指定したEloquentモデルに対応するテーブル定義や開発者が実装されたリレーションシップなどから、Laravelが認識しているモデル構造が全て表示される。

### データベースの再構築

```
php artisan migrate:fresh --seed
```

データベースを初期化しマイグレーションを再適用、更にダミーデータの投入（シーディングの適用）までを一括で行う。つまり「データベースをまっさらに作り直す」コマンドだ。

記事の前半で「壊してもすぐ作り直せる環境」の重要性を述べた。本チュートリアルでは使わないが、実際のプロジェクトでは毎日のように使うコマンドになるかもしれない。

ただし、このコマンドが有効に動作するかは、そのプロジェクトのマイグレーションやシーディングの実装に依存する。上手く動かないプロジェクトもあるかもしれない。もしあなたがコードオーナーだった場合、後進や新規参画者のために、このコマンドが動く状況（マスターデータやダミーデータの投入が1コマンドで完結する状態）を維持することを推奨する。

### データベースへの接続

```
php artisan db
```

このコマンドだけでデータベースに接続できる。

利用データベースの種類に応じたコマンドの使い分けや接続情報などの指定は不要だ。`.env` や `config/database.php` に設定された情報より適切なコマンドをLaravelが自動的に実行してくれる。

このコマンドを実行すると、内部では、設定されたデータベースの種類に応じて `sqlite3`, `psql`, `mysql` 等のコマンドが内部で実行される。操作方法はデータベースに応じて異なる点、実行には対応するコマンドがインストールされている必要がある点に注意。

### REPLの起動

```
php artisan tinker
```

Laravelアプリのコードが全て読み込まれた状態で、PHPのインタラクティブコンソールが起動する。

このコマンドは、是非とも活用してほしい。フレームワークを使った開発では「ちょっとした実験」に苦労することが多い。REPLが無い状態でそれをやろうとすると、適当なコントローラー等に試したいコードを書き、ブラウザでそれを呼び出すなりそれに相当する一時的なテストコードを書くなり、煩雑でミスを誘発しそうな手順が必要になる。REPLがあればそれらは不要だ。

試しに、次に示すコマンドを順に実行する:

```php
# ダミーユーザーを1件作成
> $user = User::factory()->create();

# `users` テーブル全件取得: 上で作成したユーザーが含まれる
> DB::table('users')->get()

# 作成したユーザーを削除
> $user->delete();
```

ここまで、PHP環境の構築からLaravelアプリのセットアップ、Laravel標準機能の簡単な確認をした。次のセクションから実際のAPI開発に入る。最後に解説した `artisan` コマンドはこの後でも多用する。頭に入れておいてほしい。

## `make:model` コマンドによる雛形の一括作成

今回の題材はTodo管理アプリなので、まずは `Todo` モデルを作成する。この時、後で必要となるファイルも最初に作ってしまおう。1コマンドで作成できる。

```bash
$ php artisan make:model Todo --all --api
```

追加で指定した2つのオプションに注目する:

### `--all`: 付随して必要となるファイルを同時に作成

Eloquentモデルに付随して必要となる様々な処理の雛形も一緒に作成する。このオプションは非常に便利だ。作成するEloquentモデルの名前 `Todo` に併せ、それ以外のファイルも一括作成してくれる。後から個別に作成する場合ある程度の知識が必要だが、一括作成であればその心配はない。

### `--api`: API用に作成

今回はAPI開発なので画面は必要ない。通常は、新規作成画面や更新画面のフォームを表示するためのコードも雛形に含まれるが、このオプションの指定でそれらは自動生成から除外される。

### 生成されるファイル

次の8つのファイルが作成される:

| 役割 | パス |
| - | - |
| Eloquentモデル | `app/Models/Todo.php` |
| モデルファクトリ | `database/factories/TodoFactory.php` |
| マイグレーション | `database/migrations/xxxx_xx_xx_create_todos_table.php` |
| シーダー | `database/seeders/TodoSeeder.php` |
| リクエスト(保存) | `app/Http/Requests/StoreTodoRequest.php` |
| リクエスト(更新) | `app/Http/Requests/UpdateTodoRequest.php` |
| コントローラー | `app/Http/Controllers/TodoController.php` |
| ポリシー | `app/Policies/TodoPolicy.php` |

TodoSeeder のみ今回は使わないので削除しても構わない。それ以外のファイルの役割や実装方法はこの後で説明する。

## 要件定義と`Todo`モデルの実装、マイグレーション

### 要件定義とER図

まずはデータベースに関連する部分を実装するが、Eloquentモデルやマイグレーション（テーブル定義）は考えなしに実装開始してはいけない。⁠[データベースの寿命はアプリケーションよりも長い](https://gihyo.jp/book/2019/978-4-297-10408-5/content/preface)という金言の通り、最初のこの作業は慎重な設計が必要になる。本来はこれだけで1冊の本が書けるほどの重要な話題だが、今回は最も重要なポイントのみ示す。それは「他のモデルとの関係」だ。

それを考えるため、まずは要件を定義する。例えば次のように決めてみよう:

- このTodo管理アプリは複数のユーザーが使う
- **Todoにはそれを所有するユーザーが1件だけ存在する**
- **ユーザーは複数のTodoを持てる**

この要件、特に太字の部分をER図で表すと次のようになる:

```plantuml
User ||-r-o{ Todo
```

この関係をそのままEloquentモデルに反映する。

### Eloquentモデルの実装

* Todoモデルから見たUserモデルの関係
  ```php app/Models/Todo.php
  // 所属先のUser（1件）を`user`という名前で参照（単数形）
  public function user()
  {
      // belongsTo = 所属
      return $this->belongsTo(User::class);
  }
  ```
* Userモデルから見たTodoモデルの関係
  ```php app/Models/User.php
  // 所有するTodo（複数件）を`todos`という名前で参照（複数形）
  public function todos()
  {
      // hasMany = 複数件を所有
      return $this->hasMany(Todo::class);
  }
  ```

モデルの実装は一旦これだけで良い。お互いの関係を定義するだけでEloquentモデルのほぼ全ての機能が利用できる。

*参考: この解説では、要件定義とモデルの仕様検討のため「ER図」というツールを使った。今回は登場するモデルが2つだけだが、より多くのモデル、より複雑な要件の場合、この「ER図」が検討に役立つ。設計に興味のある方は、筆者の過去の記事も参考にして欲しい。*

{% link_preview https://no-hack-no.life/post/2022-08-01-want-ERD-to-become-more-popular/ %}
{% endlink_preview %}

### マイグレーションの実装

次に、今回新たに作成したTodoモデルに対応するテーブルをLaravelのマイグレーション機能で作成する。そのためのファイルも `make:model --all` で自動生成されている。

* TodoモデルがUserに所属する（`todos`テーブルは所属先となる`users`テーブルのIDを外部キーとして持つ）
  ```php database/migrations/YYYY_MM_DD_HHmmss_create_todos_table.php
  // Userモデルのidを外部キーとして持つ: カラム名は自動的に `user_id` となる
  $table->foreignIdFor(User::class)
      // 外部キーには必ずインデックスを付与
      ->index()
      // 外部キー制約を定義
      ->constrained()
      // 親が（所属元User）が削除されたら子（所有するTodo）を自動的に削除
      ->cascadeOnDelete();
  ```
* Todoの本文
  ```php database/migrations/YYYY_MM_DD_HHmmss_create_todos_table.php
  $table->string('title');
  ```
* Todoは完了済みか？
  ```php database/migrations/YYYY_MM_DD_HHmmss_create_todos_table.php
  $table->boolean('is_completed')
      // デフォルトで未完了状態（is_completed = false）で作成される
      ->default(false);
  ```

### モデルファクトリの実装

モデルと元となるテーブルを作成したら、必ずファクトリも実装しておこう。テストやREPLで重宝する。

ファクトリは言わば「テストデータの設計図」だ。今回のテーブルには `user_id`, `title`, `is_completed` の3つの独自カラムを追加したが、テストの際にどのような値を入れるべきか、私達は知っていてもLaravelは知らない。それをファクトリで指定する。

```php database/factories/TodoFactory.php
public function definition(): array
{
    return [
        'title' => fake()->sentence(),
        'user_id' => User::factory(),
    ];
}
```

* `title`: テストデータなので文字列なら何でも良いが、開発用のダミーデータに使う場合を想定し「それらしい文字列」を設定しておいたほうが便利だ。Todoリストの本文には短い文章を入れることが多いので、今回は `sentence()` とした。
* `user_id`: 他のモデルに紐づけるカラムは、紐づけ先のファクトリを指定する。モデルではなくファクトリで良い。紐づけ先のモデルを予め作る必要はなく、親となるUserモデルはLaravelが自動的に作成する。
* `is_completed`: 今回は指定しなかった。テーブル定義として `false` をデフォルト値を指定しているのでそれが採用される。または、ランダムで `true` / `false` を指定したい場合は `fake()->boolean()` と指定しても良い。

以上を設定することで、Todoのダミーデータは好きな時に幾つでも作成できるようになる。動作確認してみよう:

```bash
$ composer dump-autoload
$ php artisan tinker
```

```php
// Todoを作成
Todo::factory()->create();

// Todoを3件作成
Todo::factory()->count(3)->create();

// Todoを2件所有するユーザーを作成
User::factory()->has(Todo::factory()->count(2))->create();
```

ファクトリはとにかく機能が豊富だ。上の最後の例だけでも便利だが、他にも様々な方法で柔軟にダミーデータの作成を行える。

*参考: [Laravel日本語ドキュメント 12.x Eloquent:ファクトリ](https://readouble.com/laravel/12.x/ja/eloquent-factories.html)*

## ルートの作成とコントローラーの確認

APIの場合もMPAの場合も、対象となるEloquentモデルを操作するためのルート（URL）が必要になる。どのような機能であれ、ざっと「参照」「追加」「更新」「削除」辺りの複数のルートを作成することになるが、Laravelにはそれらをまとめて作成する機能がある:

```php routes/web.php
Route::apiResource('todos', TodoController::class)
    ->middleware('auth');
```

*注: APIと聞いて Sanctum や `route/api.php` を思い浮かべる方も多いと思うが、今回APIルートは使わない。説明の簡略化のためもあるが、単純なAPIサーバであれば Sanctum を使わなくて良い場合が多い。本記事の末尾で補足する。*

今回は `middleware('auth')` を指定し、ログイン状態のユーザーしかAPIにアクセスできないようにした。以上の定義を追加した後、ルート一覧を確認してみよう:

```bash
$ php artisan route:list --path=todos

  GET|HEAD  todos ......... todos.index  › TodoController@index
  POST      todos ......... todos.store  › TodoController@store
  GET|HEAD  todos/{todo} .. todos.show   › TodoController@show
  PUT|PATCH todos/{todo} .. todos.update › TodoController@update
  DELETE    todos/{todo} .. todos.destroy› TodoController@destroy
```

たった1行の追加で5つのルート定義が追加された。ポイントは次の2点:

* 最初の引数に「操作対象のEloquentモデルの小文字複数形」を指定
* 2つめの引数にそれらを取り扱うコントローラーを指定

更に便利なことがある。この `TodoController` は先程の `make:model --all` コマンドによる自動生成だが、予め用意されたメソッド定義を見てみよう:

```bash
$ grep -A 3 function app/Http/Controllers/TodoController.php
    public function index()
    {
        //
    }
--
    public function store(StoreTodoRequest $request)
    {
        //
    }
--
    public function show(Todo $todo)
    {
        //
    }
--
    public function update(UpdateTodoRequest $request, Todo $todo)
    {
        //
    }
--
    public function destroy(Todo $todo)
    {
        //
    }
```

`apiResource()` が要求するメソッドが予め全て定義されている。この後の開発は、上の雛形のブランク部分を埋めるだけで良い。Eloquentモデルを作成する際 `--all` で必要ファイルをまとめて作成するやり方のメリットだ。

次のセクションで、その具体的なやり方を説明するが、実はこの先は「決まり切ったコードを書くだけ」で済んでしまう。その簡単さも含め読み進めてほしい。

*補足: CRUDに必要なルートの一括登録は、Laravelの機能として「リソースコントローラー」と呼ばれる。実務では `resource()` や `apiResource()` で済まない変則的なルートが必要になることも多いが、典型的なパターンには一通り対応している。必要に応じてドキュメントを参照*

*参考: [Laravel日本語ドキュメント 12.x リソースコントローラ](https://readouble.com/laravel/12.x/ja/controllers.html#resource-controllers)*

### コントローラーとAPIリソース（スキーマ定義）の実装

ここからは、上の雛形にある5つのメソッドを実装していく。簡単な順に進めていこう。

#### 1件表示 `show` の実装とルートモデル結合

まずは `show()` を実装するが、その前に、対応するルート定義とメソッドのパラメータに注目する:

```txt ルート定義
GET|HEAD  todos/{todo} .. todos.show   › TodoController@show
```

```php メソッド定義
public function show(Todo $todo)
```

それぞれのパラメータの名前と型に注目。具体的には次の点が重要だ:

- ルート定義とメソッドそれぞれ、パラメータ名が `{todo}`, `$todo` と一致している
- パラメータ `$todo` はの型はEloquentモデル（`Todo`モデル）である

これらの条件を満たしたルートでは、Laravelの「ルートモデル結合」という機能が有効になる。具体的には次のように動作する:

1. `todos/N`のようなURLにアクセスされた場合
2. Laravelは `N` を `Todo` モデルの主キーと解釈しそれを探す: `Todo::findOrFail(N)`
3. 見つかったEloquentモデルがメソッドに渡される: `$todo` は `id=N` の `Todo`インスタンス
   * 見つからなかった場合は404エラーを返す

この機能を使えば、コントローラーの中でモデルを探す必要はない。

*参考: [Laravel日本語ドキュメント 12.x ルートモデル結合](https://readouble.com/laravel/12.x/ja/routing.html#route-model-binding)*

#### TDDによる `show` の実装

冒頭でPHPUnit Watcherを導入した。これを使って、以降の実装はTDDスタイルで進めてみよう。まずはテストクラスを作成する:

```
php artisan make:test Http/Controllers/TodoControllerTest
```

作成したテストをwatchモードで実行する:

```
vendor/bin/phpunit-watcher watch tests/Feature/Http/Controllers/TodoControllerTest.php
```

ログイン済ユーザー向けのAPIなのでテストもログイン状態で行う:

```php tests/Feature/Http/Controllers/TodoControllerTest.php
// テスト用データベースを毎回リセット
use RefreshDatabase;

// テスト用ユーザー
private User $user;

public function setUp(): void
{
    parent::setUp();

    // テスト用ユーザーを作成し
    $this->user = User::factory()->create();

    // 以降のテストはログイン状態で実行
    $this->actingAs($this->user);
}
```

表示対象のTodoを作成しHTTPリクエストしレスポンスをアサーション:

```php tests/Feature/Http/Controllers/TodoControllerTest.php
public function test_show(): void
{
    Todo::factory()
        ->for($this->user)
        ->create(['id' => 42, 'title' => 'foo']);

    $this->json('GET', 'todos/42')
        ->assertStatus(200)
        ->assertJsonMissingPath('data.created_at')
        ->assertJsonPath('data.id', 42)
        ->assertJsonPath('data.title', 'foo');
}
```

今回はテストを先に書いている（実装はまだ書いていない）のでテストは失敗する。前述のPHPUnit Watcherによりテストファイルを保存すればその場でREDを確認できる。

そして実装だが、実は1行だけで完了する:

```php app/Http/Controllers/TodoController.php
public function show(Todo $todo)
{
    // ルートモデル結合により入力された $todo をそのまま返す
    return ['data' => $todo];
}
```

自動生成コードの編集やテストなどの周辺の準備を経ていれば、機能自体の実装は1行から数行で済んでしまう。これがLaravelの真髄だ。

#### APIリソースの実装

ここまでで書いた「1件取得」APIは、後で性能やセキュリティの問題を生じさせる可能性がある。それをこのセクションで解消する。

```php app/Http/Controllers/TodoController.php
return ['data' => $todo]
```

Eloquentモデルをそのままレスポンスしているが、今後 `Todo` モデルの元となる `todos` テーブルに機密情報を格納するカラムが追加されたらどうなるだろう？それらも一緒にレスポンスしてしまうことになる。セキュリティインシデントへと発展するかもしれない。

解決の方法は幾つか用意されているが、APIサーバを構築する場合、Laravelの「APIリソース」機能を使うことを推奨する。次のコマンドで雛形を生成できる:

```bash
$ php artisan make:resource TodoResource
```

| 役割 | パス |
| - | - |
| APIリソース | `app/Http/Resources/TodoResource.php` |

現在は 1件取得: `show` だけ実装されているが、Todoは他の様々なAPIでレスポンスに使う。Eloquentモデル`Todo`をAPIレスポンスに適した形に変形するのが`TodoResource`の役割だ。

`$this->resource` に `Todo` モデルが格納されるので、それをレスポンスに適した形に変形する処理を実装し:

```php app/Http/Resources/TodoResource.php
public function toArray(Request $request): array
{
    return [
        'id' => $this->resource->id,
        'title' => $this->resource->title,
        'is_completed' => (bool)$this->resource->is_completed,
    ];
}
```

コントローラーからはそれを返すようにする:

```php app/Http/Controllers/TodoController.php
public function show(Request $request, Todo $todo)
{
    return new TodoResource($todo);
}
```

レスポンスは例えば次のようになる:

```json
{
  "data": {
    "id": 42,
    "title": "foo",
    "is_completed": false
  }
}
```

現時点では「変換処理を他のクラスに分離した」に過ぎないが、これが将来のカラム追加の際の情報漏洩を防ぐ「防波堤」になる。加えて、この頻出の変換処理を分離することはコードの簡潔さに大きく貢献する。更に、APIリソースにはAPIレスポンスの管理や加工に特化した様々な機能が備わっている。

*参考: [Laravel日本語ドキュメント 12.x Eloquent：APIリソース](https://readouble.com/laravel/12.x/ja/eloquent-resources.html)*

とりあえず「EloquentモデルはAPIリソースを経由して返す」と覚えておくと良い。

#### 削除 `destroy` の実装

次に削除機能。ここから先の説明はテストを割愛するが、冒頭のチュートリアルリポジトリではテストも実装されている。

実装は、セクションの冒頭で説明したルートモデル結合と直前で実装したAPIリソースを使えば2行で終わる:

```php app/Http/Controllers/TodoController.php
public function destroy(Request $request, Todo $todo)
{
    $todo->delete();

    return new TodoResource($todo);
}
```

1. `$todo` はLaravelから提供されるので、
2. `delete()` でそれを削除し、
3. 削除したTodoをAPIリソースとして返す。

たったこれだけだ。

#### 一覧 `index` の実装

今回は「ログイン中ユーザーのTodoのみ返す」という仕様とし、他人のTodoは見えないようにする。

ある程度データベースに慣れた人は、次のような実装を思い浮かべるかもしれない:

```php app/Http/Controllers/TodoController.php
public function index()
{
    $todos = Todo::where('user_id', Auth::id())->get();

    // ...省略
}
```

「ログイン中ユーザーのIDからTodoを探し返す」という見ての通りの実装だ。間違いではないのだが、筆者は若干、座りの悪い実装に感じる。

* Eloquentモデルを実装した際 *User HasMany Todo* を実装したので、
* 「ユーザーのTodo一覧」は `$user->todos` で取得できるはず。

そこで、次のような実装を推奨したい。

```php app/Http/Controllers/TodoController.php
public function index(Request $request)
{
    $todos = $request->user()->todos;

    // ...省略
}
```

1. コントローラーに `Request $request` を注入すると、
2. `$request->user()` で「ログイン中ユーザー」を取得できる
3. 「ログイン中ユーザー」はEloquentモデルなので、
4. `->todos` がそのユーザーのTodo一覧となる。

ポイントは、コードから `user_id` というカラム名が消えた点だ。

ORMにおけるIDとは「何かと何かを紐づけるための内部的な識別子」に過ぎない。ユーザーがそれを意識する必要が無いのはもちろんだが、開発者としても考え事は少ない方が良い。この小さな違いは、モデルの数が増えてくると大きな違いとなって現れる。

あとは、この Todo一覧: `$todos` を全てAPIリソースに変換して返せば良い。「一覧 = コレクション」を一括で返却するには `Resource::collection()` を使う:

```php app/Http/Controllers/TodoController.php
return TodoResource::collection($todos);
```

#### 作成 `store` と更新 `update` の実装

ここから先はとかく複雑になりがちな実装だが、このチュートリアルでは「シンプルな設計で素早く作る」テクニックを紹介したい。具体的には、設計に次のような制限を設ける:

1. リクエストの際のプロパティ名をEloquentモデルのカラム名と一致させた上で、
2. リクエストをそのままEloquentモデルの作成や更新に使う。

それを前提に、あくまで概念コードだが、例えば次のような極めて短いコードで実装してしまいたい:

```php
// あくまで概念コード—このままでは動かない
Model::create($request);
```

当然だが、これを「そのまま」実装してはいけない。`$request`の中に、ユーザーが直接更新してはいけないプロパティがあった場合、それは拒否しなければいけない。必要なプロパティが足りない場合、`400 bad request` を返したい。

Laravelが生成するコードの雛形は、最初からこれを意識した形になっている。


```php
public function store(StoreTodoRequest $request);

public function update(UpdateTodoRequest $request, Todo $todo);
```

ここで登場する `StoreTodoRequest`, `UpdateTodoRequest` はそれぞれ、Todoを「作成」または「更新」する際に使うリクエストだ。Laravelの機能として「フォームリクエスト」と呼ばれるこれらのクラスは、次のような機能を持つ:

1. 認可: ログイン状態や権限に応じてリクエストの許可や拒否を制御
   * 認可できない場合 は `403 Forbidden` を自動的に返す
2. バリデーション: リクエストに含まれるプロパティの書式を検証
   * 検証失敗の際は `422 Unprocessable Entity` を自動的に返す
3. フィルタリング: 以上の処理を全て通過した場合のみ、
   * コントローラーに処理が渡る。
   * コントローラーではバリデーション済のプロパティのみを取得できる。

認可は「その操作が許されるか」を、バリデーションは「値が正しいか」を判断する。以上のこれらの前処理を行った後であれば、冒頭に挙げた「リクエストをそのままEloquentモデルの作成や更新に使う」という処理が安全に実装できる。一旦コントローラーから離れ、フォームリクエスト `StoreTodoRequest`, `UpdateTodoRequest` を実装する。

##### 認可

フォームリクエストの雛形には次のようなメソッドが存在する:

```php app/Http/Requests/StoreTodoRequest.php
public function authorize(): bool
{
    return false;
}
```

今回はメソッドごと削除して問題ない。ルーティングの時点で最低限の認可（ログイン確認）を行っているのと、より高度な認可はこれとは別の機能を使い後で実装するためだ。

##### バリデーションルール

次にバリデーションルール。例えば次のように実装する。

```php app/Http/Requests/StoreTodoRequest.php
// StoreTodoRequest: Store=作成
public function rules(): array
{
    return [
        // 作成時は `title` が必須（`is_completed`は作成時は `false` 固定とする）
        'title' => ['required', 'string'],
    ];
}
```

```php app/Http/Requests/UpdateTodoRequest.php
// UpdateTodoRequest: Update=更新
public function rules(): array
{
    return [
        // 更新は `is_completed` のみ行える（`title` を指定しても無視される = 更新不可）
        'is_completed' => ['required', 'boolean'],
    ];
}
```

「リクエスト（バリデーション済のフォームリクエスト）をそのままEloquentモデルへ入力する」ための準備が整った。加えて「Eloquentモデルでリクエストをそのまま受け入れる」準備をする:

```php app/Models/Todo.php
protected $fillable = [
    'title',
    'is_completed',
];
```

更新してはならない値を入力されてしまうリスクは既に述べたが、それを防ぐ仕組みはEloquent側にも存在する。`$fillable` で許可されていないプロパティを `create()` や `update()` に渡した場合、それらは無視される（または設定によってはエラーでクラッシュする）。

バリデーションは「リクエストの入口でチェック」、Eloquentモデルの `$fillable` は「保存する直前に最終チェック」と考えれば良いだろう。深刻な脆弱性を防ぐためのダブルチェックだ。

ここまで準備すれば、この先のコントローラーの実装は極めて簡潔に済む。

##### 更新処理

```php app/Http/Controllers/TodoController.php
public function update(UpdateTodoRequest $request, Todo $todo)
{
    $todo->update($request->validated());

    return new TodoResource($todo);
}
```

1. `$todo` はLaravelから提供されるので、
2. バリデーション済のプロパティ `$request->validated()` そのまま渡し更新。
3. レスポンスは既に実装したAPIリソースを利用。

ここも「2行」で済んでしまった。

##### 作成処理

ここでは「一覧」の時のノウハウを応用してみよう。具体的には次のように考える:

* NG: ログイン中ユーザーのIDを`user_id`カラムにセットしTodoを作成
* OK: ログイン中ユーザーのTodoを作成

ここでも `user_id` というカラム名はコードから消したい。次のように実装しよう:

```php app/Http/Controllers/TodoController.php
$todo = $request->user()->todos()->create($request->validated());
```

ここではメソッドとプロパティの違いに注意する。具体的には次のような機能の違いがある。

* プロパティ: `$request->user()->todos`
  * ログイン中ユーザーのTodo一覧—コレクション
  * コレクションなので `map()`, `filter()` などの配列操作が可能
  * データは自動取得（Lazyロード）される
* メソッド: `$request->user()->todos()`
  * ログイン中ユーザーのTodoを操作するオブジェクト—Eloquentビルダ
  * Eloquentビルダなので 作成—`create()` や 更新—`update()` などの操作が可能

ここも「2行」で済んでしまった。かつ `user_id` というカラム名をコードから消すことが出来ている。

#### コントローラー実装のまとめ

ここまでのコードを俯瞰すると、Laravelの特徴的な設計思想を垣間見ることが出来る。

Laravel以外を含む多くのMVCフレームワークを用いたアプリケーションでは、次のような設計がベストプラクティスとされる。

* コントローラーの肥大化を避ける
* コントローラーに多くの責務を持たせない

それを実現する方法として、Laravel以外のフレームワークでは、次のような方法を採用することが多い:

* コントローラーでは次の処理だけを行う
  * リクエストの受け取り
  * レスポンスの返却
* コントローラーでは、モデルやデータベースを直接操作しない
  * 必要に応じて `Service` や `UseCase` を作成しそこに切り出す

一方で、これまで見てきた通り、Laravelで素直なコードを書くと、これとは逆の設計になる:

* 次の処理は、Laravelの機能を使いコントローラーの外に逃がす
  * リクエストの受け取り
  * レスポンスの返却
* コントローラーでは、Eloquentモデルの操作だけを行う
  * それ以外の処理はLaravelの機能として外に切り出せる
  * 結果、コントローラーでの処理対象はEloquentモデルの操作くらいしか残らない

アプローチとしては従来とは真逆だ。にも関わらず、結果的にコントローラーは「簡潔なコード」になっている。小規模なアプリケーションをLaravelで高速に開発する場合、この発想の転換が重要になる。

*注: ここで紹介した考え方は必ずしも万能でない点には注意。ある程度の規模になるとこの考え方だけでは無理が出てくるケースも多い。その場合は「従来の」考え方も有効だ。一方、ここで紹介した考え方はLaravelの「基本」でもあるので、一度は頭に入れておくと良いだろう。*

## リソースの認可

以上でAPIの基本的な実装を終えたが、セキュリティ上の致命的な問題が残っている。「ログイン中のユーザーであれば他人のTodoを操作できてしまう」という点だ。この問題を、Laravelの「ポリシー」機能で解消する。

方法は幾つかあるが、今回は「ポリシー」を使う。雛形として自動生成された `TodoPolicy` のシグネチャを見てみよう:

```php app/Policies/TodoPolicy.php
public function viewAny(User $user): bool;
public function view(User $user, Todo $todo): bool;
public function create(User $user): bool;
public function update(User $user, Todo $todo): bool;
public function delete(User $user, Todo $todo): bool;
public function restore(User $user, Todo $todo): bool;
public function forceDelete(User $user, Todo $todo): bool;
```

このクラスにはメソッド名の規定は無いので、自由に追加削除変更して問題ない。次のような考え方でメソッドを定義する。

*  `action(User $user, Model $model): bool` というメソッドで
* 「`$user` が `$model` に対して `action` を実行できるか？」を判定。

今回は 一覧—`viewAny`、作成-`create`、は要らない（ルーティングの時点でログインを要求している）ため削除する。モデルの論理削除—`SoftDeletes` も使っていないので `restore`, `forceDelete` も不要だ。残るのは次の3つ:

```php app/Policies/TodoPolicy.php
public function view(User $user, Todo $todo): bool;
public function update(User $user, Todo $todo): bool;
public function delete(User $user, Todo $todo): bool;
```

何れも「自分のTodoのみ操作可能」という仕様なので、単純に所有者を確認すれば良い:

```php app/Policies/TodoPolicy.php
return $user->id === $todo->user_id;
```

*注: 既に述べた「`user_id` をコードから消す」にという考えに基づき `$todo->user->id` としても良いが、ここでは敢えて `user_id` を残した。`$todo->user`の取得のためにデータベースアクセスが発生することを防ぐのが狙いだ。*

*参考: [Laravel日本語ドキュメント 12.x 認可 ポリシーの作成](https://readouble.com/laravel/12.x/ja/authorization.html#writing-policies)*

以上の通り、ポリシーをメソッドとして実装したら、コントローラーにその判定を追加する:

```php app/Http/Controllers/TodoController.php
public function destroy(Request $request, Todo $todo)
{
    abort_if(
        $request->user()->cannot('delete', $todo), // この箇所
        404
    );

    // ...省略
}
```

上の例では `cannot` だが当然 `can` も使える。`'delete'` の部分はポリシークラスのメソッド名と合わせる。上のコードは、判定が真だった場合404を返す処理になる。`show`や`update`にも同様の処理を追加する。

余談だが、上のコードはLaravelの中でも筆者が特に好きなイディオムだ。メソッドチェーンの連なりがほぼそのまま英文として成立している:

> If the request user cannot delete todo, abort with 404.

この機能に限らず、Laravelは「フレームワークの想定した自然な形のコードは、そのまま英文として成立する」と言う文法的な「体験」が多い。それを念頭にAPIリファレンスやLaravel Frameworkのコード読むと、普段とは別の発見があるかもしれない。

## まとめ

冒頭で「開発ワークフローや設計観点にフォーカスしてほしい」と述べた。個別のコード例も重要だが、それ以上に、自動生成コマンドや雛形が提供するフレームに沿った開発によりもたらされる「簡潔なコード」「高速な開発」を是非とも自分の手で体験して欲しい。

開発は基本的に、大きく「テーブル = モデル = リソース」の単位で行うことになる。この記事では、次の手順でそれを実装する方法を示した:

* `artisan`で雛形を生成し、構造を先に整える。
* Eloquentモデルの関係で「IDの呪縛」から解放される。
* フォームリクエスト、ポリシー、APIリソースで責務を分離する。
* 結果的に、コントローラーは簡潔なコードに保たれる。

過去に同じテーマで登壇した際のスライドや動画も参考にして欲しい。有り難いことに3年経った今も、再生数が更新され続けている、筆者としても力作の登壇だ:

{% link_preview https://fortee.jp/phperkaigi-2023/proposal/6211083d-fc51-49a3-8b27-485d8e231b1f %}
https://fortee.jp/phperkaigi-2023/proposal/6211083d-fc51-49a3-8b27-485d8e231b1f
{% endlink_preview %}

Laravelによる効果的な開発は「思想」の理解が不可欠だ。この記事が、その一助となれば幸いである。
