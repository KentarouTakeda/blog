---
title: その疎結合、Laravelでできます
subtitle: Eloquent × イベントで疎結合 ─ クリーンアーキテクチャと大規模開発を考え直す
description: Laravelのイベントシステムで副作用を疎結合にする方法を、EC注文確定シナリオを例に解説する。Eloquentを排除せずにEvent/Listenerによる関心の分離を実現する設計について、Clean ArchitectureのRepository+UseCase構成と比較しながら論じる。
date: 2026-04-25 22:00
tags:
  - PHP
  - Laravel
---

## 1. Eloquentを排除せず、副作用を疎結合に

アプリケーションが育つほど、ひとつの処理に副作用が積み上がっていく。本体がそれらを抱え込み、新しい副作用を足すたびに手が入るようでは、たちまち取り回せなくなる。

Laravelで副作用を疎結合にしたいと思ったとき、多くの場合 DDD の文脈で「イベントで分離すべき」という助言に行き当たる。実装に落とすと、Repository で Eloquent を隠し、UseCase に処理を寄せ、DTO で境界を切る構造に向かう人が多い。それも1つの選択だ。

筆者の実感としても、こうした抽象化は不完全に終わり、「単にコードが複雑になっただけ」の状態に陥っているケースが多かったように思う。mpyw氏も次のように述べている[^mpyw]。

> ActiveRecord 指向のフレームワークで Repository パターンを無理に導入すると死ぬので， UseCase で Eloquent Model の機能を使うことを恐れるな

同意見だ。Eloquentを排除する必要はない。本記事は Eloquent を残したまま疎結合に至る道の話をする。

1つだけ、スコープを明示しておきたい。本記事は明示的に発火する Event/Listener に絞る。Eloquent Observer はまったく別の仕組みであり、本記事の内容は当てはまらない点に注意してほしい[^khorev-observer]。

## 2. 副作用の分類と適切な実行形態

副作用と一括りに言うが、実際にはユーザーに見せるエラーになるべきものと、ならないものが混在している。これを分けないと、イベントで疎結合にしたつもりがコントローラー本来の責務まで奪ってしまう。

副作用は3つの層に分けて捉えるのが扱いやすい[^greeden-classification]。

| 層 | 例 | 失敗時 |
| - | - | - |
| コア | 注文と決済の確定 | ユーザーにエラーを返す |
| 即時検知 | 在庫の引き当て | ユーザーに見せず、即座に検知して対応 |
| 結果整合 | 確認メール、管理者通知 | ユーザーに見せず、リトライで吸収 |

判別は単純で、「この処理が失敗したとき、ユーザーにエラーを見せるべきか」を問うだけだ。Yesならコア、Noだが即座に検知すべきなら即時検知、Noでリトライ任せでよいなら結果整合になる。

```plantuml
rectangle "コア\n（注文・決済）" as req
rectangle "即時検知\n（在庫）" as imp
rectangle "結果整合\n（メール・通知）" as aux

rectangle "コントローラーが直接実行" as direct
rectangle "Event/Listener が受ける" as event

req --> direct
imp --> event
aux --> event
```

コアをイベントに乗せない理由は、イベントの性質にある。イベントは「起きた事実」を伝えるしくみで、リスナは互いを知らずに反応する。コア処理が要する順序や整合性といった要件は、このしくみの守備範囲ではない。

だからコアは、コントローラーが（複雑なら切り出し先が）直接処理する。完了後に `event(new ...)` を呼ぶ。3章で示すコード例はこの形になっている。

副作用がなければ、イベントは不要だ。単純なCRUDは `Model::create()` で完結する。コアだけで完結する処理にイベントを足しても、抽象化のコストが返ってこない。

## 3. 具体例: ECサイトでの注文確定とその後の処理

ここから先は具体例。ECサイトの注文確定処理を考えてみよう。

### シナリオとフロー

コアトランザクションは注文と決済で、これが失敗したら注文は成立しない。在庫の更新はコアではないが、ずれれば次の注文に響くから対応が要る。確認メールと管理者通知は届かなくても注文の成否には関わらない。前章で見た3分類が、ひとつの処理に綺麗に並んでいる。

```plantuml
actor 顧客
participant OrderController as Controller
database DB
participant "OrderConfirmed" as Event
participant UpdateInventory
queue キュー as Q
participant SendConfirmation
participant NotifyAdmin

顧客 -> Controller : POST /orders

group コア（同期・TX内）
  Controller -> DB : 注文+決済を確定
end

Controller -> Event : dispatch

group 即時検知（同期）
  Event -> UpdateInventory : 呼び出し
  UpdateInventory -> DB : 在庫更新
end

group 結果整合（非同期）
  Event -> Q : SendConfirmation投入
  Event -> Q : NotifyAdmin投入
end

Controller -> 顧客 : レスポンス

|||

Q --> SendConfirmation : 非同期実行
Q --> NotifyAdmin : 非同期実行
```

### 薄いコントローラーとイベント

このフローのうち、コントローラーが書くのはこれだけだ。

```php app/Http/Controllers/OrderController.php
class OrderController
{
    public function store(ConfirmOrderRequest $request, PaymentGateway $payment): OrderResource
    {
        $order = DB::transaction(function () use ($request, $payment) {
            $order = Order::create($request->validated());

            $payment->pay($order);

            return $order;
        });

        event(new OrderConfirmed($order));

        return $order->toResource();
    }
}
```

注文と決済をトランザクション内で完了させ、コミット後に `OrderConfirmed` を発火する。在庫の更新やメール送信をコントローラーが知る必要はない。多くのCRUDは、この形に収まる。

`OrderConfirmed` の中身は更に薄い。

```php app/Events/OrderConfirmed.php
class OrderConfirmed
{
    public function __construct(
        public Order $order
    ) {}
}
```

`Order` を受け取って保持するだけだ。実装すべきメソッドも決めるべきフィールド構成もなく、いわゆるPOPO（Plain Old PHP Object）の形に収まっている。

### 同期で引き当てる在庫

在庫の更新は `UpdateInventory` リスナが同期で受け持つ。

```php app/Listeners/UpdateInventory.php
class UpdateInventory
{
    public function __construct(
        private Inventory $inventory
    ) {}

    public function handle(OrderConfirmed $event): void
    {
        $this->inventory
            ->deductFor($event->order);
    }
}
```

`OrderConfirmed` を受け取って `Inventory` に処理を委ねる。同期で動かすのは、失敗を例外として呼び出し側に返し、リクエスト内で対応するためだ。即時検知層の典型形になる。

### 非同期で流すメールと通知

メール送信と管理者通知は非同期で受け持つ。

```php app/Listeners/SendConfirmation.php
class SendConfirmation implements ShouldQueue
{
    public function handle(OrderConfirmed $event): void
    {
        Mail::to($event->order->customer)
            ->send(new OrderConfirmationMail($event->order));
    }
}
```

```php app/Listeners/NotifyAdmin.php
class NotifyAdmin implements ShouldQueue
{
    public function handle(OrderConfirmed $event): void
    {
        Notification::send(
            Admin::all(),
            new NewOrderNotification($event->order)
        );
    }
}
```

`UpdateInventory` との違いは `implements ShouldQueue` の1行だけだ。これでリスナはキューワーカー側で実行される。失敗してもユーザーに直接エラーを見せず、リトライで吸収して構わない処理を非同期に回せる。結果整合層の典型形になる。

2つのリスナはお互いを知らず、`OrderConfirmed` を介し独立して動く。Mail送信が詰まっても通知は影響を受けない。

### auto-discoveryによる自動結線

3つのリスナを同期・非同期で並べてきたが、結線は何も書く必要がない。Laravelのauto-discovery[^auto-discovery]が `app/Listeners/` 以下のクラスをスキャンし、`handle` メソッドのタイプヒントから対応するイベントを自動登録する。設定ファイルへの追記もコンテナへの登録も要らない。依存関係は極めてシンプルだ。

```plantuml
class OrderController <<Controller>>
class OrderConfirmed <<Event>>
class UpdateInventory <<Listener>>
class SendConfirmation <<Listener>>
class NotifyAdmin <<Listener>>

OrderController -d-> OrderConfirmed
UpdateInventory .u.> OrderConfirmed
SendConfirmation .u.> OrderConfirmed
NotifyAdmin .u.> OrderConfirmed
```

## 4. 判断を増やさない ─ CA構造との比較

ここまで読んで「Clean Architectureでも同じことができる」と感じた読者がいるかもしれない。事実、構造的にはできる。違いはコード量ではなく、書く前に必要な判断の量にある。

### ファイル数より、判断の量

1章で触れた、Eloquent を Repository で隠して UseCase に処理を寄せ DTO で境界を切る設計を、本記事では便宜上 *CA構造* と呼ぶ。

3章で示したLaravel Way[^laravel-way]の同じシナリオを、CA構造で組み直すと次のクラス群になる。比較を公平に保つため、CA構造側はInterfaceを省いた最低限の構成で並べた。実プロジェクトではRepositoryやServiceにInterfaceを挟むことも多いが、その分だけファイルと判断はさらに増える。

| 役割 | CA構造（9ファイル） | Laravel Way（6ファイル） |
| - | - | - |
| バリデーション | `ConfirmOrderRequest` | `ConfirmOrderRequest` |
| HTTP処理 | `OrderController` | `OrderController` |
| Eloquent操作 | `OrderRepository` | - |
| DTO | `OrderDTO` | - |
| 副作用の順次実行 | `ConfirmOrderUseCase` | - |
| 決済呼び出しのラップ | `PaymentService` | - |
| イベント発火 | - | `OrderConfirmed`（Event） |
| 在庫の引き当て | `InventoryService` | `UpdateInventory`（Listener） |
| 確認メール送信 | `SendConfirmationService` | `SendConfirmation`（Listener） |
| 管理者への通知 | `NotifyAdminService` | `NotifyAdmin`（Listener） |

ファイル数の差は3に過ぎない。差は数ではなく、CA構造側の各クラスに残る判断の量にある。

- Repository: 何を公開するか
- DTO: どのフィールドを含めるか
- Service: 何処で切り、何処に置くか
- Interface: 依存方向と命名規則をどうするか
- 結線: 明示的に実装

それぞれは大きな決断ではないが、書き始める前に必ず通る判断だ。

Laravel Way側にも判断はある。だが、その多くはLaravelの規約に吸収されている。

- Event: Eloquentモデルを保持するのみ — フィールド設計の余地がない
- Listener: `app/Listeners/` に置けばauto-discoveryが検知
- 結線: `handle(...)` のタイプヒントのみ

判断はコードを書く負荷というだけでは終わらない。間違いがつきまとう。Interfaceの分割を間違えれば修正に追われ、DTOのフィールドを見落とせばService間で型ずれが起きる。直すコードが要るし、修正したコードを守るテストも増える。

### 入口と出口、両方への分離

Laravel Wayがここまで判断を吸収できる根拠は、Laravelの設計そのものにある。コントローラーの入口にはFormRequestとPolicyがあり、リクエストのバリデーションと認可を本体から切り離す。出口にはEvent/Listener/Jobがあり、副作用を本体から切り離す。入口と出口の両方に分離の道具が用意されていて、本体はその間に挟まれた薄い処理だけを書けばよい。

Laravel Way側で増えないコードは、間違えようのないコードでもある。`OrderConfirmed` のフィールド設計を間違えようがないし、Listenerの登録漏れも起こりようがない。書かないコードにはバグがない。

## 5. 同期から非同期へ ─ 構造を作り直さない

注文確認メールがもう同期で送れる量ではなくなった。非同期化したい。

### `implements ShouldQueue`

3章の `SendConfirmation` を思い出してほしい。同期と非同期を分けるのは、この1行だけだ。

```diff app/Listeners/SendConfirmation.php
 class SendConfirmation
+    implements ShouldQueue
 {
     // ...
 }
```

`handle()` の実装、コンストラクタ、`OrderConfirmed`、`OrderController`、コミット境界、何ひとつ書き換えない。

### 普遍課題は残るが、構造は壊れない

ただし非同期化に伴う考えごとはある。冪等性、失敗時の扱い、リクエストスコープを失うことによるコンテキスト喪失、ジョブが `SerializesModels` を介してDBから再ロードしたときに dispatch時と状態が異なる可能性。これらはアーキテクチャ非依存の普遍課題で、どの構造を採っても避けられない。

CA構造でも同じ課題に向き合う必要がある。違うのは、それに加えて構造変更が要ることだ。`SendConfirmationService` を非同期に乗せるとき、ジョブクラスを新設し、UseCaseの呼び出しを `dispatch` に書き換え、ジョブ引数のシリアライズ対象を選び、Service側のロジックをそのまま使うか移すかを判断する。普遍課題に取り組む前に、まず構造を組み直す手間が立ちはだかる。

Laravel Wayでは、リスナがすでに `OrderConfirmed` を介して呼び出し側から分離されている。`implements ShouldQueue` で非同期に切り替えたあとは、普遍課題に集中できる。

### POPOに保たれるリスナ

ここから先のコード例はLaravel 13以上が前提となる。

非同期化したリスナはここから育てていく。リトライ回数を制御したくなれば `#[Tries(3)]`、タイムアウトを変えたければ `#[Timeout(60)]`、失敗の最終後始末なら `failed()` メソッド。

```php app/Listeners/SendConfirmation.php
#[Queue('emails')]
#[Tries(3)]
#[Timeout(60)]
class SendConfirmation implements ShouldQueue
{
    public function handle(OrderConfirmed $event): void
    {
        // ...
    }

    public function failed(OrderConfirmed $event, Throwable $e): void
    {
        // ...
    }
}
```

どれも既存のリスナクラスにアトリビュートやメソッドを足すだけだ。`handle()` の中身は変わらない。

剥がせば `handle(OrderConfirmed $event): void` を持つ素のPHPクラスが残り、リスナは構造としてPOPOに近づいた[^laravel-13-attributes]。

## 6. 薄い疎結合は、日常で効いてくる

同期→非同期で構造が壊れない性質は、特殊な瞬間にだけ効く話ではない。日々の開発で、これと同じ手応えが何度も返ってくる。

### 開放閉鎖の原則 ─ `app/Listeners/` に閉じる変更

副作用の追加・削除・修正のすべてが、`app/Listeners/` の中で完結する。

- 追加: `app/Listeners/` にファイルを置く。auto-discoveryが結線する。コントローラーもEventも開かない
- 削除: ファイルを消す。auto-discoveryから外れて結線が解ける。発火側に触れる必要はない
- 修正: 該当Listenerの `handle()` だけを書き換える。他のリスナには触らない

副作用がコントローラーに溜まっているコードからの移行も、この性質の延長で書ける。副作用ブロックを切り出してListenerに貼り、`event(new ...)` に置き換える。設計判断は挟まらず、手順がそのまま移行手段になる。

障害も同じ単位で閉じる。`#[Tries]`、`#[Timeout]`、`failed()` はそれぞれのListenerに紐づき、別のリスナを巻き込まない。

### 単一責任の原則 ─ 三層のテスト容易性

Listenerが副作用を1つだけ持つ。だから、テストの境界線も明確になる。このシナリオは3層に分かれる。

コントローラーのテストは、副作用が発火することだけを確かめる。

```php
Event::fake();

$id = $this->postJson('/orders', [/* ... */])
    ->assertCreated()
    ->json('id');

Event::assertDispatched(
    fn (OrderConfirmed $e) => $e->order->id === $id
);
```

`Event::fake()` がリスナの実行を遮断する。テストはリスナを知らない。

リスナのテストは、受け取ったEventに対して何が起きるかだけを確かめる。

```php
$order = Order::factory()->makeOne();

$this->mock(Inventory::class)
    ->shouldReceive('deductFor')
    ->once()
    ->with($order);

$listener = $this->app->make(UpdateInventory::class);
$listener->handle(new OrderConfirmed($order));
```

コンテナでリスナを解決し、`handle()` を呼ぶだけだ。コントローラーを通す必要はない。

結線確認は安全網。auto-discoveryでは配置がそのまま登録になるため重要度は低いが、テストに仕様を表明させる点で悪くないかもしれない。

```php
Event::assertListening(
    OrderConfirmed::class,
    UpdateInventory::class
);
```

3層は互いを知らない。テストコードの構造は、プロダクションコードの構造の鏡だ。

CA構造の同じシナリオでは、`InventoryService` をモックして `ConfirmOrderUseCase` をテストし、Repositoryのモックで `OrderDTO` を返させる必要がある。

### 最小知識の原則 ─ Nightwatchという「他人」

NightwatchはLaravel公式のアプリケーション監視サービスだ。Laravel本体が発火する組み込みイベントを購読し、メトリクスを収集する。

収集対象は多岐にわたる。一例:

- Eloquentの遅延ロード発生回数
- キャッシュのヒット/ミス、書き込み・削除の失敗
- キュージョブの試行回数と失敗
- スケジュールタスクの実行時間

汎用的な監視ツールでは扱いにくいLaravel固有の事象も、組み込みイベントから自然に拾える。

アプリ・Nightwatch・Laravel本体の三者は、互いを知らない。

- アプリは、Nightwatchを知らない。パッケージをインストールするだけで、アプリのコードに変更は要らない
- Nightwatchは、特定のアプリを知らない。Laravel本体が発火する汎用Eventを購読しているだけで、ユーザーランドのコードに依存しない
- Laravel本体も、Nightwatchを直接は知らない。発火するEventはユーザーランドに公開された汎用APIで、誰が拾うかは関与しない

それでも、メトリクスは集まる。最小知識の原則が、ここに現れている。

## 7. それでも残る疑問

賛成であれ反対であれ、Event/Listenerに繰り返し聞かれる疑問がある。「コードが追いにくい」というものだ。

`OrderController` を読み下すだけでは、`event(new OrderConfirmed(...))` の先で何が起きるかは見えない。それは事実だ。ただし、これは関心の分離が機能している裏返しでもある。コントローラーは在庫もメールも通知も知らない。だから副作用を足し引きしてもコントローラーは揺れない。追いにくいのは、追う必要がなくなったからだ。

それでも実際に追いたい場合、いくつかの手段がある。

- IDEで `OrderConfirmed` の参照を辿れば、発火元とリスナの一覧に届く
- `php artisan event:list` でEventとListenerの対応を一覧化できる
- `app/Events/` ・`app/Listeners/` のディレクトリ自体が、何が起きるかのカタログになる

## 8. イベントを起点に、Laravelが繋がる

Event/Listenerを起点に置くと、Laravelが用意している他の機能が、イベントシステムとの接続点を自然に持っていることに気づく。

3章で `OrderConfirmed` を起点にメール送信や通知、在庫の引き当てが枝分かれするのを見た。5章ではそれを `implements ShouldQueue` の1行で非同期に切り替えた。いずれも「Eventをきっかけに何かが起きる」という同じ図式の中にある。

イベントシステムとの接続点はそれだけではない。Event を `ShouldDispatchAfterCommit` でトランザクションのコミット後にdispatchさせたり、`ShouldBroadcast` を実装してフロントエンドへ配信したりできる。キューに乗せたジョブには `ShouldBeUnique` で多重起動を抑える切り替えがある。どれもリスナや Event のクラス宣言に1行足すだけだ。

とりわけキューに乗せたときの振る舞いに、目を留めておきたい。Event が `SerializesModels` をミックスインすると、ペイロードはクラス名や主キーに置き換わり、実行時にDBから復元される。DTO を Event に載せるクリーンな選択肢もあるが、こうしたトレイトが標準で用意されていること自体が、Eloquent モデルが境界を越えて運ばれる世界を Laravel が想定しているように筆者には映る。

その疎結合、Laravelでできます。

[^khorev-observer]: [Why Are Model Observers in Laravel a Bad Practice?](https://medium.com/@dkhorev/why-are-model-observers-in-laravel-a-bad-practice-8feb8526c95e)
[^mpyw]: [5年間 Laravel を使って辿り着いた，全然頑張らない「なんちゃってクリーンアーキテクチャ」という落としどころ](https://zenn.dev/yumemi_inc/articles/ce7d09eb6d8117)
[^greeden-classification]: [Practical Complete Guide: Event-Driven Design in Laravel](https://blog.greeden.me/en/2026/04/08/practical-complete-guide-event-driven-design-in-laravel-event-listener-subscriber-broadcasting-separation-of-side-effects-testing-and-accessible-notification-design/)
[^auto-discovery]: [Laravel 13.x ドキュメント（日本語版）「イベント追跡」](https://readouble.com/laravel/13.x/ja/events.html#event-discovery)
[^laravel-way]: *Laravel Way* はコミュニティで慣習的に使われる呼称だが、明確な定義は存在しない点に留意したい。本記事では、Laravelの規約に沿い、Eloquentを排除せずにEvent/Listenerで副作用を分離する構造を指して用いる。
[^laravel-13-attributes]: [Laravel 13.x ドキュメント（日本語版）「PHP属性の拡張」](https://readouble.com/laravel/13.x/ja/releases.html#expanded-php-attributes)
