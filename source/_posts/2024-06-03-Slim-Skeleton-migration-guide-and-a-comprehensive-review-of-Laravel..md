---
title: Laravel 11 アプリケーション構造移行ガイド
subtitle: Laravelの基礎をプロジェクトの初期構造から学ぶ
description: Laravel 11新機能 'Slim Skeleton' への移行ガイド。ルーティング、認証、エラー処理などの基本機能の移行方法をステップバイステップで紹介することで、Laravelの基本機能を再確認する絶好の機会も提供。
date: 2024-06-03 20:00
tags:
  - Laravel
  - PHP
---

## はじめに

Laravel 11の新機能に *合理化したアプリケーション構造 "Streamlined Application Structure"* というものがある:

> Laravel 11では、既存のアプリケーションに変更を加えることなく、**新しい**Laravelアプリケーション向けに合理化したアプリケーション構造を導入しました。新しいアプリケーション構造は、Laravel開発者がすでに慣れ親しんでいるコンセプトの多くを保持しながら、よりスリムでモダンなエクスペリエンスを提供することを目的としています。
>
> https://readouble.com/laravel/11.x/ja/releases.html#structure

[該当プルリクエスト](https://github.com/laravel/laravel/pull/6188) で *Slim skeleton* と題されている通り、初期構造が大幅に簡略化されている。

一方、既存のアプリケーションをアップグレードする場合:

> Laravel10アプリケーションをLaravel 11にアップグレードするときに、アプリケーション構造の移行を試みることは**お勧めしません**。Laravel 11はLaravel10のアプリケーション構造もサポートするように注意深く調整してあります。
>
> https://readouble.com/laravel/11.x/ja/upgrade.html#application-structure

アップグレードガイドには非推奨とだけ明記され、移行の方法も直接は示されていない。

そこでこの記事ではまず、古い構造のアプリケーションを *Slim skeleton* に移行する方法を説明する。

移行対象には、Laravelのごく基本的な機能に関する設定が網羅的に含まれる。例えば次のようなものだ:

* ルーティング
* 認証
* エラー処理とロギング
* フォーム入力の処理
* CSRF保護

これら設定の移行を試みることは、Laravelの基本機能を網羅的に確認する1つのきっかけとなるだろう。

そこで移行方法と共に、それぞれの機能の概要的な説明も行う。すぐに移行する予定が無くとも、Laravelの基本を再確認する資料として活用して頂けることを期待したい。

## 新形式概要

個別の移行方法に入る前に、まずは新形式の概要を説明する。このセクションはあくまで概要に留まるため、具体的な方法をすぐ知りたい方は次のセクションへ進んで構わない。

Laravelの多くの機能は、次のような考え方で設計されている。

* デフォルトで「多くのアプリケーションで有用」と考えられる設定が提供される。
* それが要件に合わない場合、必要に応じてカスタマイズする。

Laravel 11でも考え方は変わらないが、やり方が大きく変更された。

* Laravel 10
  1. フレームワーク側のクラスを継承した別のクラスが雛形として **最初から提供される。**
  2. この「雛形」の実装内容を**更新**することでカスタマイズ。

* Laravel 11
  1. 雛形としては **何も提供されない。**
  2. 特定のファイルに変更後の設定を**追加**することでカスタマイズ。

以前の構造では、多くのケースで修正の必要のないファイルも雛形に多数含まれていた。

どう見ても使いそうにないファイルが  `app/Http/Middleware` や `app/Providers` の配下に多く鎮座していることに疑問を抱いた方も多いだろう。それらが一掃された意味で、筆者は今回の変更を歓迎している。

## 移行の概要

### 移行対象の確認

移行は全体的に、次のような考え方になる。

* 雛形を変更した箇所:
  1. その実装を所定の場所に移動し、
  2. 元のファイルは削除。
* 変更していない箇所:
  1. 単に元のファイルを削除。

移行元と移行先はある程度グループ化されている。ここでは概要だけ見ておこう。  
（この表は横スクロールできる）

| 機能 | 移行元 | 移行先 |
| - | - | - |
| [ルートの保護](https://readouble.com/laravel/11.x/ja/authentication.html#protecting-routes) | `app/Http/Middleware/Authenticate.php` | `bootstrap/app.php` |
| 認証済判定 | `app/Http/Middleware/RedirectIfAuthenticated.php` | `bootstrap/app.php` |
| [クッキーと暗号化](https://readouble.com/laravel/11.x/ja/responses.html#cookies-and-encryption) | `app/Http/Middleware/EncryptCookies.php` | `bootstrap/app.php` |
| [メンテナンスモード](https://readouble.com/laravel/11.x/ja/configuration.html#maintenance-mode) | `app/Http/Middleware/PreventRequestsDuringMaintenance.php` | `bootstrap/app.php` |
| [入力のトリムと正規化](https://readouble.com/laravel/11.x/ja/requests.html#input-trimming-and-normalization) | `app/Http/Middleware/TrimStrings.php` | `bootstrap/app.php` |
| [信頼するホストの設定](https://readouble.com/laravel/11.x/ja/requests.html#configuring-trusted-hosts) | `app/Http/Middleware/TrustHosts.php` | `bootstrap/app.php` |
| [信頼するプロキシの設定](https://readouble.com/laravel/11.x/ja/requests.html#configuring-trusted-proxies) | `app/Http/Middleware/TrustProxies.php` | `bootstrap/app.php` |
| [署名付きルートリクエストの検査](https://readouble.com/laravel/11.x/ja/urls.html#validating-signed-route-requests) | `app/Http/Middleware/ValidateSignature.php` | `bootstrap/app.php` |
| [CSRF保護から除外するURI](https://readouble.com/laravel/11.x/ja/csrf.html#csrf-excluding-uris) | `app/Http/Middleware/VerifyCsrfToken.php` | `bootstrap/app.php` |
| [ブロードキャスト](https://readouble.com/laravel/11.x/ja/broadcasting.html) | `app/Providers/BroadcastServiceProvider.php` | `bootstrap/app.php` |
| [ルーティング](https://readouble.com/laravel/11.x/ja/routing.html) | `app/Providers/RouteServiceProvider.php` | `bootstrap/app.php` |
| [タスクスケジュール](https://readouble.com/laravel/11.x/ja/scheduling.html) | `app/Console/Kernel.php` | `routes/console.php` |
| [認可](https://readouble.com/laravel/11.x/ja/authorization.html) | `app/Providers/AuthServiceProvider.php` | `app/Providers/AppServiceProvider.php` |
| [イベントとリスナの登録](https://readouble.com/laravel/11.x/ja/events.html#registering-events-and-listeners) | `app/Providers/EventServiceProvider.php` | `app/Providers/AppServiceProvider.php` |
| [エラー処理](https://readouble.com/laravel/11.x/ja/errors.html#the-exception-handler) | `app/Exceptions/Handler.php` | `bootstrap/app.php` |

### 移動対象の特定

雛形の状態から変更されていないファイルは単に削除すれば良いので、そうでないファイルが「移行」の対象となる。従ってまずは、リストされたファイルの変更の有無を特定しよう。

意味の変わらない変更、コード整形ツールによるコメントの加工やLint対応のためのDocBlockの編集などは「変更なし」として扱う。従ってこの作業は機械に頼らず行う必要がある。移行不要なファイルを間違えて「移行」しても実害はないが、せっかく構造を見直して *Slim* を導入するのだから、この特定は注意深く行っておこう。

ここでは例えば次のような資料が参考になるだろう:

* Laravel 10から11にかけての雛形の変更点  
  https://github.com/laravel/laravel/compare/10.x...11.x
  * 特に「削除」されたファイルに注目。
* Laravel 10時点でのアプリケーション雛形  
  https://github.com/laravel/laravel/tree/10.x
  * この内容と手元のファイルを比較することになる。

### 新形式への対応

多くのファイルは上述の通り「記述を移動」または「削除」するだけだが、構造そのものを変える箇所が2つある。

| 機能 | 移行元 | 移行先 |
| - | - | - |
| [最初のステップ](https://readouble.com/laravel/11.x/ja/lifecycle.html#first-steps) | `bootstrap/app.php` | `bootstrap/app.php` |
| [サービスプロバイダ](https://readouble.com/laravel/11.x/ja/providers.html) | `config/app.php` | `bootstrap/providers.php` |

詳細は後述。ここではひとまず「新形式の雛形を手元のアプリケーションにコピー」とだけしておく。何れも新形式の要となるファイルだ。

## 機能ごとの詳細

ここでは「移行対象の確認」で列挙した機能毎に、移行の詳細と共に、それが何の機能なのか概要を示す。

移行前 `<=10` と移行後 `>=11` の書き方を併記しているので、すぐに移行する予定が無くとも、基本の機能を概要的におさらいする手段としてお役立て頂きたい。

何れの場合も、あくまで網羅的な概要説明のため、詳細が必要な方は日本語ドキュメントへのリンクを参照のこと。

### [最初のステップ](https://readouble.com/laravel/11.x/ja/lifecycle.html#first-steps)

移行の準備として、起動時に最初に読み込まれるファイル `bootstrap/app.php` を新形式に変更する。

このファイルは、通常は一切変更されていないはずだ。旧形式の雛形と手元のファイルを比較しそれが確認できた場合、新形式のファイルで単に上書きすれば良い。

Laravel 10では全く変更する必要のなかったこのファイルは、Laravel 11ではアプリケーション全域の設定を記述するための重要なファイルとなる。後の説明でもこのファイルが多く登場するので、書かれている内容の意味はそこで改めて説明する。

手元の旧形式のファイルが雛形から変更されていた場合はどうすればいいだろう。多くの場合、追記内容を`AppServiceProvider::register()` へ移動することになる可能性が高いが、このファイルの変更に限っては一律の解答が存在しない。

その場合、該当箇所のコミッターから説明を受ける必要があるかもしれない。場合によってはXなどで筆者に質問を頂いても構わない。

### ミドルウェア設定

#### 全体的な考え方

* Laravel 10
  * リクエストのライフサイクルに関わる処理は、Laravelでは[ミドルウェア](https://readouble.com/laravel/11.x/ja/middleware.html)として提供されている。
  * `app/Http/Middleware` 配下には、フレームワーク側のミドルウェアを継承した新たなクラスが用意されている。
  * それらクラスの `protected` なメソッドやプロパティをオーバーライドすることで動作をカスタマイズ。
* Laravel 11
  * ミドルウェア自体は存在するが、その継承クラスがアプリケーション側に自動的に用意されることはない。
  * 設定先は全て `bootstrap/app.php` に集約された。`withMiddleware(function (Middleware $middleware) { ... });` で提供される `$middleware` のメソッドで指定。


#### [ルートの保護](https://readouble.com/laravel/11.x/ja/authentication.html#protecting-routes) / 認証済判定

* 概要
  * ユーザーの認証状態に応じてリクエストを別のルートへリダイレクト。
* Laravel 10
  * `Authenticate::redirectTo(Request $request)` で未認証ユーザーのリダイレクト先を返却。
  * `RedirectIfAuthenticated::handle(Request $request)` で認証済ユーザーのリダイレクトを返却。
* Laravel 11
  * `$middleware->redirectGuestsTo(Request $request) { ... };` でリダイレクト先を返却。
  * `$middleware->redirectUsersTo(Request $request) { ... };` でリダイレクト先を返却。

#### [クッキーと暗号化](https://readouble.com/laravel/11.x/ja/responses.html#cookies-and-encryption)

* 概要
  * クッキーはデフォルトで全て暗号化される。
  * 暗号化から除外するクッキーの名前を指定可能。
* Laravel 10
  * `EncryptCookies::$except` で指定。
* Laravel 11
  * `$middleware->encryptCookies(except: [ ... ]);` で指定。

#### [メンテナンスモード](https://readouble.com/laravel/11.x/ja/configuration.html#maintenance-mode)

* 概要
  * メンテナンスモード時は、デフォルトで全URIが `503 Service Unavailable` を返す。
  * この動作から除外するURIを指定。ワイルドカード表記が可能。
* Laravel 10
  * `PreventRequestsDuringMaintenance::$except` で指定。
* Laravel 11
  * `$middleware->preventRequestsDuringMaintenance(except: [ ... ]);` で指定。

#### [入力のトリムと正規化](https://readouble.com/laravel/11.x/ja/requests.html#input-trimming-and-normalization)

* 概要
  * フォーム入力の冒頭と末尾のホワイトスペースを除去。 `Str::trim()` と同等の処理。
  * 空文字を `null` に変換。 `Str::nullIfEmpty()` と同等の処理。
* Laravel 10
  * `TrimStrings::$except` でトリム処理から除外するのキーを指定。
  * `TrimStrings::skipWhen(function (Request $request) { ... });` で真偽値を返却しトリムの要否を指定。
  * `ConvertEmptyStringsToNull::skipWhen(function (Request $request) { ... });` で真偽値を返却し `null` 変換の要否を指定。
* Laravel 11
  * `$middleware->trimStrings(except: [ ... ]);` でコールバックの配列を指定。
  * `$middleware->convertEmptyStringsToNull(except: [ ... ]);` でコールバックの配列を指定。

#### [信頼するホストの設定](https://readouble.com/laravel/11.x/ja/requests.html#configuring-trusted-hosts)

* 概要
  * 特定のホストを宛先とするリクエストのみを許可。
* Laravel 10
  * このミドルウェアは初期状態では無効。有効化する場合 `app/Http/Kernel.php` で `TrustHosts::class` をアンコメント。
  * `TrustHosts::hosts()` からの返却で宛先として許可するホスト名を配列で指定。
  * 配列に `$this->allSubdomainsOfApplicationUrl()` を追加することで `APP_URL` のサブドメインも許可。 
* Laravel 11
  * 明示的に有効化する必要はない。
  * `$middleware->trustHosts(at: [ ... ]);` で許可するホスト名を指定。
  * `APP_URL` のサブドメインもデフォルトで許可。変更する場合 `trustHosts()` への入力に `subdomains: false)` を追加。

#### [信頼するプロキシの設定](https://readouble.com/laravel/11.x/ja/requests.html#configuring-trusted-proxies)

* 概要
  * アプリケーション（Webサーバ）とブラウザとの間にプロキシ（ロードバランサやCDN）が存在する場合、信頼すべきプロキシを指定。
* Laravel 10
  * `TrustProxies::$proxies` で信頼するプロキシのIPアドレスを指定。
  * `TrustProxies::$headers` でプロキシが追加するヘッダー名を指定。
* Laravel 11
  * `$middleware->trustProxies(at: [ ... ]);` でIPアドレスを指定。
  * `$middleware->trustProxies(headers: ...);` でヘッダー名を指定。

#### [署名付きルートリクエストの検査](https://readouble.com/laravel/11.x/ja/urls.html#validating-signed-route-requests)

* 概要
  * `URL::signedRoute()` 等でURIへ署名を付与しリクエスト時にそれを検査。
  * この検査の対象から除外するパラメータを指定。
* Laravel 10
  * `ValidateSignature::$except` で除外するパラメータ名を配列で指定。
* Laravel 11
  * `$middleware->validateSignatures(except: [ ... ])` で指定。

#### [CSRF保護から除外するURI](https://readouble.com/laravel/11.x/ja/csrf.html#csrf-excluding-uris)

* 概要
  * `POST`, `PUT`, `PATCH`, `DELETE` リクエストは全てトークンによるCSRF保護が必要。
  * この保護から除外するURIを指定。ワイルドカード表記が可能。
* Laravel 10
  * `VerifyCsrfToken::$except` で指定。
* Laravel 11
  * `$middleware->validateCsrfTokens(except: [ ... ]);` で指定。

### ルートやコマンドの設定

#### 全体的な考え方

* 概要
  * 最終的には `routes/*.php` で設定。この点は旧形式も新形式も変わらない。
* Laravel 10
  * `routes/` 配下のどのファイル読み込むかサービスプロバイダやカーネルで制御。
* Laravel 11
  * `bootstrap/app.php` で制御。

#### [ブロードキャスト](https://readouble.com/laravel/11.x/ja/broadcasting.html)

* 概要
  * WebSocketによるサーバとの常時接続により、サーバサイドのイベントをブラウザから購読できる。
  * 購読は「チャンネル」単位で行う。チャンネルには、誰もが購読可能な「パブリックチャンネル」と、購読者を制限できる「プライベートチャンネル」がある。
  * 「プライベートチャンネル」の認可は、設定ファイルへのクロージャの実装を通じて行う。通常は `routes/channels.php` に記述。
* Laravel 10
  * 記述先を `BroadcastServiceProvider` で指定。
* Laravel 11
  * この機能は初期状態では無効。有効化する場合 `php artisan install:broadcasting` コマンドを実行。
  * 記述先を `bootstrap/app.php` 。 `withRouting(channels: ...)` で指定。

#### [ルーティング](https://readouble.com/laravel/11.x/ja/routing.html)

* 概要
  * ルートを定義する。設定は基本的に `routes/*.php` 配下に記述。
  * 通常は、ページ遷移アクセスを想定した `web` グループ、APIアクセスを想定した `api` グループの2つを使う。
  * デフォルトでは、グループに応じて `routes/web.php`、 `routes/api.php` の2つ。
* Laravel 10
  * 設定ファイルのパスを `app/Providers/RouteServiceProvider.php` で指定。
  * `api` グループのレート制限も同ファイル。デフォルトで設定されている。
* Laravel 11
  * 設定ファイルのパスを `bootstrap/app.php` で指定。
  * `withRouting(web: ...)` に `web` グループの設定ファイルのパスを指定。これはデフォルトで存在する。
  * `withRouting(api: ...)` に `api` グループの設定ファイルのパスを指定。これはデフォルトでは存在せず、 `php artisan install:api` コマンドで自動作成される。
  * `api`  グループへのレート制限は `AppServiceProvider` で設定。これはデフォルトでは存在しない。

#### [タスクスケジュール](https://readouble.com/laravel/11.x/ja/scheduling.html)

* 概要
  * cron（Linux）やタスクスケジューラ（Windows）に相当する定期タスクをアプリケーション設定として定義。
* Laravel 10
  * `app/Console/Kernel.php` に記述。
* Laravel 11
  * `routes/console.php` に記述。
  * 通常のコンソールコマンドとは別で、タスクスケジュール専用の書き方が用意された。

### サービスプロバイダの統合

新形式では、デフォルト状態としてはアプリケーション側のサービスプロバイダはAppServiceProviderのみへ統合されている。

#### [認可](https://readouble.com/laravel/11.x/ja/authorization.html)

* 概要
  * ユーザー（Userモデル）に対するリソース（任意のEloquentモデル）への認可方法を設定。
* Laravel 10
  * `AuthServiceProvider` に記述。
* Laravel 11
  * `AppServiceProvider` に記述。
  * 設定の書き方は従来と変わらない。標準の設定先が移動されたのみ。

#### [イベントとリスナの登録](https://readouble.com/laravel/11.x/ja/events.html#registering-events-and-listeners)

* 概要
  * 任意のイベントに対し、それをどのリスナが受け取るかを指定。
* Laravel 10
  * `EventServiceProvider` に記述。
  * 自動イベント検出はデフォルト無効。有効化も同ファイルから。
* Laravel 11
  * `AppServiceProvider` に記述。
  * 自動イベント検出はデフォルト有効。検出でスキャンするディレクトリを変更する際や検出自体を無効化する際は、 `bootstrap/app.php` 内で `withEvents(discover: ...)` より指定。

### [エラー処理](https://readouble.com/laravel/11.x/ja/errors.html#the-exception-handler)

エラーが発生した際の様々な処理を設定。項目は多岐に渡るが、本記事の主題である「Laravel 11への移行」に絞ると次の通り。

* 例外のレポート
* グローバルログコンテキスト
* レポート済み例外の重複
* 例外のログレベル
* タイプによる例外の無視
* 例外のレンダー
* 例外レポートの限定

各項目とも、細かい部分は異なるが、設定先のファイルと書き方の概要は新旧で共通している。

* Laravel 10
  * `app/Exceptions/Handler.php` に記述。
* Laravel 11
  * `bootstrap/app.php` に記述。
  * `withExceptions(function (Exceptions $exceptions) { ... }` で提供される `$exceptions` のメソッドで指定。

#### 例外のレポート

* 概要
  * 例外のログ記録や外部サービスへの通知を設定。
  * 発生した例外がクロージャへ入力される。
  * どの例外を捕捉するかクロージャのタイプヒントで指定可能。  
    以降の例で `Exception` とした箇所は何れも任意のサブタイプを指定可能。これを幾つでも指定できる。
* Laravel 10
  * `Handler::register()` 内で `$this->reportable(function (Exception $e) { ... });` で捕捉。
* Laravel 11
  * `$exceptions->report(function (Exception $e) { ... });` で捕捉。

#### グローバルログコンテキスト

* 概要
  * ログに追加するコンテキストデータ（追加情報）を設定。
  * ここでの設定は全ての例外ログに反映される。
* Laravel 10
  * `protected function context(): array` を実装。追加すべきコンテキストデータを連想配列で返却。
* Laravel 11
  * `$exceptions->context(fn () => [ ... ]);` で返却。

#### レポート済み例外の重複

* 概要
  * アプリケーション側の実装により同じ例外が複数回ログに記録されることがある。それを抑制する。
* Laravel 10
  * `protected $withoutDuplicates = true;` を定義。
* Laravel 11
  * `$exceptions->dontReportDuplicates();` で指定。

#### 例外のログレベル

* 概要
  * 例外（クラス）毎に異なるログレベルを設定
* Laravel 10
  * `protected $levels = [ ... ];` を連想配列で指定。
  * キーには例外クラスのFQCNを指定。
  * 値には `Psr\Log\LogLevel` クラスに定義されたログレベル定数。
* Laravel 11
  * `$exceptions->level(Exception::class, LogLevel::XXX)` で指定。

#### タイプによる例外の無視

* 概要
  * 指定したタイプ（クラス）はログに記録しない。
  * 対象クラスをFQCNで配列指定。
* Laravel 10
  * `protected $dontReport = [ ... ];` で指定。
* Laravel 11
  * `$exceptions->dontReport([ ... ]);` で指定。

#### 例外のレンダー

* 概要
  * 例外が発生した際のレスポンスを例外タイプに応じてカスタマイズ。
  * 発生した例外とリクエストオブジェクトがクロージャへ入力される。
  * クロージャからはレスポンスオブジェクトを返却。
  * どの例外をカスタマイズするかクロージャのタイプヒントで指定可能。  
    以降の例で `Exception` とした箇所は何れも任意のサブタイプを指定可能。これを幾つでも指定できる。
* Laravel 10
  * `Handler::register()` 内で `$this->renderable(function (Exception $e, Request $request) { ... });` で設定。
* Laravel 11
  * `$exceptions->render(function (Exception $e, Request $request) { ... });` で設定。

#### 例外レポートの限定

* 概要
  * ログのサンプリング（確率による収集）やスロットリング（収集数の制限）指定。
* Laravel 10
  * `protected function throttle(Throwable $e): mixed;` を実装。
  * 入力された例外に応じて返却を変えることで、例外タイプに応じた異なる設定が可能。
  * `Lottery` インスタンスを返却することでサンプリングが可能。
  * `Limit` インスタンスを返却することでスロットリングが可能。
* Laravel 11
  * `$exceptions->throttle(function (Throwable $e) { ... });` で指定。

### [サービスプロバイダ](https://readouble.com/laravel/11.x/ja/providers.html)

* 参考
  > サービスプロバイダは、Laravelアプリケーション全体の起動処理における、初めの心臓部です。皆さんのアプリケーションと同じく、Laravelのコアサービス全部もサービスプロバイダを利用し、初期起動処理を行っています。
  >
  > https://readouble.com/laravel/11.x/ja/providers.html#introduction
* 概要
  * アプリケーションの初期化時に読むこむべきサービスプロバイダを指定。
  * 典型的には `app/Providers/` 配下にアプリケーション固有のプロバイダを配置しそれを指定。
  * `composer require` 等でインストールした外部パッケージが指定を要求するケースもある。
* Laravel 10
  * `config/app.php` 内の `providers` 配列に指定。
  * フレームワーク側が要求するプロバイダ、アプリケーション側、双方を同じ配列に指定する。
* Laravel 11
  * `bootstrap/providers.php` からの `return` で指定。ここではアプリケーション側のプロバイダのみ。
  * 新形式ではフレームワーク側のプロバイダは自動的に読み込まれる。従って `config/app.php` からは `providers` 配列ごと全て削除。
  * 従来の雛形より提供されていた `AuthServiceProvider`, `BroadcastServiceProvider`, `EventServiceProvider`, `RouteServiceProvider` はここまでの作業で `AppServiceProvider` に統合されている。従って削除。
    * ただし、これまでの対応により `AppServiceProvider` が肥大化してしまう場合、従来通り責務に応じ `XxxServiceProvider` へ切り出してそれを読み込む形を維持しても良い。

## 総括 - 移行の判断とLaravelの総復習

旧形式では「1つの設定項目につき1つのファイル」に近い構造だった。

何れもデフォルトの雛形で提供 *されてしまう* ため、一見するとアプリケーションには何の関係も無さそうなファイルも、消して良いのか一瞥しただけで判断出来なかった。

対して、新形式では必要な場合のみ設定すれば良く、その設定先も2〜3ファイルに集約されている。変更不要の場合は元より、必要な場合であってもいたずらにファイルを増やさずに済む構造である。つまり *Slim Skeleton* は、初期状態が *Slim* であるのみならず、ある程度のカスタマイズを施してもそれを維持できる構造だ。

だが、設定先が2〜3ファイルに集約 *されてしまう* ため、多くの機能を網羅的にカスタマイズしている場合、ブートストラップ `bootstrap/app.php` やサービスプロバイダ `app/Providers/AppServiceProvider.php` がファット化してしまう懸念もある。

Laravel 11への以降を行うにあたって `laravel/framework` のバージョンアップのみに留めるか、アプリケーション構造の移行までを行うかは、本記事「移行対象の確認」を精査し、機能毎に「移行先」のファイルにどのような設定が必要となるかまず確認するのが良いだろう。

お手元のアプリケーションを *Slim* にする手段として、そうでなくともLaravelの基本機能を再確認する資料として、本記事をお役に立て頂ければ幸いである。
