---
title: PHPerKaigi 2026「接続」の後日談
subtitle: 登壇駆動OSS活動と、設計の答え合わせ
description: PHPerKaigi 2026登壇「接続」の後日談。PHP 8.6に入ったPostgreSQL持続接続リセット(pdo_pgsql)PRの成功とRedis(PhpRedis)断念の対比から、コネクションプールの設計を考える。
date: 2026-04-03 09:00
tags:
  - PHP
  - phperkaigi
  - essay
---

[PHPerKaigi 2026](https://phperkaigi.jp/2026/) に登壇した。PHPerKaigiでの登壇は4年連続5回目。
（[プロポーザル](https://fortee.jp/phperkaigi-2026/proposal/a16d700c-23b2-4345-956c-eb7869daa814) / [スライド](https://speakerdeck.com/kentaroutakeda/jie-sok-pahuomansutiyuningunozui-hou-no-shou-dian-todian-wojie-bu-sono-shun-notameni)）

{% twitter https://x.com/KentarouTakeda/status/2035191909048885269 %}

## Laravelから離れる不安 - 「接続」というテーマ

3年連続でLaravelをテーマに登壇してきた。Laravel Way、Laravelと既存ツールの統合、Laravel自体の拡張と、年々テーマが先鋭化し、話す側も聞く側もハードルが上がっていくことが心配だった。

4年目、それを断ち切るためLaravelから離れた。怖かった。既定路線から外れることの不安。だが結果的に正解だった。完全な新作はスコープが広く、これまで語れなかったことが自然に語れた。長い時間をかけて蓄積してきたノウハウを、40分で惜しみなく出し切ることができた。

採択後に組まれた絶妙なタイムテーブルも後押ししてくれた。私のトークがアプリケーション層から接続を語ったのに対し、直後のひがきさんはトランスポート層のTLSを、午後の市川さんはネットワーク層のIPルーティングを扱っていた。レイヤーをまたいで接続の全体像が浮かび上がる流れだった（{% post_link 2026-04-01-PHPerKaigi-2026-Feedbacks '感想記事' %}に詳しく書いた）。おかげで本筋の議論に集中できた。

## 登壇駆動OSS活動 - pdo_pgsql持続接続リセット

トークの途中で、私が作成したPHPの機能改善プルリクエストについて触れた。

持続接続には状態リーク問題がある。前のリクエストが残したセッション設定やロック、一時テーブルが次のリクエストに漏れるのだ。PHPからPostgreSQLへの持続接続を安全に扱う場合も、この対処が不可欠になる。

私はこの問題を何年も前から知っていた。だが自力で迂回できていたため、PHPに手を入れる動機がなかった。

プロポーザルの採択が動機になった。「持続接続の状態リーク問題はこう解決すべき」と登壇で語るなら、その解決策が理想的に実装されたドライバやライブラリを示して然るべきだ。登壇ネタにできるという下心もあった。

言うなれば、登壇駆動OSS活動。

`ext/pdo_pgsql`に`DISCARD ALL`によるリセット機能を実装し、プルリクエストを送った。

{% link_preview https://github.com/php/php-src/pull/20572 %}{% endlink_preview %}

メンテナの[@devnexen](https://github.com/devnexen)は「nice !」と反応してくれた。その後のやり取りが興味深かった。`DISCARD ALL`が`DEALLOCATE ALL`を包含する仕様を、メンテナ自身が知らなかったのだ。

> DISCARD ALL already DEALLOCATE ALL according to your link. **Good to know !**

<!-- TODO mdリンクがタグにならないためaタグ。hexoの修正が必要？ -->
{% post_link 2025-12-06-where-my-community-begins '以前書いた記事' %}の中で、そーだいさんから「RailsのDB層を支えた<a href="https://x.com/kamipo">@kamipo</a>氏のような、DBとフレームワークの間を埋める立ち位置」を示唆されたことを紹介した。そう、PHPのコアコミッターがDBベンダー固有のニッチな仕様に明るくないのは当然のことなのだ。使う側として当たり前に知っていることが、作る側には届いていない。

このプルリクエストで、その立ち位置を無意識に実践できていたことに気づいた。無事マージされ、PHP 8.6に入る。

## 登壇駆動OSS活動 - PhpRedis断念

同じアプローチをRedisにも試みた。[PhpRedis](https://github.com/phpredis/phpredis)の持続接続にも状態リーク問題がある。Redisの`RESET`コマンドで解決できるはずだった。手元では動作確認まで済んでいた。

だが断念した。

決定的だったのはバージョンサポートポリシーだ。Redisの`RESET`は6.2以降でしか動作せず、それ未満ではサイレントに失敗する。そしてPhpRedisはサポート対象のRedisバージョンを定義していない。実質「全バージョンサポート」だ。

| | pdo_pgsql（成功） | PhpRedis（断念） |
| - | - | - |
| リセット手段 | `DISCARD ALL` | `RESET` |
| バージョン要件 | PHP側で明確に制限 | 未定義 |
| サイレント失敗 | なし | あり（<6.2） |
| 結果 | マージ済み | 断念 |

透過的に動作すべきリセット機能が、特定バージョンでサイレントに失敗する可能性を許容してよいのか。私だけでは判断できなかった。

「直せることは分かっている。だが『どう直すか？』を自分だけでは決められない。」

トークの中で「不要な機能を持たない設計は対策そのものを不要にする」と語った。裏を返せば、幅広いバージョンサポートという利点が新機能の導入を慎重にさせる。定義しないこともまた設計だ。

登壇が動機になってコードを書いた。では、その登壇自体はどうだったか。

## 登壇を振り返る - 設計通りに行ったこと

いくつかの設計意図が狙い通りに届いた。

### 「人と人の接続」

トークの締め。技術的な「接続」を語った40分の最後を、人間的な「接続」で締めくくった。

この構成はプロポーザルの段階から意図していた。後付けの修辞ではない。「全部を1人でやるのは無理」だから「接続」が要る。技術の点と点を結ぶのも、人と人を結ぶのも、同じ「接続」だ。副題の「点と点を結ぶ」もダブルミーニング。一瞬とは、一期一会でもある。

### 繰り返し構成

「また同じ話です」と5つのセクションで同じ分析フレームを繰り返した。どれも「接続を確立し、維持し、切断する」という同じ構造を持つ。異なるレイヤーの技術を同じ構造に落とし込むことに苦労したが、飽きられるかもしれないという不安はなかった。フレームがシンプルなら、題材が変わっても認知負荷は上がらない。飽きではなくリズムになる。その確信があった。

結果、「体系的」「横断的」「コンパクトにまとまっていた」と受け取ってもらえた。

### 阿部寛のホームページ

{% twitter https://x.com/kotomin_m/status/2035170770595586110 %}

130万超のインプレッション。前半のフックとして意図的に仕込んだスライドだが、この規模は全くの想定外だった。

私は登壇スクリプトを用意しない。聴衆の反応を見ながら自分の熱量に任せ話した方が伝わると考えている。ただし「一字一句間違えたくない台詞」は別だ。登壇練習で発見したワンフレーズだけは、徹底的に繰り返し練習した。

> HTTPのチューニングを語るなら、この **Webサイト、もとい、ホームページ** を外すわけにはいかない

「Webサイト」から「ホームページ」への言い直しがビートだ。阿部寛のサイトの正式名称はあくまで「ホームページ」なのだ。このワンフレーズだけは外したくなかった。

バズの起点はあくまで[@kotomin_m](https://x.com/kotomin_m)のポストだ。練習の積み重ねがその瞬間を作ったのかは分からないが、そうだとしたら嬉しい。

### forteeフィードバック

50件弱のコメント付きフィードバックが届いた。すべてに目を通した。丁寧さや横断的な視点への評価、新しい技術的知見を得たという声が多かった。実践への意欲を示すコメントもあれば、「難しかった」という率直な声も少数あった。届かない層が出ることは覚悟していた。だが間口を広げれば横断的な視点は薄まる。その割り切りは変えない。

## 登壇を振り返る - 設計通りに行かなかったこと

登壇タイトルの着想元の話をする。{% post_link 2023-05-04-PHPerKaigi2023-Dr-Strange-Laravel '3年前の補足記事' %}で *次回はせめて国内作品から登壇タイトルを着想したいと思う* と書いた。元ネタのキューブリックがニッチ過ぎたことへの反省だ。{% post_link 2025-03-29-the-housekeeper-and-laravel '2025年' %}は、小川洋子の「博士の愛した数式」から着想し「私の愛したLaravel」にたどり着けた。国内作品だ、よかった。しかし今年はサルトルだ。フランス哲学まで逆行してしまった。だが後悔はしていない。

そのサルトルが、うまくいかなかった。

「実存は本質に先立つ」を「接続は性能に先立つ」に転用した。接続を整えなければ性能改善の土台がない。その主張をサルトルの命題に重ねた。だが語順に悩んだ。エンジニアの関心事は性能だ。「性能のためにまず接続を」と考えれば主語は「性能」になる。しかし「性能は接続に先立つ」では意味が逆転してしまう。真剣に悩んだ末に、元の命題に倣った語順を採用した。

本番では反応が薄かった。理由は2つある。

1つ目はターゲットとの乖離だ。年代や職種を問わず、エンジニアにサルトルは遠い。乖離は事前に認識しており補足の言葉を準備していたが、緊張で活かしきれなかった。

2つ目は個人的なものだ。同カンファレンスで「[存在論的プログラミング：時間と存在を記述する](https://speakerdeck.com/koriym/cun-zai-lun-de-puroguramingu-shi-jian-tocun-zai-woji-shu-suru)」と題し登壇を控えていた郡山氏（[@koriym](https://x.com/koriym)）が、なんと私のトークに足を運んでくださった。哲学とプログラミングの接点を深く掘り下げている方の前でサルトルを引用するのは、かなり緊張した。準備していた言葉を出す余裕がなかった。

## 次の「接続」

pdo_pgsqlはマージされ、PhpRedisは断念した。構成の設計意図は概ね届き、サルトルは届かなかった。すべてが成功する必要はない。登壇という締め切りが、コードを書く動機にも、語る言葉を選ぶ訓練にもなった。そうやって「接続」を作り続けたい。

## 登壇に言及いただいたブログ記事

* [PHPerKaigi 2026 | BEAR Blog](https://koriym.github.io/blog/2026/03/27/phperkaigi-2026/) - [@koriym](https://x.com/koriym)
* [PHPerKaigi 2026 に行ってきた｜yuk](https://zenn.dev/yuksew/articles/b4c19d3ff3c912) - [@yuksew](https://x.com/yuksew)
* [PHPerKaigi 2026 参加レポート｜Arlo@ Web Engineer](https://zenn.dev/fire_arlo/articles/phperkaigi-2026-report) - [@fire_arlo](https://x.com/fire_arlo)
* [PHPerKaigi 2026 登壇 & 参加レポート - freee Developers Hub](https://developers.freee.co.jp/entry/phperkaigi2026) - [@theyoshida3](https://x.com/theyoshida3)
* [PHPerKaigi 2026にスポンサー参加しました & ブース出展しました！ - エス・エム・エス エンジニア テックブログ](https://tech.bm-sms.co.jp/entry/2026/03/26/160000)
* [PHPerKaigi 2026へ行ってきた - Magnolia Tech](https://blog.magnolia.tech/entry/2026/03/21/221138) - [@magnolia_k_](https://x.com/magnolia_k_)
* [PHPerKaigi2026に参加しました! - GO Tech Blog](https://techblog.goinc.jp/entry/2026/03/24/161701) - [@pyama86](https://x.com/pyama86)
* [hanhan's blog - PHPerKaigi2026 Day1 参加ログ](https://blog.hanhans.net/2026/03/21/phperkaigi-2026-day1/) - [@hanhan1978](https://x.com/hanhan1978)
* [マネージャーがPHPerKaigi 2026に参加したら非常に楽しかった話 - れれのーと うるとら](https://rerenote.hatenablog.com/entry/2026/03/23/140348) - [@rerenote](https://x.com/rerenote)

*こちらに掲載されていない記事をご存知の方は是非お知らせ下さい。追加させて頂きます。*

## スライド中で紹介した記事やURL

* [阿部寛のホームページ](https://abehiroshi.la.coocan.jp/)
* [阿部寛のホームページ - Wikipedia](https://ja.wikipedia.org/wiki/%E9%98%BF%E9%83%A8%E5%AF%9B%E3%81%AE%E3%83%9B%E3%83%BC%E3%83%A0%E3%83%9A%E3%83%BC%E3%82%B8)
* [PHPでできる！自作IPルーター - 市川@cakephper](https://fortee.jp/phperkaigi-2026/proposal/7b748792-1961-4959-9642-1266c23817e5)
* [PHPでTLSのプロトコルを実装してみる - ひがき](https://fortee.jp/phperkaigi-2026/proposal/36dd9342-2ea3-47d5-9518-4496c2bcc0e2)
* [車輪の再発明をしよう！PHPで実装して学ぶ、Webサーバーの仕組みとHTTPの正体 - H1R0](https://fortee.jp/phperkaigi-2026/proposal/c8e2b096-54d8-4722-8506-6d5973488c01)
* [php/php-src#20572 - pdo_pgsql: Implement DISCARD ALL for persistent connection reset](https://github.com/php/php-src/pull/20572)
* [laravel/framework#38642 - Destroy Guzzle Client after each request](https://github.com/laravel/framework/pull/38642)
* [guzzle/guzzle#3307 - Support curl_share_init_persistent()](https://github.com/guzzle/guzzle/issues/3307)
* [サルトル「実存主義とは何か」（伊吹武彦訳、人文書院、1996年）](https://www.jimbunshoin.co.jp/book/b66252.html)
* [中嶋謙互「オンラインゲームを支える技術—壮大なプレイ空間の舞台裏」（WEB+DB PRESS plus）](https://gihyo.jp/book/2011/978-4-7741-4580-8)
