---
title: Laravel Eloquentで複合主キーのテーブルとリレーションシップを扱う
subtitle: Eloquentの制約を克服し、複合主キーを使いこなすための具体例
description: Eloquentは複合主キーに対応していない。この記事では、Laravelで複合主キーを扱う方法やリレーションシップの工夫を詳しく解説。既存データベースを活用したい開発者必見。
date: 2024-12-07 00:00
ogimage: ogimage.webp
twitter_large_card: true
tags:
  - PHP
---

この記事は [Laravel Advent Calendar 2024](https://qiita.com/advent-calendar/2024/laravel) 7日目の投稿です。

## 概要: Eloquentと複合主キーの課題

Eloquentは複合主キーに対応していない。

[Laravel日本語ドキュメント: Eloquentの準備 - 「コンポジット」主キー](https://readouble.com/laravel/11.x/ja/eloquent.html#composite-primary-keys)

> Eloquentは、それぞれのモデルがその主キーとして役立つことができる、少なくとも**１つの一意に識別される「ID」**を持つ必要があります。**Eloquentモデルは「コンポジット」主キーをサポートしていません。**

既存データベースをLaravelで扱いたいが、Eloquentが複合主キーに対応していないために困ったことはないだろうか？この記事では、複合主キーを使ったデータベースをEloquentから扱う場合の課題を解決する方法を、具体的に説明する。

## ナチュラルキーとサロゲートキー

まず「複合主キー」「『コンポジット』主キー」の意味を説明する。既にご存じの方は読み飛ばして構わない。

例題として、コメント機能つきの電子書籍サイトを想像して欲しい。次のようなモデルを考える:

### 例題: 電子書籍サイトのデータベース設計

- *著者: Author* は複数の *書籍: Book* を持つ
- *書籍: Book* は複数の *コメント: Comment* を持つ

最近のやり方で設計すると次のようになる:

### ER図

```plantuml

entity Author <<authors>> {
  * PK: **id** int
}

entity Book <<books>> {
  * PK: **id** int
  ---
  * FK: author_id int
}

note right of Book
  **author_id**
   references authors
end note

entity Comment <<comments>> {
  * PK: **id** int
  ---
  * FK book_id int
}
note right of Comment
  **book_id**
   references books
end note

Comment }o-u-|| Book
note right on link
  Book HasMany Comment
end note

Book }o-u-|| Author
note right on link
  Author HasMany Book
end note
```

### IDが示すものは何か？

上のモデルでは「著者」「書籍」「コメント」に、それぞれ**一意の**IDが付与されている。このIDの要件（採番体型）を、例えば次のように変更することを考える:

* 変更前: *書籍ID* は **全書籍を通じて** 一意
* 変更後: *書籍ID* は **著者ごとに** 一意

変更後の体型では、著者が異なれば異なる書籍に同じ書籍IDを付与できる。しかし、この体型は上のモデルでは対応できない:

| 著者ID | PK: 書籍ID | 備考 |
| :-: | :-: | :-: |
| 1 | **1** | OK |
| 1 | 2 | OK |
| 2 | 3 | OK |
| 3 | **1** | **一意制約違反** |

`books` テーブルは `id` 列単独で主キーのため、たとえ著者が異なっても `books.id` に2件の `1` は存在できない。

### 複合主キー

「複合主キー」はこのケースで利用する。次のような設計になる:

```plantuml
entity Author <<authors>> {
  * PK: author_id int
}

entity Book <<books>> {
  * PK: author_id int
  * PK: book_id int
}
note right of Book
  **foreign key (author_id)**
   references authors
end note

entity Comment <<comments>> {
  * PK: author_id int
  * PK: book_id int
  * PK: comment_id int
}
note right of Comment
  **foreign key (author_id, book_id)**
   references books
end note


Comment }o-u-|| Book
note right on link
  Book HasMany Comment
end note

Book }o-u-|| Author
note right on link
  Author HasMany Book
end note

```

*PK:主キー* を複数列に跨ぐことで、「単独の列で一意」ではなく「2列の組み合わせで一意」を可能とした。これで「*書籍ID* は **著者ごとに** 一意」を実現できる。コメントも同じように「3列の組み合わせで一意」とした。

現代では、「組み合わせで一意」という要件の場合、組み合わせに対する複合一意制約とは別で `id` という列を表の先頭に設け、それを単独で主キーとすることが多い。要件に応じて *自然* に決まる「*ナチュラル* キー」とは別で、主キー用に *代理* の「*サロゲート* キー」を用意する。

今やこれが常識だが、ORM普及以前は必ずしもそうでなかった。このパターンを、Eloquentは扱えない。

## LaravelとEloquentでの複合主キー

### Laravelで複合主キーを扱う方法

複合主キー非対応はEloquentの話であり、Laravelとしては扱える。`Comment` の場合マイグレーションは次のようになる:

```php
// 複合主キーを設定したマイグレーション例
Schema::create('comments', function (Blueprint $table) {
  $table->bigInteger('author_id');
  $table->bigInteger('book_id');
  $table->bigInteger('comment_id');

  // 複合主キーの対象列を配列で指定
  $table->primary(['author_id', 'book_id', 'comment_id']);

  // 複合外部キーの対象列を配列で指定
  $table->foreign(['author_id', 'book_id'])
    ->references(['author_id', 'book_id'])->on('books');
});
```

クエリビルダも問題ない。PHPコードとして表現した通りのSQLが実行される。

### Eloquentで複合主キーに対応する実装例

ここまでは問題なかったが、これらをテーブルではなくEloquentモデルとして扱おうとした際に問題が発生する。発生する幾つかの問題と解決策をそれぞれ説明する。

### `id` 列の名前

```php
$author = Author::find(42);
// Illuminate\Database\QueryException  SQLSTATE[HY000]: General error:
//   1 no such column: authors.id
//   (Connection: sqlite, SQL: select * from "authors" where "authors"."id" = 42 limit 1).
```

`authors` は単独主キーで本来問題ないが、`authors.id` という存在しない列を参照しようとしてエラー。Eloquentは主キーのカラム名を `id` と仮定しているので、そうでない場合は追加の設定が必要になる:

```php app/Models/Author.php
class Author extends Model
{
  // 追加: 主キーのカラム名を明示的に設定
  protected $primaryKey = 'author_id';
}
```

### 複合主キーと`find()`

複合主キーを対象とした `find()` は利用不可として諦める。決してやってなはいけない例として、次のような実装がある:

```php app/Models/Book.php
class Book extends Model
{
  // NG例: 主キーの一部だけを設定
  protected $primaryKey = 'book_id';
}
```

「`Book` モデルなので `book_id` が主キー」という妥当に見えるコード。一見きちんと動いている **ように見えてしまう** 点が厄介だ。結果は次のようになる。

```php
$book = Book::find(1); // book_id = 1 の書籍を取得
// SQL: select * from "books" where "books"."book_id" = 1 limit 1
// 返却:
// App\Models\Book {#5308
//   author_id: 1,
//   book_id: 1,
// }
```

`book_id`は複合主キーの一部でしかないことを思い出して欲しい:

| PK: 著者ID | PK: 書籍ID | 書籍名 |
| :-: | :-: | - |
| 1 | **1** | SQLアンチパターン |
| 1 | 2 | テスト駆動開発 |
| 2 | 3 | 人月の神話 |
| 3 | **1** | 失敗から学ぶ RDBの正しい歩き方 |

この例で `Book::find(1)` を実行した場合、「SQLアンチパターン」「失敗から学ぶ RDBの正しい歩き方」どちらが返却されるかは不定だ。事故の元なので `find()` 自体を禁止し、適切(?)なエラーメッセージと共にクラッシュさせてしまおう。私は次のようコードを推奨している:

```php app/Models/Book.php
class Book extends Model
{
  // 主キーに「あり得ない列名」を設定
  protected $primaryKey = 'このモデルには主キーがありません';
  // 主キーの自動増分を無効化（あり得ない列名のため）
  public $incrementing = false;
}
```

非対応を破った実装に対するフールプルーフやエラーメッセージはLaravel自体には用意されていない。そこで「絶対にエラーが発生するSQL」をEloquentに実行させその文字列を出力させている。「カラム名 = エラーメッセージ」は人間が読めれば何でも良い:

```php
Comment::find(1)
// Illuminate\Database\QueryException  SQLSTATE[HY000]: General error:
//   1 no such column: comments.複合キーのため主キー未設定
//   (Connection: sqlite, SQL: select * from "comments" where "comments"."複合キーのため主キー未設定" = 1 limit 1).
```

### `HasMany`の動作

`HasMany`も同じ理由でそのままでは正常動作しないが、これは工夫で解決できる。次のような表を考えよう:

| PK: 著者ID | PK: 書籍ID | PK: コメントID | 書籍名 | コメント |
| :-: | :-: | :-: | - | - |
| 1 | **1** | 1 |SQLアンチパターン | 体系的でした！ |
| 3 | **1** | 1 |失敗から学ぶ RDBの正しい歩き方 | 実践的でした！ |

```php
// OK: 1 - 和田卓人
$author = Author::find(1);

// OK: 1,1 - SQLアンチパターン
$book = $author->books->first();

// NG: 1,1,1: 「体系的でした！」 ← ここが問題になる
$comments = $book->comments;
```

まず誤った例。`book_id` というカラム名だけに注目すると、次のようなリレーションシップを書きたくなる。

```php app/Models/Book.php
public function comments(): HasMany
{
  return $this->hasMany(Comment::class, 'book_id', 'book_id');
}
```

この実装の問題点と解決方法を、Laravelのドキュメントの次の一節を踏まえ説明する:

[Laravel日本語ドキュメント: リレーション - リレーションのクエリ](https://readouble.com/laravel/11.x/ja/eloquent-relationships.html#querying-relations)

> **リレーションではLaravelクエリビルダメソッドのどれでも使用できる**ので、クエリビルダのドキュメントを調べ、使用可能な全メソッドを習んでください。

クエリビルダのデバッグと同じように、リレーションシップが実行するSQLを調べる:

```php
$book->comments()->toRawSql();
// select * from "comments" where
//   "comments"."book_id" = 1 and
//   "comments"."book_id" is not null
```

`find()` と同じ問題が発生している。`book_id` だけでは絞り込みが不十分のため「SQLアンチパターン」へのコメントを取得する際、同じ *書籍ID:1* を持つ「失敗から学ぶ RDBの正しい歩き方」のコメントも取得されてしまう。

この問題は、*リレーションではLaravelクエリビルダメソッドのどれでも使用できる* ことを利用し、次のように解決する:

```php app/Models/Book.php
public function comments(): HasMany
{
  return $this->hasMany(Comment::class, 'book_id', 'book_id')
    // 追加: 著者IDを絞り込み条件に追加
    ->where('author_id', $this->author_id);
}
```

```php
$comments = $book->comments()->toRawSql();
// select * from "comments" where
//   "comments"."book_id" = 1 and
//   "comments"."book_id" is not null and
//   "author_id" = 1 // 追加された
```

これで *`(*,1)`:(複数の書籍)* ではなく *`(1,1)`:SQLアンチパターン* のコメントだけを取得できるようになった。

### `BelongsTo`の動作

`BelongsTo`も同じ問題があるが、同じやり方で解決できる。SQLはほぼ同じなので結論のコードだけ示す:

```php app/Models/Comment.php
public function book(): BelongsTo
{
  return $this->belongsTo(Book::class, 'book_id', 'book_id')
    // 追加: 著者IDを絞り込み条件に追加
    ->where('author_id', $this->author_id);
}
```

### ルートモデル結合

複合主キーを持つモデルは、Eloquent以前にURL体型で制約事項がある。次のルートを考えてみよう:

```php
Route::get(
  'books/{book}',
  [BookController::class, 'show']
);

// GET books/{book}
```

次のようなHTTPリクエストを送ったとする:

```
GET /books/1

// ???
```

やはり `find()` と同じ問題が発生する。このURLでは「SQLアンチパターン」「失敗から学ぶ RDBの正しい歩き方」どちらを示すのかは特定できない。複合主キーを持つモデルへのルートモデル結合の場合:

```php
Route::get(
  'authors/{author}/books/{book}',
  [BookController::class, 'show']]
);

// GET authors/{author}/books/{book}
```

```
GET /authors/3/books/1

// 失敗から学ぶRDBの正しい歩き方
```

親の情報もURLに含まている必要がある。

ここまでは当然の話だが、Eloquentでこれを扱う場合やはり追加のコードが必要となる。ここから先は[ネストしたリソース](https://readouble.com/laravel/11.x/ja/controllers.html#restful-nested-resources)として設定された次の例を考える:

```php
Route::resource(
  'authors.books.comments',
  CommentController::class
);

// GET authors/{author}/books/{book}/comments/{comment}
```

```
GET /authors/3/books/1/comments/1

// 404 not found
```

予想に反し `404 not found` が返却されてしまった。これは `Book` や `Comment` の主キーが、前述のコードでいう `複合キーのため主キー未設定` であることが理由だ。Laravelがルートモデル結合のために実行しているSQLを調べてみる:

```php
\DB::enableQueryLog();

$response = $this->json(
  Request::METHOD_GET,
  'authors/3/books/1/comments/1'
);

dump(\DB::getRawQueryLog());
```

```sql
-- OK: Author: 単独で主キーのため問題ない
select * from "authors" where "author_id" = '2' limit 1

-- NG: Book: `find()` を利用禁止した際のエラーSQLが実行される
select * from "books" where "複合キーのため主キー未設定" = '11' limit 1
-- （設定していなかった場合、親子関係の異なる誤った書籍が返却されてしまう）

-- NG: Comment: 何も実行されない
-- Bookが取得できなかった時点でモデルの解決は中断される
```

主キーは設定できないがルートモデル結合の解決キーは指定する必要がある。[キーのカスタマイズ](https://readouble.com/laravel/11.x/ja/routing.html#customizing-the-default-key-name)を使って、今回は次のように指定する:

```php app/Models/Book.php
// 解決キーを明示的に指定
public function getRouteKeyName()
{
    return 'book_id';
}
```

```php app/Models/Comment.php
// 解決キーを明示的に指定
public function getRouteKeyName()
{
    return 'comment_id';
}
```

ここまでで `404 not found` は解消されるが、絞り込みが不十分なため *親子関係の異なる誤った* リソースが返却される可能性は残る。そこでルートに次のような記述を追加する:

```php
Route::resource(
  'authors.books.comments',
  CommentController::class
)->scoped(); // 追加: ネストしたリソースのスコープを明示的に宣言
```

以上の対応で問題なく動作する。

```
GET /authors/3/books/1

// 失敗から学ぶRDBの正しい歩き方
```

今回はモデル側をカスタマイズしルートは通常のやり方で指定したが、ルート側をカスタマイズする方法もある。後述のサンプルコードには一通りの実装が含まれているので、興味があれば参照して欲しい。

### `find()`の代替

`find()` 非対応は一見するとダメージが大きそうだが、実はそんなことはない。上に述べた通り `HasMany`, `BelongsTo` は問題なく利用できるため:

* 適切なURL体型とルートモデル結合での取得
* 探したいモデルの子から `BelongsTo` で取得
* 探したいモデルの親から `HasMany` で取得

このような方法で容易にモデルを一意に特定できる。

## コード例

この記事で解説した設計とコードを筆者のGitHubリポジトリで公開した:

{% link_preview https://github.com/KentarouTakeda/example-eloquent-composite-primary-key/pull/2 rel:noopener %}
https://github.com/KentarouTakeda/example-eloquent-composite-primary-key/pull/2
{% endlink_preview %}

コードには次のものが含まれる:

* 記事中のテーブル設計を再現するマイグレーション
* 複合主キーに対応する `HasMany`, `BelongsTo` の実装
* ルートモデル結合の設定例
* 意図通りの動作であることを確認するテストコード

必要に応じて参照して欲しい。

## まとめ

この記事では以下の点について解説した:

* 複合主キーが必要な状況とその設計例
* Laravelで複合主キーを扱うためのマイグレーション
* Eloquentモデルでの制約と解決策

### 備考

この記事ではファクトリの作成方法について触れていない。単に、筆者がまだ検証していないことが理由だ。良い実装を見つけ次第、追記する予定。

このやり方は、筆者が手探りで考案したものだ。紹介した手法より良い方法をご存じの方は、是非ともXなどで共有して欲しい。

{% details 更新履歴 %}

* 2024年12月6日
  * ルートモデル結合の説明を追加

{% enddetails %}
