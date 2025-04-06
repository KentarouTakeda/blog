---
title: 「私の愛したLaravel」―トークの裏側、シンプルへのこだわり
date: 2025-03-29 12:00
ogimage: ogimage.webp
twitter_large_card: true
tags:
  - PHP
  - phperkaigi
  - Laravel
---

PHPerKaigi 2025に3年連続で登壇させて頂いている。

{% twitter https://x.com/KentarouTakeda/status/1903303140503412805 %}

| 年 | タイトル |
| - | - |
| 2023 | [Laravelへの異常な愛情 または私は如何にして心配するのを止めてEloquentを愛するようになったか](https://fortee.jp/phperkaigi-2023/proposal/6211083d-fc51-49a3-8b27-485d8e231b1f) |
| 2024 | [Laravel OpenAPIによる "辛くない" スキーマ駆動開発](https://fortee.jp/phperkaigi-2024/proposal/9e2e6c38-d078-4efa-99b4-83ebf9033b34) |
| 2025 | [私の愛したLaravel 〜レールを超えたその先へ〜](https://fortee.jp/phperkaigi-2025/proposal/3ff0f775-9601-4bf6-a1cf-9911b11787b3) |

今回の題材は、アプリケーションを破綻から守るための「Laravelの拡張」だ。この題材や「私の愛したLaravel」というタイトルの理由、テーマ選定や完成までの紆余曲折を紹介したい。主にトークまたは資料をご覧になった方向けの補足記事。

## 映画や小説作品をオマージュする理由

「私の愛したLaravel」というタイトルは、小川洋子さんの小説「[博士の愛した数式](https://www.shinchosha.co.jp/book/401303/)」が元になっている。「Laravelへの異常な愛情」は「[博士の異常な愛情](https://ja.wikipedia.org/wiki/%E5%8D%9A%E5%A3%AB%E3%81%AE%E7%95%B0%E5%B8%B8%E3%81%AA%E6%84%9B%E6%83%85_%E3%81%BE%E3%81%9F%E3%81%AF%E7%A7%81%E3%81%AF%E5%A6%82%E4%BD%95%E3%81%AB%E3%81%97%E3%81%A6%E5%BF%83%E9%85%8D%E3%81%99%E3%82%8B%E3%81%AE%E3%82%92%E6%AD%A2%E3%82%81%E3%81%A6%E6%B0%B4%E7%88%86%E3%82%92%E6%84%9B%E3%81%99%E3%82%8B%E3%82%88%E3%81%86%E3%81%AB%E3%81%AA%E3%81%A3%E3%81%9F%E3%81%8B)」が元ネタだ。

私は、映画や小説をオマージュしたトークタイトルを使うことが多い。これは、トークの引きを強めることを目的としているわけ**ではない**。最終的にはその効果も期待しているが、本来の目的は別のところにある。

本来の目的、それは、自分自身にトークのテーマを腹落ちさせることだ。

題材は「Laravelの拡張」だ。真っ当にやると複雑になりそうな実装も、少しの発想の転換 ―Laravelの拡張 で問題を単純化できることがある。だがこれは、「魔改造」と紙一重でもある。無秩序に改造されたフレームワークは非常に厄介だ。控え目な少しの変更で問題を大胆に解決するような、繊細で美しい解法が望ましい。

「美しい解法」という言葉が頭に浮かんだ、数学を題材とした作品からインスピレーションを得るのが良いと考えた。そこで「博士の愛した数式」を選んだ。次のようなストーリーの物語だ:

> 不慮の交通事故で、天才数学者の博士は記憶がたった80分しかもたない。何を喋っていいか混乱した時、言葉の代わりに数字を持ち出す。それが、他人と話すために博士が編み出した方法だった。博士のもとで働くことになった家政婦の杏子と、10歳の息子。博士が教えてくれる数式の美しさ、キラキラと輝く世界。母子は、純粋に数学を愛する博士に魅せられ、次第に、数式の中に秘められた、美しい言葉の意味を知る―。
>
> [博士の愛した数式 | Prime Video](https://www.amazon.co.jp/%E5%8D%9A%E5%A3%AB%E3%81%AE%E6%84%9B%E3%81%97%E3%81%9F%E6%95%B0%E5%BC%8F-%E5%AF%BA%E5%B0%BE%E8%81%B0/dp/B00N0BLLCW)

作中で博士が語る言葉より、「調和」という今回のテーマを発見できた。資料と口頭の両方で、何度もこの言葉を繰り返している。

資料作成中は常に映画をループ再生していた。行き詰まった時に聞こえてきた台詞がヒントになって先に進めたこともある。この方法は「Laravelへの異常な愛情」の時も役立った、詳しくは[過去に書いた](https://no-hack-no.life/post/2023-05-04-PHPerKaigi2023-Dr-Strange-Laravel/#%E7%99%BB%E5%A3%87%E3%82%BF%E3%82%A4%E3%83%88%E3%83%AB%E3%81%A8%E5%8F%8D%E7%9C%81%E7%82%B9)通りだ。

気に入ってるやり方だが欠点がある。あくまで自分自身の腹落ちを目的としているため、世に広く知られたメジャーな作品を選べるとは限らない。2作品とも知名度は決して低くないが、会場にいた方やこの記事を読んでいる方で知っている人は多くないかもしれない。だが気にしない。インスピレーションを得てトークや資料の完成度を高めることが目的だ。

## 過去のトークとの技術的な関係

トークとしては「Laravelへの異常な愛情」の続編と位置づけたが、技術的には昨年の「Laravel OpenAPIによる "辛くない" スキーマ駆動開発」を含む3つで連続している。

「Laravelへの異常な愛情」では、最初から最後までLaravelの話だけを扱った。

「Laravel OpenAPIによる〜」では、OpenAPIやその他スキーマ管理ツールとの統合を扱い、トークのリファレンス実装として[Laravel OpenAPI Validator](https://packagist.org/packages/kentaroutakeda/laravel-openapi-validator)を作成し公開した。

「私の愛したLaravel」では、個別のテクニックやツールではなく、より広く一般化した形で、Laravelと「何か」とを統合する話題を扱った。

| 年 | 題材 |
| - | - |
| 2023 | Laravel |
| 2024 | Laravel + 個別の課題解決 |
| 2025 | Laravel + 一般的な「何か」 |

3つの話は地続きだ。「拡張」という難度の高い話題を耳にするとつい試したくなるのはエンジニアの性だが、それは個別の課題解決の延長線上であり、目的はあくまでアプリケーションをシンプルに保つことだ。これを忘れてはいけない。

## トーク考案中の方針転換

資料作成中、困ったことに気づいた。結論、書いたコードの半分以上を捨て、資料の大部分を再構成した。

拡張を取り扱うには、ドキュメントに書かれていないフレームワークの内部構造を説明する必要がある。拡張それ自体のコード例も必要になる。一通り書き終え見積もった所、ここまででちょうど40分。

これは非常にまずい。拡張を安易に試された結果、その方の業務コードが「魔改造」になってしまうのは絶対に避けたい。「拡張」ではなく「拡張*の結果コードはどうなるのか*」を示さなければいけない。多くのコードを捨て、空いた時間を「Laravelへの異常な愛情」の再説明に充てるよう変更した。シンプルにLaravelだけを取り扱った「簡潔なコード」を紹介するトークだ。

苦渋の決断だったが、結果的に悪くなかったと感じている。

まずは「簡潔なコード」を示す。いかにもそれを崩しそうな要件を示す。どこを拡張すれば「簡潔なコード」を維持できるのか示す。

頂いた感想の中で最も多かったのが、「簡潔なコード」を維持できなくなった状態を指し「まさに同じ失敗をしたことがある」というものだった。これは「Laravelへの異常な愛情」を観た方から最も多く質問頂く点でもある。

コードを削った分だけ実例の具体度は落ちてしまったが、拡張を学ぶ目的はより強く共有できたと感じる。

## あまりにも広い題材、そして準備不足

プロポーザルを通過した時点から嫌な予感がしていたが、この題材でトークをするのであれば、100分は必要だったかもしれない。準備時間も3ヶ月では足りなかった。

話しきれない内容は多くあった。DBドライバの拡張はそれだけで40分欲しい。コーディング中につい脱線し `Application` や `Kernel` などの差し替えを試みて失敗した話は「魔改造」の反面教師として悪くなかった。Eloquentの拡張は、今回の説明とはまた異なるパラダイムを持っている。削りに削ったが、それでも時間を少しオーバーした。

心残りは、紹介の中で一番気に入っていた最後の拡張例を駆け足でしか説明できなかった点だ。この例は実は何も拡張していない、にも関わらずユーザーランドに「簡潔なコード」を提供できている。何もしないという選択肢も含め「調和」を模索する好例と考えたのだが、おそらく伝えられなかった。そこで早速次の機会に申し込んだ。

{% twitter https://x.com/phpstudy/status/1905251569039290550 %}

直近のPHP勉強会でその箇所だけ切り出した説明をすることにした。Laravelに限らない一般的な話題として話すので、主催や参加者の皆様、どうかお許しとお付き合いをお願いします。きっと面白い話です。

## 次のステップ

拡張はあくまで手段、目的はアプリケーションをシンプルに保つこと。

それとは別で、1つ大きな利点がある。趣味のコーディングなどある程度失敗できる状況を前提に、どんな題材でも良いので是非ともチャレンジして欲しい。フレームワークの理解度が一気に上るはずだ。

> *いつどんな場合でも、博士が私たちに求めるのは正解だけではなかった。何も答えられずに黙りこくってしまうより、苦し紛れに突拍子もない間違いを犯した時の方が、むしろ喜んだ。*
>
> 小川 洋子 (2003),  新潮社
> 博士の愛した数式

ちょっとしたパッケージへのプルリクエストならすぐに送れるようになるはずだ。そこまで至らなくとも、問題に遭遇した時に自分たちのコードが原因なのか、フレームワークのバグなのか仕様なのか、この程度の区別はすぐつけられるようになる。

今回のトークやこの記事が、Laravelの理解を深めるきっかけになってくれると嬉しい。

## 関連URL

### トークに言及頂いたブログ記事

* [「PHPerKaigi 2025 Day1」参加レビュー | 学び・セッション感想まとめ](https://let-bygones-be-bygones.com/2025/03/23/phperkaigi-2025-day1-review/)
* [#PHPerKaigi 2025に参加しました - なずなログ](https://akaa07.hatenablog.com/entry/2025/03/30/130240)
* [PHPerKaigi 2025 に参加してきました！ #PhperKaigi - Qiita](https://qiita.com/climber-miyagi/items/f3add49f2147a26ac28c)
* [PHPerKaigi 2025 に参加しました #phperkaigi | stenyan.dev](https://stenyan.dev/posts/2025/03/30/phperkaigi-2025)
* [PHPerKaigi 2025 参加 & 登壇レポート - Pepabo Tech Portal](https://tech.pepabo.com/2025/04/03/cn-phperkaigi2025/)
* [PhperKaigi 2025 参加レポート #PHP - Qiita](https://qiita.com/Alfredo/items/fae39dd1319892dea710)
* [PHPerKaigi 2025に参加しました vol.1｜かぴ | ゆーさく](https://note.com/ysssssss98/n/n317f4799d9d8)
* [phperkaigi2025に参加してきました！](https://zenn.dev/uiui/articles/3612f612fc190d)
* [PHPerKaigiに参加しての感想 #PHP - Qiita](https://qiita.com/Takuya_Kouyama/items/2f42983a5aaafd97e4af)

*ここに書かれていないURLをご存じの方はお知らせ下さい。ぜひ追加させて頂きたいと思います。*

### 資料中の参考リンク

* [[Kaigi on Rails 2024] Rails Way, or the highway - Speaker Deck](https://speakerdeck.com/palkan/kaigi-on-rails-2024-rails-way-or-the-highway)
* [[orm] Authentication - Laravel Doctrine](https://www.laraveldoctrine.org/docs/1.8/orm/auth)
* [「コンセプト」に気づけば実装の意図が分かる。Laravelスペシャリストに聞く、OSSを読む意義 | レバテックラボ（レバテックLAB）](https://levtech.jp/media/article/interview/detail_561/)
* [「貢献」ではなく「自分が楽をしたいから」。Laravelスペシャリストが語る、肩の力を抜いたOSS活動のススメ - Findy Engineer Lab](https://findy-code.io/engineer-lab/kentaroutakeda)
* [『博士の愛した数式』 小川洋子 | 新潮社](https://www.shinchosha.co.jp/book/401303/)
* [ext/pdo_pgsql: Expanding COPY input from an array to an iterable by KentarouTakeda · Pull Request #15893 · php/php-src](https://github.com/php/php-src/pull/15893)
* [ext/pdo_pgsql: Retrieve the memory usage of the query result resource by KentarouTakeda · Pull Request #14260 · php/php-src](https://github.com/php/php-src/pull/14260)
* [Laravel Nightwatch - Laravel専用監視サービス](https://zenn.dev/casti/articles/e5ef9ac2afebfa)
* [Laravel Nightwatch](https://nightwatch.laravel.com/)
* [laravel-doctrine/orm: An integration library for Laravel and Doctrine ORM](https://github.com/laravel-doctrine/orm)
* [Laravel12.x公式ドキュメント翻訳リポジトリ](https://github.com/laravel-ja/ja-docs-12.x)
* [Laravelが如何にダメで時代遅れかを説明する #Laravel - Qiita](https://qiita.com/MadakaHeri/items/e6034727fcab8b61b55e)
* [Laravel日本語ドキュメント 12.x サービスプロバイダ](https://readouble.com/laravel/12.x/ja/providers.html)
* [Laravel日本語ドキュメント 12.x パッケージ開発](https://readouble.com/laravel/12.x/ja/packages.html)
* [Laravel日本語ドキュメント 12.x リクエストのライフサイクル](https://readouble.com/laravel/12.x/ja/lifecycle.html)
* [Laravel日本語ドキュメント 12.x リリースノート](https://readouble.com/laravel/12.x/ja/releases.html)
* [Laravel日本語ドキュメント 12.x 認証](https://readouble.com/laravel/12.x/ja/authentication.html)
* [Packages Toolkit for Laravel](https://packages.tools/)
* [PHP 8.4 マニュアル翻訳状況 · Issue #150 · php/doc-ja](https://github.com/php/doc-ja/issues/150)
* [PHP: プロパティフック - Manual](https://www.php.net/manual/ja/language.oop5.property-hooks.php)
* [Rails vs Node.js 最終章 「Prisma」](https://mizchi-20241002-cf-meetup.pages.dev)
* [tpetry/laravel-postgresql-enhanced: Support for many missing PostgreSQL specific features](https://github.com/tpetry/laravel-postgresql-enhanced)
* [いろいろなフレームワークの仕組みを index.php から読み解こう / index.php of each framework - Speaker Deck](https://speakerdeck.com/okashoi/index-dot-php-of-each-framework)
* [エンタープライズアプリケーションアーキテクチャパターン（長瀬 嘉秀 長瀬 嘉秀 Martin Fowler 株式会社テクノロジックアート）｜翔泳社の本](https://www.shoeisha.co.jp/book/detail/9784798105536)
* [改めて整理するアプリケーション設計の基本 - Speaker Deck](https://speakerdeck.com/os1ma/gai-metezheng-li-suruapurikesiyonshe-ji-noji-ben)
* [重要なのは「基本を押さえ、適したものを採用すること」　“本来の役割”を押さえたアプリケーション設計 | ログミーBusiness](https://logmi.jp/main/technology/328341)
