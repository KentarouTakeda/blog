---
title: Laravel OpenAPIによる "辛くない" スキーマ駆動開発
subtitle: PHPerKaigi 2024 レギュラートーク資料
description: PHPerKaigi 2024でのレギュラートーク資料。LaravelとOpenAPIを駆使して、煩雑なスキーマ駆動開発をシンプルにする方法を紹介します。API仕様とサーバー実装の一致、フロントエンド開発の効率化、そしてAPIの繋ぎ込みや結合テストの問題切り分けの不要化について解説。PHPとLaravelを使った開発においてスキーマ駆動開発に関心がある方や、より効率的な開発手法を求める方にとって必見の内容です。
date: 2024-03-08 11:15
tags:
  - PHP
  - Laravel
  - phperkaigi
---

PHPerKaigi 2024 レギュラートーク資料です。

**スライド版とテキスト版は全く同じ内容**です。トークとしてご覧頂く場合はスライド版を、資料中のリンクやコードを確認される場合はテキスト版をご覧ください。

## スライド版

<iframe class="speakerdeck-iframe" frameborder="0" src="https://speakerdeck.com/player/1aeeeb5790884676a2ba59fd544e691f" title="Laravel OpenAPIによる &quot;辛くない&quot; スキーマ駆動開発" allowfullscreen="true" style="border: 0px; background: padding-box padding-box rgba(0, 0, 0, 0.1); margin: 0px; padding: 0px; border-radius: 6px; box-shadow: rgba(0, 0, 0, 0.2) 0px 5px 40px; width: 100%; height: auto; aspect-ratio: 560 / 315;" data-ratio="1.7777777777777777"></iframe>

## テキスト版

<!-- textlint-disable -->

### プロポーザル

スキーマ駆動開発は非常に強力な開発手法です。

* API仕様とサーバ実装が確実に一致し、クライアントライブラリは自動生成されます。
* フロントエンドは型システムの力により、「サーバ」を意識せずに開発が可能です。
* 「APIの繋ぎ込み」タスクや結合テスト時の問題切り分けが不要になります。

---

**なるほど、完璧な作戦っスね―――ッ**  
**不可能だという点に目をつぶればよぉ～** 

---

{% twitter https://twitter.com/d_hori_web/status/1607938929172566016 %}

---

スキーマ駆動開発はしばしば「辛い」と言われます。

* スキーマと実装とをそれぞれ書かなければいけません。
* 開発中の変更がフロントエンドのCIを予期せず壊すことがあります。
* 破壊的変更を避けるために類似のエンドポイントが乱立しがちです。
* 実際には、仕様と実装が常に一致しているとは限りません。

---

{% twitter https://twitter.com/d_hori_web/status/1607940420998430720 %}

---

これらの課題をLaravelおよびLaravel OpenAPIを使用して解決します。

* ライブラリの機能を活用し、スキーマと実装との二重化を解消します。
* 仕様と実装との不一致を自動的に検出します。
* フロントエンドのCIを壊さないスキーマの運用を行います。
* そもそもスキーマ駆動開発とは何かを解説します。

---

これまでOpenAPIやスキーマ駆動開発に苦労したことのある方はもちろん、  
これから導入を検討している方々にとって有益な内容です。

---

### 自己紹介・課題感・登壇の動機

[@KentarouTakeda](https://twitter.com/KentarouTakeda) / 武田 憲太郎 / Webアプリケーションエンジニア

* 得意な言語: PHP >= 4.3
* 好きな言語: TypeScript >= 0.9

#### PHPは4の頃から

* `register_globals`
* `error_reporting(E_ALL & ~E_NOTICE);`
* 型に関する保証が何もない。

#### TypeScript 0.9でフロント開発を学び始めた

* 型安全、null安全な実装。

---

#### LaravelやSymfonyでAPI開発を行うようになった

* フロントエンド同等の型安全性を得られない。
* 異なる言語で同じ意味のコードを2度書くストレス。

#### 登壇のモチベーション

* APIへの型付けや実装の二重化に、課題感を持ち続けている。
* 解決のノウハウを共有し、知見を深め合いたい。

---

### アジェンダ

* APIファーストが生む困難
* 仕様管理における課題
* スピードと品質との両立

---

### APIファーストが生む困難

#### 解釈の余地のある仕様書

<div class="post-flex">

  ![](excel仕様書.png "Excelで作成された仕様書 表でオブジェクトが表現され、型の表現などが標準外の記法で表現されている。")

  * 文字列の長さ
  * 文字列の形式
  * 処理系による型の違い
  * 日付や時刻の表現
  * List要素の型
  * nullとプロパティ未定義
  * 表現の難しい複雑なオブジェクト

</div>

---

#### 仕様書の冗長化に過ぎない実装

```php
class CreatePHPerRequest extends FormRequest
{
  public function rules(): array
  {
    return [
      'email' => [ 'required', 'email', 'max:128' ],
      'password' => [ 'required', 'string', 'max:32' ],
      'name' => [ 'required', 'string', 'max:20' ],
      'birthdate' => [ 'nullable', 'date' ],
      'introduction' => [ 'required', 'string', 'max:1024' ],
      'frameworks' => [ 'required', 'array' ],
      'frameworks.*' => [ 'string' ],
    ];
  }
}
```

*仕様書と全く同じ内容を別の書き方に書き直しているに過ぎない*

---

```php
<label for="email">メールアドレス</label>
  <input type="email" name="email" id="email"
    maxlength="128">

<label for="password">パスワード</label>
  <input type="password" name="password" id="password"
    maxlength="32">

<label for="name">名前</label>
  <input type="text" name="name" id="name"
    maxlength="20">

<label for="birthdate">生年月日</label>
  <input type="date" name="birthdate" id="birthdate">

<!-- 省略 -->
```

*仕様書と全く同じ内容を別の書き方に書き直しているに過ぎない*

---

```js
axios.post("/api/phpers", {
  email: form.email,
  password: form.password,
  name: form.name,
  birthdate: form.birthdate,
  introduction: form.imtroduction,
  frameworks: form.frameworks,
}).then(response => {
  // 省略: レスポンスを描画
});
```

*仕様書と全く同じ内容を別の書き方に書き直しているに過ぎない*

* 言語もコードベースも異なるため、再利用が効かない。
* 手作業には常に、ミスのリスクが付きまとう。
* <u>再利用を行えない意味の薄い単純作業に割かれる多くの時間。</u>

---

#### 仕様と実装の乖離

```php
Schema::create('items', function (Blueprint $table) {
  $table->id()->comment('商品ID');
  $table->string('name')->comment('商品名');
  $table->decimal('price')->comment('販売価格');
  $table->boolean('in_sale')->comment('販売中かどうか');
});
```

```php
public function show(Item $item)
{
  return [
    'id' => $item->id, // 1. 商品ID: number
    'name' => $item->name, // 2. 商品名: string
    'price' => $item->price, // 3. 販売価格: number
    'in_sale' => $item->in_sale, // 4. 販売中かどうか: boolean
  ];
}
```

問い: 形の誤りを指摘してください。DBはMySQLとします。

---

```json
{
  "id": 42,
  "name": "The answer",
  "price": "100.00", // numberではなくstring
  "in_sale": 1 // booleanではなくnumber
}
```

* `numeric`型（PostgreSQL） / `decimal`型（MySQL）
  * 固定小数点はfloatでは表現できないためPHPではstringとして扱われる。
* `boolean`型（MySQL）
  * `tinyint(1)`型へのエイリアス。

正解: 3, 4

---

#### 信じられない仕様書

<div class="post-flex">

<div>

![](files-date.png "日付をファイル名に含む複数の仕様書が存在する")

* 履歴を管理できない形式
* バックアップによる運用
</div>

<div>

![](files-branch.png "ブランチ名をファイル名に含む複数の仕様書が存在する")

* ブランチ毎に並列管理
* マージを行えない形式  
</div>
</div>

---

#### 隠蔽されない知識

<div class="post-flex">

<div>

##### API仕様書に準拠した実装

```ts
// GET /api/phpers/{id}

const phper = await axios
  .get('/api/phpers/' + id);
```

* 目的: IDを指定しPHPer情報を取得する。
* 手段: 指定された書式で **URLを組み立て** そこに **GETリクエスト** を送る。

**ネットワークの知識がフロントに漏れ出している。**

</div>

<div>

##### 抽象化された実装

```ts
// PhperApiクラスのメソッド呼び出し

const phper = await phperApi
  .getPhperById(id);
```

* 目的: IDを指定しPHPer情報を取得する。
* 手段: IDを指定しPHPer情報を取得する。

**適切な隠蔽が目的と手段を一致させる。**

</div>

</div>

---

{% twitter https://twitter.com/Yametaro1983/status/1760233235148341442 %}

---

### 仕様管理における課題

#### 仕様書の無い開発

```php
// サーバサイド: PhperController.php
 
public function show(Phper $phper): array
{
  return response()->json([
    'name' => $phper->name,
    'email' => $phper->email,
    'birthdate' => $phper->birthdate
      ->toIso8601String(),
  ]);
}
```

```ts
// フロントエンド: PhperComponent.tsx
 
useEffect(() => {
  axios.get("/api/phpers/" + id)
    .then(response => setPhper({
      name: response.data.name,
      email: response.data.email,
      birthdate:
        new Date(response.data.birthdate),
    })
});
```

* サーバサイドが出力するプロパティ名とフロントエンドのそれとが連動
* フロントエンドのコンポーネントがサーバサイドに依存している

---

##### 依存関係

```plantuml
circle Internet
package バックエンド {
  class PhperController
}
package フロントエンド {
  class PhperComponent
}
PhperComponent -> Internet
Internet -> PhperController
```

* インターネットを跨いで依存している
* 担当者を跨いで依存している
* リポジトリを跨いで依存している

---

#### 仕様書のある開発

##### 依存関係逆転の原則

> 上位のモジュールは下位のモジュールに依存してはならない。どちらのモジュールも「抽象」に依存すべきである。

```plantuml
abstract 仕様書
class PhperController
class PhperComponent
PhperController -r-> 仕様書
PhperComponent -u-> 仕様書
```

抽象（仕様書）への依存により詳細（インターネット）を隠蔽  
*APIファーストはここが出発点*

---

#### 「仕様書」は依存に値するか？

<div class="post-flex">

![](すばやく実装するための戦略とテクニック-表紙.png "すばやく実装するための戦略とテクニック 表紙")

![](すばやく実装するための戦略とテクニック-目次.png "すばやく実装するための戦略とテクニック 目次")

</div>

[すばやく実装するための戦略とテクニック2023年版](https://speakerdeck.com/77web/subayakushi-zhuang-surutamenozhan-lue-totekunituku2023nian-ban) by [@77web](https://twitter.com/77web)

* 「争いのないものから作る」
* 「間違いにくい道具」

---

##### 争いのないものから作る

###### プリミティブな値は<u>Json Schema</u>で表現可能

* 数値
  * `{ "type": "number" }`
* 整数
  * `{ "type": "integer" }`
* 自然数
  * `{ "type": "integer", "minimum": 1 }`
* `non-empty-array<string>`
  * `{ "type": "array": "items": { "type": "string" }, minItems: 1 }`

###### プリミティブなドメインは<u>OpenAPI Specification</u>で表現可能

* 文字列・UI上はマスクを推奨・8文字以上
  * `{ "type": "string", "format": "password", "minLength": 8 }`
* 日時・ISO8601形式の文字列
  * `{ "type": "string", "format": "date-time" }`
* URL文字列
  * `{ "type": "string", "format": "uri" }`

**「解釈の余地」は争い → <u>争いをなくす</u>**

---

##### 間違えにくい道具

* 間違いが機械的に指摘される。
  * 補完（エディタ・IDE）
  * Link / 静的解析
    * [Spectral](https://github.com/stoplightio/spectral)
    * [IBM OpenAPI Validator](https://github.com/IBM/openapi-validator)
  * 実行時検査
* 履歴が残る。
  * Git

**人間が書くから間違える → <u>機械に任せれば間違えない</u>**

---

#### 「スキーマ駆動開発」の再定義

```plantuml
entity 間違えにくい道具 {
  * JSON Schema
  * Lint / 静的解析
  * バージョン管理
}
interface 仕様
class PhperController
class PhperComponent
abstract 仕様書
仕様 -u-> 間違えにくい道具
PhperController -r-> 仕様
PhperComponent -u-> 仕様
仕様書 -l-> 仕様
```

安定したインターフェース記述言語へ依存することで、  
**秩序を<u>強制</u>し、品質を向上させる、開発手法**

* <u>**強制**</u>が、メリットでありデメリット。
* <u>**強制**</u>のコントロールが、開発の成否を決める。

---

{% twitter https://twitter.com/d_hori_web/status/1607939654439034880 %}

---

#### 依存の強制

OpenAPIドキュメントそれ自体に強制力は無い。

```php
class Phper extends Model
  implements Authenticatable
{
}
// Fatal error:
//   Class PhperModel contains 6 abstract methods and must therefore be declared ...
```

実用的に使うには、これと同じ制約<u>強制</u>が必要。

---

##### ツールによる依存の強制

* [OpenAPI Generator](https://github.com/OpenAPITools/openapi-generator?tab=readme-ov-file#overview)
  * 仕様に準拠（＝正しく依存）したライブラリが自動生成される
  * 「ビルドが通れば問題なし」と判断できる
* API Gateway
  * [OpenAPI への API Gateway 拡張機能の使用](https://docs.aws.amazon.com/ja_jp/apigateway/latest/developerguide/api-gateway-swagger-extensions.html) を使う
* Apigee
  * [OpenAPI 仕様から API プロキシを作成する](https://docs.apigee.com/api-platform/tutorials/create-api-proxy-openapi-spec)
* バリデーションの自動化 - [OpenAPI PSR-7 Message Validator](https://github.com/thephpleague/openapi-psr7-validator)

---

##### 成果物の再利用

* ドキュメントの生成
  * [Redocly](https://redocly.com/)
* テストツール
  * [Swagger UI](https://swagger.io/tools/swagger-ui/)
* e2dテストとの統合
  * [Integrate Postman with OpenAPI](https://learning.postman.com/docs/integrations/available-integrations/working-with-openAPI/)

---

##### OpenAPIによるスキーマ駆動開発

```plantuml
entity 間違えにくい道具 {
  * JSON Schema
  * Lint / 静的解析
  * バージョン管理
}
interface OpenAPIドキュメント
class PhperController
class PhperComponent
package 様々な開発タスク {
  entity 開発ツール
  abstract 仕様書
  entity テストツール
  class IaC 
}
PhperController -r-> OpenAPIドキュメント : OpenAPI\nMessage\nValidator
PhperComponent -u-> OpenAPIドキュメント : OpenAPI\nGenerator
OpenAPIドキュメント -u-> 間違えにくい道具
様々な開発タスク -l-> OpenAPIドキュメント : 各種ツール
```

**多くの用途**への**正しい**転用がOpenAPI活用のポイント

---

### スピードと品質との両立

#### OpenAPIドキュメントを書く: ツールで書く

メリット:導入が容易 / デメリット:コード管理・CI

<div class="post-flex">

[Swagger Editor](https://editor.swagger.io/)
![](Swagger-Editor.png "Swagger Editor スクリーンショット")

[Stoplight Studio](https://stoplight.io/solutions) / [紹介記事](https://zenn.dev/mizu4ma/articles/07ad3aa05a785d)
![](Stoplight-Studio.png "Stoplight Studio スクリーンショット")

</div>

---

#### OpenAPIドキュメントを書く: 直接書く

メリット:自由度が高い / デメリット:管理と運用が煩雑

* 分散システムなどで仕様を一元管理するケース
* ツールでは対応の難しい複雑なドキュメントを書くケース
* OpenAPIドキュメント単体を一般公開するケース

---

#### OpenAPIドキュメントを書く: サーバサイドに書く

* メリット
  * API仕様はサーバサイドの担当者が書くことが多い
  * URL（ルーティング）はサーバサイドに実装される
  * 型（バリデーション）はサーバサイドに実装される
  * <u>仕様と実装とを一致させやすい</u>
* 対応ツール
  * [L5 Swagger](https://github.com/DarkaOnLine/L5-Swagger) / [Swagger-PHP](https://zircote.github.io/swagger-php/)
  * [Laravel OpenAPI](https://vyuldashev.github.io/laravel-openapi/)

---

#### サーバサイドに書く: L5 Swagger/ Swagger-PHP

```php
// app/Http/Controllers/PhperController.php

##[OA\Get( operationId: 'getPhperById', path: '/phpers/{id}',)]
##[OA\Response(
  response: '200',
  content: new OA\JsonContent(
    properties: [ new OA\Property(property: 'data', type: PhperResource::class) ]
  )
)]
public function show(Phper $phper)
{
  return new PhperResource($phper);
}
```

* 仕様をアトリビュートで宣言。すぐ下に実装。
* APIの仕様と実装とを紐づけ。

---

```php
##[OA\Schema(
  title: 'Phper',
  properties: [
    new OA\Property(property: 'name', type: 'string'),
    new OA\Property(property: 'email', type: 'string', format: 'email'),
    new OA\Property(property: 'birthdate', type: 'string', format: 'date-time'),
  ],
  required: ['id', 'name', 'email', 'birthdate'],
)]
class PhperResource extends JsonResource
{
  public function toArray(Request $request): array
  {
    return [
      'name' => $this->resource->name,
      'email' => $this->resource->email,
      'birthdate' => $this->resource->birthdate->toIso8601String(),
    ];
  }
}
```

* 仕様をアトリビュートで宣言。すぐ下に実装。
* レスポンスの型定義（仕様）と生成（実装）とを紐づけ。

---

#### サーバサイドに書く: [Laravel OpenAPI](https://vyuldashev.github.io/laravel-openapi/)

phpコードで型を実装。

```php
public function build(): Schema
{
  $properties = [
    /* 省略 */
    Schema::string('status')->description('ステータス')
      // OpenAPIドキュメント上のenumをPHPのenumから自動生成
      ->enum(...Arr::pluck(PhperStatus::cases(), 'value'))
      ->example(PhperStatus::default())
      ->description(
        implode(' / ', Arr::map(
          PhperStatus::cases(),
          fn ($status) => "{$status->value}:{$status->display()}"
        )),
      ),
  ];

  return Schema::object('Post')
    ->properties(...$properties)
    ->required(...$properties);
}
```

利用例:

* OpenAPIの`enum`をPHPの`enum`から自動生成
* `example`や`description`などメタデータを自動生成
* `properties`と`required`を連動させる

---

```php
/**
 * @param class-string<Schema> $schema
 */
public static function
  wrapSchemaWithData(string $schema): Schema
{
  return Schema::object()
    ->required('data')
    ->properties($schema::ref('data'));
}
```

```php
public function build(): Response
{
  return Response::ok()
    ->content(
      MediaType::json()->schema(
        Utils::wrapSchemaWithData
          (PostSchema::class)
      )
    );
}
```

利用例:

* 頻出パターン「`data`属性でのラップ」を共通化

---

```php
/**
 * @param class-string<Schema> $schema
 */
public static function
  wrapSchemaWithPagination(string $schema): Schema
{
  $properties = [
      Schema::array('data')->items($schema::ref()),
      Schema::integer('total'),
      Schema::integer('per_page'),
      Schema::integer('current_page'),
      /* 省略 */
  ];

  return Schema::object()
    ->required(...$properties)
    ->properties(...$properties);
}
```
利用例:

* ペジネータが生成するオブジェクトと同じ型を動的に生成するユーティリティ関数

---

#### フロントエンド開発

##### ドキュメントや開発ツールの自動生成

<div class="post-flex">

  [GitHub REST APIのOpenAPIドキュメント](https://github.com/github/rest-api-description)から
  ![](OpenAPIドキュメント-GitHub.png "GitHubリポジトリ github/rest-api-description")

  RedoclyでAPI仕様書を自動生成。
  ![](Redocly-GitHub.png "GitHub REST API OpenAPIをRedoclyで仕様書に変換")

</div>

---

OpenAPIドキュメントから生成されたAPI仕様書が一般公開されている例:

<div class="post-flex">

![](Redocly-GMOPG.png "PGマルチペイメントサービス OpenAPIタイプ 仕様書")

* [PGマルチペイメントサービス OpenAPIタイプ](https://static.mul-pay.jp/doc/openapi-type/)
* API仕様書から元のOpenAPIドキュメントを取り出せる。

</div>

----

[Swagger UI](https://swagger.io/tools/swagger-ui/)によるブラウザからのテストリクエスト

<div class="post-flex">

![](Swagger-UI-ATF.png "Swagger UI オペレーションIDの一覧表示")

![](Swagger-UI-テストリクエスト.png "Swagger UIからのテストリクエスト送信")

</div>

---

##### ドキュメント生成コマンド例

```bash
## ファイル名 `schema.json` は適宜読み替え

$ npx -y @redocly/cli@latest build-docs schema.json
```

---

##### クライアントライブラリ自動生成

TypeScript用クライアントライブラリ - `typescript-fetch`

```yaml
phper:
  type: object
  properties:
    # 省略

    registerdAt:
      type: string
      format: date-time
    status:
      type: string
      example: approved
      enum:
        - placed
        - approved
        - delivered
```

```ts
export function PhperFromJSONTyped(json: any, ignoreDiscriminator: boolean): Phper {
  if ((json === undefined) || (json === null)) {
    return json;
  }
  return {
    // 省略
    'registerdAt': !exists(json, 'registerdAt') ? undefined : (new Date(json['registerdAt'])),
    'status': !exists(json, 'status') ? undefined : json['status'],
  };
}
```

* 日時の自動変換。
* enumの自動生成。

---

```ts
export const PhperStatusEnum = {
  Available: 'available',
  Pending: 'pending',
  Sold: 'sold'
} as const;
export type PhperStatusEnum = typeof PhperStatusEnum[keyof typeof PhperStatusEnum];
```

---

```ts
class PhperApi {
  async getPhperById( // 1つのエンドポイントに対して1つのメソッド
    requestParameters: GetPhperByIdRequest, // リクエストの型が定義されている
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<Phper> { // レスポンスの型も定義されている
    const response = await this.getPhperByIdRaw(requestParameters, initOverrides);
    return await response.value();
  }
}
```

* OpenAPIドキュメントのタグ毎にクラスが作成される。
* エンドポイント（オペレーションID）がメソッドになる。
* それに対しリクエストと成功時レスポンスが型付けされる。

---

PHP用クライアントライブラリ - `php`

```php
class PhperApi
{
  /**
   * @return \OpenAPI\Client\Model\Phper|\OpenAPI\Client\Model\ErrorResponse
   */
  public function getPhperById($phper_id, string $contentType = self::contentTypes['getPhperById'][0])
  {
    list($response) = $this->getPhperByIdWithHttpInfo($phperId, $contentType);
    return $response;
  }
}
```

* クラス（タグ）とメソッド（オペレーションID）は`typescript-fetch`と同じ構造
* 型はクラスに変換され、レスポンスはそのインスタンス。
* エラーを含む返却されうる全ての型がUnion Typesで表現される。

---

##### クライアントライブラリ自動生成: [対応言語一覧](https://github.com/OpenAPITools/openapi-generator?tab=readme-ov-file#overview)

<div class="post-flex">

![](OpenAPI-Generator-クライアント生成可能言語.png "Swagger Generator クライアント生成言語一覧")

* プログラム言語  
  PHP, TypeScript, JavaScript, Ruby, Go, Java, Objective-C, Kotlin, etc.
* ライブラリ  
  Angular, jQuery, RxJS, etc.
* フレームワーク  
  NestJS, etc.
* ツール  
  JMeter, etc.
* シェル  
  bash, Power Shell, etc.
* SaaS  
  Zapier, etc.

</div>

---

##### クライアントライブラリ生成コマンド例

```bash
## ファイル名 `schema.json` は適宜読み替え
## `typescript-fetch` の箇所で生成するライブラリの言語を指定

$ docker run --rm \
  -v $PWD/schema.json:/in.json \
  openapitools/openapi-generator-cli:latest-release \
    generate -i /in.json -g typescript-fetch
```

---

##### 実装例

```ts
// src/states/atoms/phper.ts

import { atom } from "recoil";
import type { Phper } from "@/lib/openapi";

// OpenAPIドキュメントが提供するモデルをそのままRecoilStateとして利用
export const phperState = atom<Phper | null>({
  key: "phper",
  default: null,
});
```

* OpenAPIドキュメントが提供するスキーマを状態管理の型として直接利用<u>しても良い</u>。
* レスポンスを利用<u>してはいけない</u>。レスポンスはスキーマをラップ<u>すべき</u>。

---

```ts
// src/hooks/use-login.ts

export const useLogin = () => {
  const setPhper = useSetRecoilState(phperState);

  apiClient.getMyPhper().then((result) => {
    // サーバからのレスポンスをそのまま状態として管理
    setPhper(result.data);
  });
};
```

* レスポンスから取り出したスキーマを状態へ直接代入。
  * `result`: レスポンス / `result.data`: モデル（スキーマ）

<u>フロントエンドにHTTPを意識させない。</u>

---

#### サーバサイド開発

##### リクエストバリデーション

```php
public function handle(Request $request, \Closure $next): Response {
  $psrRequest = $this->psrHttpFactory->createRequest($request);

  try {
    $operationAddress = $this->schemaRepository->getRequestValidator()->validate($psrRequest);
  } catch (ValidationFailed $validationFailed) {
    // バリデーション失敗時は400 Bad Requestを返却
    abort(400, 'リクエストの形式に誤りがあります。');
  }

  // 成功時のみ次の処理に進む
  return $next($request);
}
```

* OpenAPIドキュメントに定義されたリクエスト型をバリデーションに利用。
* 以上の実装をミドルウェアで全ルートに一括適用。

---

##### バリデーション対象

[バリデーションとは (validation)： - IT用語辞典バイナリ](https://www.sophia-it.com/content/%E3%83%90%E3%83%AA%E3%83%87%E3%83%BC%E3%82%B7%E3%83%A7%E3%83%B3)  

> バリデーションとは、入力されたデータが、あるいはプログラミング言語やマークアップ言語の記述が、規定された文法に即して、または **要求された仕様にそって、適切に記述されているかどうかを検証すること** である。

バリデーションが必要な値とは？

* 外部から入力された値
* <u>信頼できない値</u>

---

##### 「信頼できない値」とは？  

**自分の書くプログラムに、**  
**絶対の信頼を持てますか？**

---

##### 仕様外レスポンスの先で、何が起きているか？

* `Uncaught TypeError: Cannot read properties of undefined (reading 'hoge')`
  * 一瞥するとフロントエンドのバグ
  * 現にレスポンスコードは200 OK
  * 原因は実はサーバ側
* 開発中、想像以上の調査時間を要している。
* 本番環境で発生していても、知る術が無い。

---

##### レスポンスバリデーションによるエラーの早期発見

###### NG例: 通常のAfter Middleware

[Middleware - Laravel 10.x - Middleware and Responses](https://laravel.com/docs/10.x/middleware#before-after-middleware)

> this middleware would perform its task after the request is handled by the application:

```php
public function handle(Request $request, Closure $next): Response
{
  $response = $next($request);

  // Perform action

  return $response;
}
```

標準の方法では、次のケースに対応できない:

* `throw new HttpException($status)` でエラーを返却するケース
  * `abort($status)` ヘルパーの場合も同様
* アプリケーションがクラッシュしたケース
* レスポンスの生成を遅延するケース
  * `StreamedResponse` / `StreamedJsonResponse` / `BinaryFileResponse`

---

###### OK例: レスポンスイベントのフック

```php
public function handle(Request $request, \Closure $next): Response {
  /* 省略 */

  // ミドルウェアでの処理終了時にレスポンスイベントへのフックを登録
  Event::listen(RequestHandled::class, function (RequestHandled $event) use ($operationAddress) {
    $psrResponse = $this->psrHttpFactory->createResponse($event->response);

    try {
      $schemaRepository->getResponseValidator()->validate($operationAddress, $psrResponse);
    } catch (ValidationFailed $validationFailed) {
      // 省略: レスポンスバリデーション失敗: ログや500エラー
    }
  });
}
```

Middleware Pipelineの外側の処理のため通常とは異なる方法でレスポンスを生成する必要がある点に注意

---

#### フロントとサーバの "辛くない" 統合

##### スキーマの破壊的変更

OpenAPIドキュメントの変更がフロントエンドに対して破壊的変更をもたらすことがある。

* OpenAPIドキュメントのバージョンがフロントとサーバとで一致しない場合:
  * フロント側では問題なくビルドが通るコード（リクエスト）に対し、サーバは`400 Bad Request`を返却してしまう。
  * 返却されたレスポンスを正しく認識できず、値の欠落等が発生する。
* フロント側でバージョンアップを行った場合:
  * 型の変更が原因となりビルドエラーが発生する。

---

Q. クライアントライブラリ（自動生成）の運用
A. IMO: 生成結果ごとフロントエンドへcommit

理由:

* <u>破壊的変更を受け入れるタイミング</u>をフロントエンドが任意に決められる。
* ブランチに応じて新旧双方のバージョンを<u>即座</u>に切り替えられる。

---

##### 破壊的変更の発生条件

| 変更内容 | 更新（修正）前の挙動 | エラー |
|-|:-:|:-:|
| プロパティの追加 | *追加された型を認識できない* | 
| プロパティの削除・名前変更 | **Property does not exists** | ビルド時 |
| `{nullable: true}` を `false` へ | *-* | - |
| `{nullable: false}` を `true` へ | **'foo.bar' is possibly 'null'** | ビルド時 |
| `{required: true}` を `false` へ | *-* | - |
| `{required: false}` を `true` へ | **'foo.bar' is possibly 'null'** | ビルド時 |
| 型の変更 | **Property does not exists** | ビルド時 |
| オペレーションIDの変更 | **Property does not exists** | ビルド時 |
| URLの変更 | **404エラー** | **実行時** |

---

条件を予め知っておくことで、発生の際の対応も容易になる。

* 型の範囲を**狭める**のは**OK**。
* 型の範囲を**広げる**のは**NG**。
* 型を**変更する**のは**NG**。
* **URL変更**は**実行時エラー**。

---

##### 破壊的変更への対応（移行期間）

OpenAPIドキュメントで`deprecated`を宣言し

```php
$properties = [
  // 変更前: updated_at
  Schema::string('updated_at')->format('date-time')
    ->deprecated() // 旧プロパティ名にdeprecatedを付与
    ->description('lastLoggedInAtを利用してください。'), // コメントで新プロパティへ誘導

  // 変更後: last_logged_in_at
  Schema::string('last_logged_in_at')
    ->description('最終ログイン日時日時')
];
```

<div class="post-flex">

![](VSCode-Deprecated.png "DocBlock中の@deprecatedがエディタのUIで打消線表示されている")

* OpenAPIドキュメントに deprecatedタグを付与することで、
* クライアントライブラリのDocBlockそれが付与され、
* 多くのエディタで、打ち消し線と共に非推奨として表示される。

</div>

---


<div class="post-flex">

```json
// .eslintrc.json

"extends": [
  "plugin:deprecation/recommended"
],
"rules": {
  "deprecation/deprecation": "warn"
}
```
* [eslint-plugin-deprecation](https://github.com/gund/eslint-plugin-deprecation)で`deprecated`を自動検出
* 任意タイミングで修正し、
* サーバサイドより旧仕様を削除。

</div>

```bash
$ npx eslint src

/path/to/src/hooks/use-login.ts
  48:9  warning  'updatedAt' is deprecated. deprecation/deprecation
```

---

##### 破壊的変更への対応（同時修正）

*サーバの変更とフロントの修正を同時にプッシュ*

* 要修正箇所は、TypeScriptが教えてくれる。
* 多くの場合、修正は単純な書き換えのみ。
* サーバ担当者は、変更内容を把握している。

破壊的変更への対応はサーバ担当者が行うのも選択肢

---

##### `nullable` を避ける

* `nullable: true` や `required: false` に細心の注意
* `nullable` はデフォルトで `false`。問題ない。
* `required` はデフォルトで `false`。明示的に `true`にする必要がある。
  * Lintによる機械的な対応がお勧め。

仕様上はnullable、実質的になnot nullというプロパティがあると:

* フロントエンドでは「nullを握りつぶす対応」が必要になる。
* 常態化すると、不適切な握りつぶしが横行する。

<u>スキーマ駆動開発を導入したメリットの多くを失う。</u>

---

##### 活用先の仕様を把握

*採用ツールに応じて自動生成のカバー範囲が異なる*

* 成功レスポンスのみ定義するか？失敗レスポンスも必要か？
  * 苦労して失敗レスポンスを書いたがクライアントライブラリで使われていない、という例
* `@example` を書くか？
  * 多くのテストツールでフォームのデフォルト入力値として使われる。
  * <u>推奨: ログインAPIの@exampleに開発用ユーザーのログイン情報を記入</u>
* `@examples` まで書くか？
  * フロントエンド側でモックサーバを立てる場合はこの値が使われる。
* ドキュメントやIDEでの表示を確認
  * MarkdownやHTMLの解釈がツールによって異なる。

*生成結果のコードに最低限目を通すことを推奨*

---

##### 名付けとモデリング

* オペレーションIDはクライアントライブラリ上のメソッド名として使われる。
* スキーマ名はクライアントライブラリ上の型名として使われる。

**<u>名付け</u>に細心の注意**

* フロントエンド以外を含むシステムの広範で使われる。

**サーバサイドに閉じない<u>モデリング</u>**

* これらへ準拠により、多くの破壊的変更を回避できる。

**これらのベストプラクティスは<u>RESTish API</u>と相性が良い**

---

##### CIの活用

```yaml
steps:
 
  # Laravelアプリケーションのセットアップ・省略
 
  - name: OpenAPIドキュメントを出力
    run: ./artisan openapi:generate > schema.json
 
  - name: クライアントライブラリを生成できるか？
    run: |
      docker run --rm \
        -v $PWD/schema.json:/in.json \
        openapitools/openapi-generator-cli:latest-release \
        generate -i /in.json -g typescript-fetch
 
  - name: ドキュメントを生成できるか？
    run: npx -y @redocly/cli@latest build-docs schema.json
 
  # 必要に応じてOpenAPIドキュメントのLintなど
```

ツール毎にOpenAPIドキュメントの解釈が若干異なる:

* 誤ったOpenAPIドキュメントが生成されてしまうケース。
* あるツールは問題なく動作するが別のツールはクラッシュ、というケース。

プロジェクト固有の型ルール:

* 機械的に準拠を確認したい。

サーバサイドのCIでツールの動作やLint結果を確認

---

##### エラー原因の提供

バリデーションの目的

* データの正確性
* セキュリティ向上
* UX向上
* ~~エラーの早期発見~~  
  エラー**とその原因**の早期発見

---

> * 200番台のステータスコードで仕様外のレスポンスを返却することは、決してありません。  
> * 400だった場合は、フロントの実装に誤りがあります。自分のコードを見直してください。  
> * 500だった場合は、原因はバックエンドです。レスポンスにデバッグ情報が含まれるので、それを下さい。  

---

```json
{
  "title": "InvalidBody",
  "status": 500,

  // エラー理由
  "detail": "Keyword validation failed: Value cannot be null",

  // エラー位置
  "pointer": [ "data", "status" ],

  // オリジナルのレスポンス
  "originalResponse": {
    "data": {
        "id": 42,
        "status": null, // ←ここが原因
        "name": "tomzoh",
        "content": "PHPerKaigi"
    }
  }
}
```

* 400エラーの理由を、不足なくフロント担当者に伝える（エラーレスポンス）
* 500エラーの理由を、容易に知れるようにする（ログ・エラーレスポンス）

---

> * 「200番台のステータスコードで仕様外のレスポンスを返却することは、決してありません。」
> * 「400だった場合は、フロントの実装に誤りがあります。自分のコードを見直してください。」
> * 「500だった場合は、原因はバックエンドです。レスポンスにデバッグ情報が含まれるので、それを下さい。」

以上の約束が、<u>強制</u>的に守られる。

---

#### リリース後の品質向上

```php
try {
  $schemaRepository->getResponseValidator()->validate($operationAddress, $psrResponse);
} catch (ValidationFailed $validationFailed) {
  Log::warn(
    'レスポンスバリデーション失敗',
    [
      'error' => $validationFailed,
      'request' => $request,
      'response' => $response,
    ],
  );
  // キャッチした例外は、ログに残すがリスローはしない
}
```

本番リリース後も仕様外レスポンスを追跡:

* クラッシュさせずログに残しアラートと連携。
* 開発時と同じようにエラーとする。
* 十分に安定した場合、バリデーションを外しても良い。
  * 巨大レスポンスをバリデーションする際のスループットへの配慮。

---

### PR: [Laravel OpenAPI Validator](https://packagist.org/packages/kentaroutakeda/laravel-openapi-validator)

#### 登壇者の作成したOpenAPIバリデーションライブラリ:

* 本トーク内「スピードと品質の両立」コンセプト。
* 資料中のサーバ側実装のほとんどは、このライブラリで実際に使われている。

#### 主要な機能:

* Laravel OpenAPI又はL5 Swagger導入済の場合、ゼロコンフィグで導入可能。
  * それ以外の場合も、十数行のコードで統合が可能。
* バリデーションの対象やレベル、違反時の挙動をルート毎に設定可能。
* 開発効率の向上を目的とした、豊富なログとそのカスタマイズ。
* オプション機能として、Swagger UI でのAPIの表示に対応。

#### 紹介記事:  
[Laravelパッケージ「Laravel OpenAPI Validator」 - OpenAPIドキュメントによる透過的バリデーション](https://no-hack-no.life/post/2024-02-01-introduce-laravel-openapi-validator/)

---

### まとめ

* APIファーストが生む困難
  * 仕様書の解釈の余地
  * 仕様書の冗長化に過ぎない実装
  * 仕様管理やコミュニケーションコスト
* 仕様管理における課題
  * 争いのない仕様と間違えにくい道具
  * 秩序の強制とコントロール
  * OpenAPIにより品質の向上を機械的に実現
* スピードと品質との両立
  * 目的やプロジェクト要件に合ったツール選定や統合
  * 破壊的変更のコントロール
  * バリデーションの意味や目的と自動化
  * 開発時やリリース後の品質向上

---

スキーマ駆動開発は非常に強力な開発手法です。

* API仕様とサーバ実装が確実に一致し、クライアントライブラリは自動生成されます。
* フロントエンドは型システムの力により、「サーバ」を意識せずに開発が可能です。
* 「APIの繋ぎ込み」タスクや結合テスト時の問題切り分けが不要になります。

<!-- textlint-enable -->
