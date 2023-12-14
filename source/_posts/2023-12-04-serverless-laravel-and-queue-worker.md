---
title: Serverless Laravel - Laravel Queue Workerの構築から学ぶBrefとAWS Lambda
date: 2023-12-04 00:00
ogimage: ogimage.png # TODO 過去の画像ファイル名 `eyecache` を適当なタイミングで削除
tags:
  - PHP
  - Laravel
  - AWS Lambda
  - Bref
---

この記事は [Laravel Advent Calendar 2023](https://qiita.com/advent-calendar/2023/laravel) 4日目の投稿です。

3日目の記事は [@yoshiki_utakata](https://twitter.com/yoshiki_utakata) さんの [AWS CloudWatch Logs 向けに Laravel のログを JSON で出力する方法](https://www.utakata.work/entry/laravel/aws-cloudwatch-logs-json) でした。AWSを題材とした記事が2日続きます。偶然にも、この記事の中でもCloudWatch logsのJSON出力を利用した動作サンプルが登場しますので、前提技術を詳しく知りたい方は昨日の記事も是非ご覧ください。

{% linkPreview https://www.utakata.work/entry/laravel/aws-cloudwatch-logs-json _blank %}

## 背景

サーバレスPHPがにわかに脚光を浴びている。[Bref](https://bref.sh/) の登場によりAWS LambdaでPHPをいとも簡単に動かせるようになった。 **[Bref Laravel Bridge](https://github.com/brefphp/laravel-bridge) を使えばLaravelアプリケーションのAWS Lambdaへのデプロイも可能だ。**

AWS Lambdaの特性として、Webアプリケーションにはつきものと言えるアクセス数の急増に対するスケール性能の高さが挙げられる。だが筆者は、Webアプリケーションではなく [キューワーカー](https://laravel.com/docs/10.x/queues#running-the-queue-worker) の代替としての利用が、AWS Lambdaの本当の真価を発揮すると考えている。

なぜキューワーカーなのか、Brefは何を解決しているのか、そもそもサーバレスとは何か、LaravelやBrefのコードを交えながらこの記事で述べていきたい。

## 通常の非同期キュー

まず、Laravelが標準で提供する通常の非同期キューの動作をおさらいする。

1. Laravelアプリケーションは、 `dispatch(function(){...})` や `FooBarJob::dispatch()` などを使い、実行すべきジョブをキューに投入する。
2. 実行すべきジョブは、キューのドライバによって *何らかの* ストレージに保存される。ストレージとしては *Database / Redis / Beanstalkd / **Amazon SQS*** を利用できる。
3. Webサーバとは別に実行されているキューワーカーは、このストレージをポーリングで監視している。
4. ポーリングがジョブの投入を検知次第、それらを逐次実行する。

ジョブの実行はあくまで逐次、つまり直列だ。図にしてみよう。

#### Laravel標準のキューワーカーによるキューの処理

```plantuml
actor ブラウザ
participant Webアプリケーション
database ストレージ
participant キューワーカー

キューワーカー --> ストレージ : ポーリング
キューワーカー --> ストレージ : ポーリング
ブラウザ -> Webアプリケーション : リクエスト
Webアプリケーション -> ストレージ : ジョブ1投入
Webアプリケーション -> ストレージ : ジョブ2投入
Webアプリケーション -> ブラウザ : レスポンス

group 単一のキューワーカーによる直列処理
  |||
  キューワーカー --> ストレージ : ポーリング
  ストレージ -> キューワーカー : ジョブ1取得
  note over キューワーカー : ジョブ1実行

  キューワーカー --> ストレージ : ポーリング
  ストレージ -> キューワーカー : ジョブ2取得
  note over キューワーカー : ジョブ2実行
  |||
end

キューワーカー --> ストレージ : ポーリング
キューワーカー --> ストレージ : ポーリング
|||
```

Webアプリケーションから見ると、確かにジョブは非同期に実行されている。レスポンスは即座に返すこと可能だ。しかし、その先のキューワーカーでの処理は並列には行われない。

「管理画面のボタンを押すと、期間限定シークレットキャンペーンの開始をプッシュ通知で知らせる」という要件を考えてみよう。「全員」とはもしかすると数万人かもしれない。通知する内容は期間限定のキャンペーンだ。つまり、キャンペーンの開始と同時に、できるだけ不平等なく **数万人全員に同時に送る** のが望ましい。

だが、あまりにも多くのジョブが一斉にキューに投入されるとキューの混雑が発生し、全員への送信には長い時間がかかってしまう。キューワーカーを複数起動するやり方も考えられるが、起動した数に応じて、ジョブが存在しない間もポーリングのための無駄なリソースを消費し続ける。

真に急激なスパイクは、ユーザーアクセスが契機とは限らない。

## Amazon SQSによる非同期キューワーカー

Amazon SQSとAWS Lambdaはこの問題を根本から解決する。次の図を見て欲しい。

```plantuml
actor ブラウザ
participant Webアプリケーション
queue SQS as "Amazon SQS"

ブラウザ -> Webアプリケーション : リクエスト
Webアプリケーション -> SQS : ジョブ1投入
Webアプリケーション -> SQS : ジョブ2投入
Webアプリケーション -> SQS : ジョブN投入
Webアプリケーション -> ブラウザ : レスポンス

group キューワーカーの複数起動による並列処理
  |||
  create participant Lambda関数1 as "Lambda関数 1"
  SQS -> Lambda関数1 : ジョブ1通知

  create participant Lambda関数2 as "Lambda関数 2"
  SQS -> Lambda関数2 : ジョブ2通知

  create participant Lambda関数N as "Lambda関数 N"
  SQS -> Lambda関数N : ジョブN通知

  note over Lambda関数1 : ジョブ1実行
  / note over Lambda関数2 : ジョブ2実行
  / note over Lambda関数N : ジョブN実行
  |||
end
```

> *<small>今回は簡単のためSQSがLambda関数へ通知を行っているような図としたが、AWSのアーキテクチャは正確にはこれとは異なる。SQSをイベントソースとするLambda関数の実行も、AWS内部の処理としてはポーリングベースである。</small>*

以上の図は、Laravel標準のキューワーカーと比較して次のような点が異なる。

* ジョブが作成される度に、それを処理するキューワーカーがLambda関数として起動される。
* 複数のジョブに対しては複数のLambda関数が同時に起動される。それらは並列に動作する。
* ジョブの実行が完了すると、それを処理していたLambda関数も速やかに終了する。
* ポーリングはAWSによって自動的に行われる。キューワーカーを常時起動しておく必要は無い。

Lambda + SQS というサーバレス鉄板構成をキューワーカーで導入したいわけだが、 **これはLaravel標準のキューワーカーだけでは実現できない。** これを実現する方法を次のセクションで見ていこう。

> *<small>SQSに詳しい方は、ここまで読んでLaravelのキューワーカーのSQSサポートに対して疑問を感じられたかもしれない。おそらくその疑問は正しい。</small>*
> 
> *<small>LaravelはSQSを、キューイングサービスとしてではなく単なるストレージとしてしか使っていない。この使い方ではSQSの持つスループット性能やスケーラビリティを活かしきれない。単にポーリングのオーバーヘッドを無駄に支払っているだけだ。通常のキューワーカーからSQSドライバを使う動機は無いと言って良いだろう。</small>*

## Bref Laravel Bridgeによる非同期キューワーカー

[動作可能なサンプルリポジトリ](https://github.com/KentarouTakeda/example-serverless-laravel) を用意した。AWSアカウントをお持ちの方は実際に動いているところを確認頂ける。デプロイするとSQSのキュー1つとLambda関数2つが作成される。

### 作成されるリソースの一覧（全て東京リージョン）

| リソース | 名前 | 説明 |
| - | - | - |
| Lambda関数 | `example-serverless-laravel-web-app`	| Webアプリケーション |
| Lambda関数 | `example-serverless-laravel-queue-worker` | キューワーカー | 
| SQSキュー | `example-serverless-laravel-queue` | キュードライバ用SQS |


### サンプルコードの動作確認

> #### 動作要件
> 
> * 実行環境に Node.js, PHP, Composer がインストールされていること。
> * 実行環境に Docker がインストールされていること。
> * CDKを実行可能なアクセスキーが設定されていること。

```sh
# サンプルリポジトリをクローンしディレクトリを移動
git clone https://github.com/KentarouTakeda/example-serverless-laravel.git
cd example-serverless-laravel

# ./app へLaravelアプリケーションをインストール
composer create-project laravel/laravel ./app/

# LaravelアプリケーションにBref Laravel Bridgeをインストール
composer -d ./app/ require bref/bref bref/laravel-bridge

# CDKのインストール
npm install

# Lambda関数やSQSキューの作成とアプリケーションのデプロイ
# プロンプトには全て `y` で答える
node_modules/.bin/cdk deploy

# デプロイしたリソースを全て削除する場合は次のコマンドを実行
# node_modules/.bin/cdk destroy
```

デプロイが成功した場合 *example-serverless-laravel-web-app* というLambda関数が作成されているはずだ。ダッシュボードに表示された「関数URL」へアクセスしLaravelのWelcomeページが表示されることを確認してみよう。

*AWSコンソール → AWS Lambda → 関数 → example-serverless-laravel-web-app*

![Lambda関数ダッシュボード](dashboard-of-web-app.png)

初期状態のLaravelに対して、例えば次のような修正を加えてみる。

```diff app/routes/web.php
 Route::get('/', function () {
+  for($i=0; $i<100; $i++) {
+    dispatch(function(){
+      sleep(3);
+      Log::info('hello');
+    });
+  }
+
   return view('welcome');
 });
```

3秒待った後 `hello` とログに記録するジョブを100個投入するコードを追加した。デプロイは再度 `cdk deploy` を実行する。

デプロイが終わったらWelcomeページをリロードし、暫く経った後CloudWatch logsを確認してほしい。ジョブ事に3秒待たされることなく並列で実行されている様子を確認できる。

*AWSコンソール → CloudWatch → ロググループ → `/aws/lambda/example-serverless-laravel-queue-worker` → すべてのログストリームを検索*

![ジョブが並列実行されている様子をCloudWatch logsで確認](job-parallel-execution-log.png)

ジョブの数が「1,000個」までであれば、上のログと同等またはそれ以上のスケール性能が得られる。これがAWS Lambdaの特性だ。

> <small>*「1,000」という数字はAWS LambdaのLambda関数最大同時実行数のデフォルトの制限値に由来する。これよりも大きなスケール性能が必要な場合、AWSへ [上限緩和申請](https://aws.amazon.com/jp/getting-started/hands-on/request-service-quota-increase/) を行うことが可能だ。*</small>


### 動作原理

ここからは、サンプルコードやBref自体の実装を読みながら、Bref Laravel BridgeやAWS Lambdaの実際の動作を見ていく。

#### Webアプリケーションとしての動作

最初に「Lambda関数URL」へのブラウザアクセスでWelcomeページが表示される点を見ていこう。一見すると何の変哲もないページ表示だが、処理のプロセスが通常のPHPの動作プロセスとは少し異なる。まずはAWS Lambdaの解説をする。

AWS LambdaはブラウザからのHTTPリクエストを受け付けるためだけに設計されたわけではない。SQSへのキュー投入によってLambda関数をトリガーする例は既に示したが、他にも、S3, DynamoDB, EventBridgeなど様々なAWSサービスのイベントからLambda関数をトリガーできる。

どのAWSサービスの何のイベントからトリガーされたのかに応じて、Lambda関数にはそれぞれのイベントに応じた形式の入力がPOSTリクエストで渡される。例えばWebページを表示するためのHTTPリクエストは、次の形式で表現される。

[Amazon API Gateway で AWS Lambda を使用する - AWS Lambda - イベント形式](https://docs.aws.amazon.com/ja_jp/lambda/latest/dg/services-apigateway.html#apigateway-example-event)


```json API Gateway v2 Request（抜粋）
{
  "resource": "/",
  "path": "/",
  "httpMethod": "GET",
  "requestContext": {
  "resourcePath": "/",
  "httpMethod": "GET",
  "path": "/Prod/",
  ...
  },
  "headers": {
  ...
  },
  "queryStringParameters": null,
  ...
}
```

フレームワークを使わず素のPHPでWebアプリケーションを書いた方であれば、`$_GET` からクエリを取り出したことがあるだろう。Lambda関数の中ではそれに相当する値が `$_GET` ではなく `$_POST['queryStringParameters']` に格納されていることが、上のjsonから見て取れる。

LaravelやSymfonyでのHTTPリクエストを扱う場合 `$_GET` や `$_POST` は使わず `$request` から取り出しているはずだ。これはフレームワークが予め `$_GET` や `$_POST` を `$request` 詰め替える処理を行ってくれているためだ。具体的には[次のコード](https://github.com/symfony/symfony/blob/v6.2.14/src/Symfony/Component/HttpFoundation/Request.php#L290-L305)がそれを行っている。

```php Symfony\Component\HttpFoundation::createRequestFromFactory()
public static function createFromGlobals(): static
{
  $request = self::createRequestFromFactory($_GET, $_POST, [], $_COOKIE, $_FILES, $_SERVER);

  // 省略

  return $request;
}
```

つまり、上のコードと同等の処理を `$_GET` や `$_POST` からではなく[Lambda独自形式のパラメータから行う](https://github.com/brefphp/laravel-bridge/blob/master/src/Http/SymfonyRequestBridge.php#L12-L35)ことで、LaravelやSymfony向けに作られたWebアプリケーションをLambda関数として動作させることができるというわけだ。

```php Bref\LaravelBridge\Http\SymfonyRequestBridge::convertRequest()
// `$event` / `$context` へはLambda関数への入力がそのまま渡される。
public static function convertRequest(HttpRequestEvent $event, Context $context): Request
{
  // Lambda関数に入力されたイベントを PSR-7 HTTP Messageへ変換
  $psr7Request = Psr7Bridge::convertRequest($event, $context);

  // PSR-7 HTTP MessageをSymfony Requestへ変換
  $httpFoundationFactory = new HttpFoundationFactory();
  $symfonyRequest = $httpFoundationFactory->createRequest($psr7Request);

  // 省略

  return $symfonyRequest;
}
```

Lambda関数URLから入力されたAPI Gateway v2 RequestイベントをSymfony Requestへ変換し、それをLaravelの `$request` として扱っている。ここまでがBref Laravel Bridgeの基本的な動作だ。

#### キューワーカーとしての動作

ここからがようやく本題だ。

HTTPリクエスト以外にも様々なイベントでLambda関数をトリガーできることは既に述べた。このイベントには、Laravelのキューワーカーのドライバが対応しているSQSキューも含まれる。

言い換えると、 `$event` へ入力がSQSからのものだった場合、それをキューワーカーに渡すことで、Lambda関数として動作するキューワーカーを実装できるというわけだ。このキューワーカーは、Laravel標準のそれと比較し次のような違いがある。

| | 通常のキューワーカー | イベント駆動キューワーカー |
| - | - | - |
| 起動 | `artisan queue:work` で常時起動 | イベント駆動でその都度起動 |
| ジョブ取得 | キューワーカー自身がストレージから読み取る | Lambda関数にパラメータとして入力される |
| ジョブ完了 | ポーリングを継続する | その場で終了する |

後者の方が、AWSが勝手に起動してくれる上に処理が終わったらその場で終了すれば良いだけなので、動作は単純そうだ。

ただし、 `artisan queue:work` は常時起動からジョブ取得と実行までの全ての機能を兼ね備えてしまっているため、このままでは使えない。ジョブ実行の機能だけ切り離し、他の部分はBref Laravel Bridgeに処理させることになる。

ここまで長々と書いたが、ユーザーが何らかコードを書く必要く無い。以上の機能は Bref Laravel Bridge に既に実装されている。順に見ていこう。

1. Amazon SQSからLambda関数へイベントがトリガーされる
   * [Amazon SQS 標準キューメッセージイベント](https://docs.aws.amazon.com/ja_jp/lambda/latest/dg/with-sqs.html#example-standard-queue-message-event) が入力される
     ```json
     {
       "Records": [
         {
           "messageId": "059f36b4-87a3-44ab-83d2-661975830a7d",
           "body": "Test message 1",
           // 省略
         },
         {
           "messageId": "2e1424d4-f796-459a-8184-9c92662be6da",
           "body": "Test message 2",
           // 省略
         },
         ...
       ]
     }
     ```
   * HTTPリクエスト（API Gateway v2 Request）と異なり、1つの `event` に複数の `Record` が含まれている点に注目
2. Brefがそれを受け取り評価する
   * [Bref\Event\Sqs\SqsHandler::handle()](https://github.com/brefphp/bref/blob/2.1.9/src/Event/Sqs/SqsHandler.php#L19-L40)
     ```php
     public function handle($event, Context $context): array | null
     {
       $this->handleSqs(new SqsEvent($event), $context);
       // 省略
     }
     ```
3. Bref Laravel Bridgeが `event` 中のそれぞれの `Record` をLaravelへ渡す
   * [Bref\LaravelBridge\Queue\QueueHandler::handleSqs()](https://github.com/brefphp/laravel-bridge/blob/2.2.0/src/Queue/QueueHandler.php#L83-L95)
     ```php
     foreach ($event->getRecords() as $sqsRecord) {
       // 省略
       $worker->runSqsJob(
         $job = $this->marshalJob($sqsRecord),
         $this->connection,
         $this->gatherWorkerOptions($timeout),
       );
       // 省略
     }
     ```
   * 複数の `Record` に対応できるようループ処理を行っている点に注目
   * ループ内の `$worker` はLaravelのキューワーカーの実体である

以上が、SQSに投入されたジョブをAWS Lambdaが受け取り、それをLaravelのキューワーカーへ受け渡すまでの処理の流れだ。ジョブを実行するコアの部分の機能を除き、 `artisan queue:work` の動作のほとんどをAWS LambdaとBrefが代行していることが分かる。

AWS Lambdaのスケール特性により、以上の処理が事実上無制限にスケールしていくというわけだ。

## Next Step

実はここまでの説明で、Bref Laravel BridgeのみならずAWS Lambdaやサーバレスアーキテクチャにおけるイベント駆動設計の概要は一通り網羅されている。そしてAWS Lambdaは、キューワーカーとしての利用以外にも、そのスケール特性やコストパフォーマンスを活かした多くのユースケースが考えられる。

この記事を読んでBrefやAWS Lambdaに興味を持ってくださった方のために、参考となりそうな資料やヒントを示す。必要に応じて活用頂きたい。


###  [他のサービスで AWS Lambda を使用する - AWS Lambda](https://docs.aws.amazon.com/ja_jp/lambda/latest/dg/lambda-services.html)

どのようなサービスからAWS Lambdaを利用できるか（＝Lambda関数のイベントソースに何を設定できるか）を一覧で示している。

これから作ろうとしているアプリケーションで「Webアプリが AWS *Hoge* に対して *Fuga* した際は必ず *Piyo* を実行する」という要件があった場合、この一覧を見て *Hoge* をイベントソースとして利用できるか確認すると良い。

利用できる場合 *Piyo* をBrefでAWS Lambda上に構築することを検討できる。 *Fuga* がイベントとして入力されるLambda関数を実装すれば良いわけだ。

### [Brefがサポートするイベントハンドラの一覧](https://github.com/brefphp/bref/tree/master/src/Event)

Bref Laravel Bridgeが *Laravel用* としてサポートするイベントハンドラに加え、Laravelに限らないPHP（Bref）全般で利用可能なイベントハンドラの一覧を示している。

S3Eventなどはもはや定番だろう。例えば、WebアプリケーションがS3に画像ファイルをアップロードする度にそのサムネイル画像をAWS Lambdaがそのサムネイルを作成、このようなLambda関数は `Bref\Event\S3\S3Handler` のサブクラスとして実装が可能だ。

### 本記事で取り扱っているサンプルコード（CDK in TypeScript）

AWSの設定やアプリケーションのデプロイは `lib/bref-laravel-stack.ts` に書かれている。CDKはこの記事の本題から外れるため解説は行わないが、十分な量のコメントを残した。AWSの構成を変えて試したい場合はこのコードを修正することになる。

CDKからデプロイ出来るBrefのLambda関数は3種類ある点に注意。いずれも `handler` で設定したphpファイルやクラスを実行するが、その実行方法が異なる。

* `PhpFpmFunction`  
  * PHP-FPMを利用したWebアプリケーションとして実行する。
  * 通常はフレームワークが提供するindex.phpを指定する。
* `PhpFunction`
  * ファイル内でReturnされる関数を実行する。
  * クラス（Brefによるハンドラまたはそのサブクラス）を指定した場合、それを関数ハンドラとして実行する。  
    Laravel BridgeやSymfony Bridgeを使っている場合DIの解決もBrefが行う。
* `ConsoleFunction` *サンプルコードでは未使用*  
  * `php` コマンドを利用したコンソールアプリケーションとして実行する。

### [Node.js の AWS Lambda 関数ハンドラー - AWS Lambda](https://docs.aws.amazon.com/ja_jp/lambda/latest/dg/nodejs-handler.html)  

Brefを通じてではなく素の状態でAWS Lambdaを利用することで、より幅広い実装パターンを身につけるチャンスを得られる。

この記事の読者層である PHPer / Laravelist の多くは JavaScript を多少なりとも書いたことがあるだろう。従ってまずは Node.js ランタイムでAWS Lambdaを触ってみるのが早道だ。

参考までに `vendor/bin/bref init` によって提供される `Event-driven function` の雛形とAWSコンソールでLambda関数を作成した際のサンプルコードの対比を示す。

```php vendor/bin/bref initコマンドが生成するPHP向けサンプルコード
<?php declare(strict_types=1);

require __DIR__ . '/vendor/autoload.php';

return function ($event) {
  return 'Hello ' . ($event['name'] ?? 'world');
};
```

```js AWSコンソールが生成するNode.js向けサンプルコード
export const handler = async (event) => {
  // TODO implement
  const response = {
    statusCode: 200,
    body: JSON.stringify('Hello from Lambda!'),
  };
  return response;
};
```

`return` なのか `export` なのかなど言語仕様の違いはあれど、JavaScriptに関する高度な知識はなくとも何らかの実装はできそうだ。

見ての通り、Lambda関数とは、リクエストまたはイベントを受け取りレスポンスまたは処理結果を返すだけのシンプルな実装でしかない。気軽に作れる小さなアプリケーションから、是非とも試してみて欲しい。
