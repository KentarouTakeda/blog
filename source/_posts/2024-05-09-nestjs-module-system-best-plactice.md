---
title: NestJS モジュール分割 ベストプラクティス
description: NestJSのモジュール分割の陥りがちな問題を克服するための詳細ガイド。実践的なアプローチでSOLID原則に準拠し、高品質なアプリケーション設計を実現する方法を紹介。
date: 2024-05-09 20:00
ogimage: nest-og.png
tags:
  - NestJS
  - Node.js
  - TypeScript
---

## はじめに

NestJSを1年ほど使っている。未経験の状態からすぐに高い生産性を発揮してくれた、素晴らしいフレームワークだ。

様々な機能を持つが、中でも特徴的なのはモジュールシステムだろう。

{% link_preview https://docs.nestjs.com/modules %}
{% endlink_preview %}

> This helps us manage complexity and develop with **SOLID** principles, especially as the size of the application and/or team grow.

[SOLID原則](https://ja.wikipedia.org/wiki/SOLID)への準拠を目的とした機能だが、これを使いさえすれば私達のコードが自動的にSOLIDに準拠するわけでは当然ない。モジュール分割の指針やディレクトリ構成はユーザーに委ねられているわけだが、**公式のチュートリアルに掲載されたパターンを現実のプロジェクトにそのまま適用しても、高い確率でそれは破綻する。**

設計の根幹となるモジュール分割だけは、NestJSが標準で用意する枠組みを必要に応じて拡張する必要がある。この記事では、そのためのヒントを提供する。

## モジュールを "使わない" 選択肢

まず、そもそも何故モジュールシステムを使うのか考える。

チュートリアルでは、各コントローラーが参照するユースケースは当たり前のようにServiceとしてプロバイダより注入するよう案内される。NestJSを使う以上それが流儀と考えてしまいがちだが、全てをDIだけで制御しようとした時に `XXXX.module.ts` やその依存関係が無用に複雑になってしまうのは、多くの人が経験したことだろう。 `const add = (x, y) => x + y;` にDIを適用する理由は、おそらく無い。

以上を踏まえ、次のような関数やオブジェクトを考えてみる:

* 副作用を伴わない、純粋な関数である。
* テスト時の要件として、モックする必要がない。
* 他のオブジェクトに依存しない。
* 機能要件として、実装の差し替えを行う必要がない。

上から順に「必ずしもDIを使わなくて良い順」に列挙した。

DIによって担保される品質特性は主に、テスト容易性（Testability）、変更容易性（Modifiability）、交換可能性（Replaceability）などである。逆に言うと、これらの品質特性を考慮する必要性の薄い実装は、必ずしもDIを、すなわちモジュールシステムを使う必要はない。

* 単一の純粋関数として表現できる。
* 実装の差し替えを行う必要性が薄い。

こういった実装に関しては、従来通りTypeScriptの `import` / `export` だけを使う選択肢もある。メリットはコードベースのシンプルさだ。モジュールシステムを維持するコストと天秤にかけ、必要であればテストライブラリ標準のモック機能で代替可能かなどを踏まえ検討すると良い。

## モジュールの "種類" を考える

結論としては「Controllerを `exports` するモジュール」「それ以外を `exports` するモジュール」の2つに分け、ディレクトリや名前で区別すると良い。

まず、何も考えずNestJSのチュートリアルや `nest generate` コマンドの生成結果に従った場合の構成を考えてみよう。

例えば「ユーザー」を扱う `UsersController` / `UsersService` とそれが所属するモジュール、「投稿」を扱う同じセット、という構成を考える。「ユーザー」「投稿」ともServiceがデータベースから情報を取得するものとする。

### 🚫 チュートリアルに準じた実装

```plantuml
metaclass AppModule {}

package UsersModule {
  class UsersController <<exports>> {
    users/users.controller.ts
  }
  class UsersService {
    users/users.service.ts
  }

  UsersController -d-> UsersService : provides
}

package PostsModule {
  class PostsController <<exports>> {
    posts/posts.controller.ts
  }
  class PostService {
    posts/posts.repository.ts
  }

  PostsController -d-> PostService : provides
}

AppModule -d-> UsersController : imports
AppModule -d-> PostsController : imports
```

チュートリアルで案内された通りに構成するとこのようになるが、この構成は <u>`PostsModule`からユーザーをクエリしたい</u> という要請だけで破綻する。このまま素直に書き進めた場合、次のような構成になるだろう。

### 🚫 必要に応じて `provies` を追加

```plantuml
metaclass AppModule  {}

package UsersModule {
  class UsersController <<exports>> {
    users/users.controller.ts
  }
  class UsersService {
    users/users.service.ts
  }

  UsersController -d-> UsersService : provides
}

package PostsModule {
  class PostsController <<exports>> {
    posts/posts.controller.ts
  }
  class UsersService2 as "UsersService" {
    **users/**users.repository.ts
  }
  class PostService {
    posts/posts.service.ts
  }

  PostsController -d-> UsersService2 : provides
  PostsController -d-> PostService : provides
}

AppModule .d.> UsersController : imports
AppModule .d.> PostsController : imports

note as N
  * 2箇所（n箇所）でprovideされる
  * ディレクトリを跨いでprobideされる
end note

N -u[dotted]- UsersService
N -u[dotted]- UsersService2
```

ディレクトリ（機能）を跨いで詳細に依存してしまった。モジュールシステムを使ってはいるがSOLID原則には程遠い。詳細ではなく「モジュール」に依存するよう修正してみる。

### 🚫 構成を変えず `imports` を追加

```plantuml
metaclass AppModule {}

package UsersModule {
  class UsersController <<exports>> {
    users/users.controller.ts
  }
  class UsersRepository <<exports>> {
    users/users.service.ts
  }

  UsersController -d-> UsersRepository : provides
}
note as N
  複数の用途でimportsされる
end note
N -u[dotted]-- UsersModule

package PostsModule {
  class PostsController <<exports>> {
    posts/posts.controller.ts
  }
  class PostService {
    posts/posts.service.ts
  }

  PostsController -d-> PostService : provides
}

PostsController .l.> UsersRepository : imports

AppModule .d.> UsersController : imports
AppModule .d.> PostsController : imports
```

依存関係の隠蔽は行えたが `UsersModule` の責務が暴走してしまった。更に言うと、<u>`UsersModule`からで投稿をクエリしたい</u>という新たな要請により循環参照まで発生してしまう。

今回の場合、次のようにすると良いだろう。

### ✅ 機能をグループ化したモジュールを新設

```plantuml
metaclass AppModule {}

package UsersModule {
  class UsersController <<exports>>
}

package PostsModule {
  class PostsController <<exports>>
}

package RepositoryModule {
  class UsersRepository<<exports>>
  class PostsRepository <<exports>>
}

AppModule .d.> UsersController : imports
AppModule .d.> PostsController : imports
UsersController .d.> UsersRepository : imports
PostsController .d.> PostsRepository : imports
```

モジュール分割を考えず単にクラスの依存関係だけ考えた場合とほぼ同じ形だ。そして、例題としてよく挙げられる「仮にDBを変更することになったら？」という要請には `RepositoryModule` を丸ごと差し替えるだけで対応可能でもある。

次に、このモジュール分割におけるディレクトリ構成について考える。

### 🚫 `nest generate` が標準で提供する配置

* `src/`
  * **`repository/`**
    * `repository.module.ts`
    * `user.repository.ts`
    * `post.repository.ts`
  * **`users/`**
    * `users.module.ts`
    * `users.controller.ts`
  * **`posts/`**
    * `posts.module.ts`
    * `posts.controller.ts`

標準の構成では非常に座りが悪い。RESTリソースを想定した `users/` や `posts/`  と、機能としての `repository/` が同列に並んでいる。

数が増えてきた際に混沌とするのは目に見えている。次のように修正すると良いだろう。

### ✅ コントローラーとそれ以外とを区別

* `src/`
  * **`controllers/`**
    * **`users/`**
      * `users.controller.module.ts`
      * `users.controller.ts`
    * **`posts/`**
      * `posts.controller.module.ts`
      * `posts.controller.ts`
  * **`services/`**
    * **`repository/`**
        * `repository.service.module.ts`
        * `users.repository.ts`
        * `posts.repository.ts`

ディレクトリ名を `services/` としたがこれは何でも良い。ディレクトリを分け、名前も `FooControllerModule` / `BarServiceModule` と言った形で区別を容易にした。

<small>
  ※この例では割愛しているが `UsersControllerModule` 内でのみ参照される「ユーザー」固有かつ外の機能に依存しないサービスクラスが必要な場合 `users/users.service.ts` などを配置しても良い。
</small>

最終的に「よく見るディレクトリ構成」に落ち着いたに過ぎないのだが、 `nest generate` に全面的に従っただけではこの形にならない点に注意。冒頭で述べた通り *公式のチュートリアルに掲載されたパターンを現実のプロジェクトにそのまま適用* しても、多くはうまくいかない。

<small>
  この記事では、以降、 `FooControllerModule` に相当するモジュールを「コントローラーモジュール」、それ以外を「サービスモジュール」と呼ぶ。
</small>

### ℹ️ HTTPリクエスト以外への対応

ところで、NestJSはブートストラップ処理（通常は`src/main.ts`）を複数用意することで、HTTPリクエスト以外からも処理を起動できる。バッチ処理やHTTP外の非同期処理を実装する場合、それに応じて起動ハンドラに毎に次のような構成にするのも良い:

* `src/`
  * **`handlers/`**
    * **`controllers/`** HTTPリクエストを処理するハンドラ
      * `users/`
      * `posts/`
    * **`commands/`** 例: CLIコマンドを処理するハンドラ  
      *...*
    * **`queue-consumers/`** 例: 非同期キューからのメッセージを処理するハンドラ  
      *...*
  * `services/`  
    *...*

### ℹ️ `AppModule` は全体の設定のみ行う

では `AppModule` は「コントローラー」「それ以外」どちらに該当するだろう？

「どちらにも該当しない」として扱うと良い。何かを `exports` するわけにはいかない。配下に直接コントローラーを配置してしまうと、上で述べたような座りの悪い状態になる。

従って、自動的に配置される `AppService` / `AppController` は削除してしまおう。もし `/` へのルーティングが必要なのであれば `IndexControllerModule` 辺りを作成し隔離する。

結果 `AppModule` の役割は:

* コントローラーモジュールを `imports` する。
* `@Global()` なサービスモジュールを `imports`する。
* `APP_FILTER` や `APP_INTERCEPTOR` で全体の振る舞いを設定する。
* 必要に応じて `configure()` で起動処理などを実装する。

以上に絞られることになる。

## `providers` と `imports` の選択

モジュール内でDIを設定するには、次の2つの方法がある:

* 注入クラスを `providers` へ直接指定
* 注入クラスの提供モジュールを `imports` へ指定

この選択が、特に依存が連鎖する場合の保守性に大きく影響する。

教科書的には「単一責任原則に従い決定すれば良い」という回答になるが、ここでは、NestJSにおけるそれぞれの選択がその後の保守性にどう影響するかを考えてみる。

### 依存の連鎖

例えば次のような、少し複雑なパターンを考える:

```plantuml
package SomeControllerModule {
  class SomeController <<exports>>
}

package FooBarServiceModule {
  class FooService <<exports>>
  class BarService

  FooService -d-> BarService : provides
}

package HogeServiceModule {
  class HogeService <<exports>>
}

package FugaServiceModule {
  class FugaService <<exports>>
}

class VerySimpleService

SomeController .d.> FooService : imports
SomeController .d.> HogeService : imports
SomeController -d-> VerySimpleService : provides

HogeService .d.> FugaService : imports
```

* `VerySimpleService`: モジュールでラップせず直接 `provides` される設計
* `BarService`: 注入クラスを `providers` へ直接指定
* `FugaService`: 注入クラスの提供モジュールを `imports` へ指定

最初の `SomeController` から `VerySimpleService` への依存に注目する。例えば現在は次のようなコードとディレクトリ構成だったとする。

```typescript some.controller.module.ts
@Module({
  controllers: [SomeController],
  providers: [
    VerySimpleService,
  ],
})
export class SomeControllerModule {}
```

* `controllers/`
  * `some/`
    * `some.controller.module.ts`
    * `some.controller.ts`
* `services/`
  * `very-simple.service.ts`

この構成に対し、何らかの追加要件で `VerySimpleService` が他のサービスに依存しなければならなくなった状況を考えよう。

### 🚫 `provides` の連鎖

```plantuml
package SomeControllerModule {
  class SomeController <<exports>>
}

class VerySimpleService
class LittleComplexService

SomeController -d-> VerySimpleService : provides
VerySimpleService -d-> LittleComplexService : provides
```

まず確認だが、`SomeController` が **直接**依存しているのは `VerySimpleService` だけだ。従ってコードは次のようになっている:

```typescript some.controller.ts
@Controller()
export class SomeController {
  constructor(
    private readonly verySimpleService: VerySimpleService,
  ) {}
}
```

だが、この孫の依存も、それが所属する `SomeControllerModule` で `provides` することになる。

```typescript some.controller.module.ts typesc
 @Module({
   controllers: [SomeController],
   providers: [
+    LittleComplexService, // 追加
     VerySimpleService,
   ],
 })
 export class SomeControllerModule {}
```

**この依存の追加が、破滅への第一歩だ。** 具体的には:

* `controllers` や `provides` が今よりも増えていった場合
* 「孫」だけでなくそれより先の子孫の依存が必要になった場合

こういった状況で、この `provides` を管理できるだろうか？

修正範囲はおそらく `SomeControllerModule` に留まらない。  **`VerySimpleService` を `provides` する全てのモジュール** はもちろんのこと `'@nestjs/testing'` によるユニットテストを実装している場合、 **テストコード中の `Test.createTestingModule()`** など全てで修正が必要になる。

一度こうなってしまうと **何か依存を追加する度に `Nest can't resolve dependencies of ...` に長時間悩む** ことになる。これは避けたい。

### ✅ `imports` の連鎖

既に挙げた3例のうち:

```plantuml
package SomeControllerModule {
  class SomeController <<exports>>
}

package HogeServiceModule {
  class HogeService <<exports>>
}

package FugaServiceModule {
  class FugaService <<exports>>
}

SomeController .d.> HogeService : imports
HogeService .d.> FugaService : imports
```

この形であれば対応は容易だ。依存が追加された以上それに対応するモジュールに `provides` を追加することは避けられないが、新たな依存はモジュールの内部に隠蔽されているため **修正箇所は1箇所** で済む。従って:

* *SHOULD:* 単独の小さなサービスであっても、モジュールでラップし `exports` で公開 *すべきである*
* *MAY:* 新たな依存は追加されない無いと予想できる小さなサービスは単独で `provides` *しても良い*
  * *MUST:* 予想に反し依存が追加された場合、その時点でモジュールに隠蔽 *しなければならない*

このように考えると良いだろう。

ここは臨機応変な対応が重要だ。将来を心配するのであれば *あらゆるサービスは直接の `provides` を避けモジュールでラップすべき* となるが、極めて小さな（しかし複数のモジュールから参照される）ユースケースを書く度にファイルを2つ作成し `@Module()` を設定するのは気が重い。

幸いなことにTypeScriptは、気の利いたエディタであればクラス名の変更やファイル移動（及びそれに応じた `import from` の自動修正）は容易だ。上の *SHOULD* と *MUST* に特に注意しつつ、状況が許せば *MAY* の採用を辞さないのが合理的と私は考えている。

## Package Privateの導入

ここまで「ディレクトリ構成」「依存の設定方法」について述べてきたが、何れも単なる「指針」にしか過ぎず、強制力が無い。

本来であればモジュールを通じて `imports` されることを想定したサービスクラスを別のモジュールで直接 `provides` されてしまうことは、TypeScriptの仕様として避けられないわけだが、これを避け安全に運用するため、何等か追加のルールやツールを導入してもいいだろう。

### ℹ️ `index.ts` による暗黙的な表明

* **`users/`**
  * `users.controller.module.ts`
  * `users.controller.ts`
  * `users.service.ts`
  * **`index.ts`**

ここまで紹介したテクニックに準拠した場合、このフォルダはおそらく「`UsersControllerModule` を `AppModule` で `imports` する」以外のことは想定されていない。そこで:

```typescript users/index.ts
export * from './users.controller.module.ts';
```

Package Privateであることをこのように表明できる。強制力は無いままだが、何もしないよりはこの方が良い。

### ✅ [eslint-plugin-import-access](https://github.com/uhyo/eslint-plugin-import-access) での禁止

ツールの導入により強制力を持たせることもできる。

{% link_preview https://github.com/uhyo/eslint-plugin-import-access %}
{% endlink_preview %}

前述の例で言えば、`users/users.service.ts` / `users/users.controller.ts` は `users/` 配下以外で決して `import` してはいけない（`users/` 配下では `import` して良い）ことになるが、これをLintルールとアノテーションで強制できる。 `index.ts` を使った表明にも対応している。

詳しくは[作者のZennの記事](https://zenn.dev/uhyo/articles/eslint-plugin-import-access)を参照して欲しい。

## まとめ

1年ほどの試行錯誤を通じて得たノウハウを一通り紹介した。

別案や異論、発展案などをお持ちの方は是非とも [@KentarouTakeda](https://twitter.com/KentarouTakeda) まで連絡して欲しい。特に、自分はまだ [Monorepo mode](https://docs.nestjs.com/cli/monorepo#monorepo-mode) の運用経験が無いため、コードベースが更に成長した際のプラクティスに対しては検討が足りないかもしれない。

何れも習作の段階やプロジェクト初期はオーバースペックだが、サービスクラスの数が2桁程度になってきた辺りでストレスを感じてくるはずだ。その時は是非、ここで取り上げたテクニックを活用して欲しい。 

`Nest can't resolve dependencies of ...` に悩まされることのないコードベースの運用を目指していきたい。
