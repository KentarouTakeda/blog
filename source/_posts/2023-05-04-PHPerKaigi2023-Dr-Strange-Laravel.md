---
title: 「Laravelへの異常な愛情 または私は如何にして心配するのを止めてEloquentを愛するようになったか」補足記事
description: PHPerKaigi 2023登壇の補足。Laravel Wayを突き詰めるモチベーションと、開発効率を優先したフレームワーク活用の考え方。
date: 2023-05-05 18:00
tags:
  - PHP
  - phperkaigi
  - essay
  - Laravel
---

[PHPerKaigi 2023](https://phperkaigi.jp/2023/) に40分レギュラートークで登壇した。  
（[プロポーザル](https://fortee.jp/phperkaigi-2023/proposal/6211083d-fc51-49a3-8b27-485d8e231b1f) / [スライド](https://speakerdeck.com/kentaroutakeda/laravelhenoyi-chang-naai-qing-matahasi-haru-he-nisitexin-pei-surunowozhi-meteeloquentwoai-suruyouninatutaka) / [動画](https://youtu.be/QHjRGPw34EI)）

{% twitter https://twitter.com/KentarouTakeda/status/1639482557141241856 %}

トークの中で紹介した記事や後日頂いたフィードバックのURL、また登壇のモチベーションや失敗談などを紹介する。

## スライド中で紹介した記事やURL

* [History of Laravel - Qiita](https://qiita.com/kumamon_engineer/items/c4ac0942fa01d4617b38)
* [CodeIgniter へようこそ — CodeIgniter 3.2.0-dev ドキュメント](https://codeigniter.jp/user_guide/3/general/welcome.html)
* [アプリケーションのひな型を生成 - railsコマンド(rails) | Railsドキュメント](https://railsdoc.com/rails#rails_scaffold)
* [Ruby (off|with) the Rails (Shinpei Maruyama) - builderscon tokyo 2019](https://www.youtube.com/watch?v=g7nU45RgBvw)
* [Ruby (off|with) the Rails - Speaker Deck](https://speakerdeck.com/shinpeim/ruby-off-with-the-rails)
* [5年間 Laravel を使って辿り着いた，全然頑張らない「なんちゃってクリーンアーキテクチャ」という落としどころ](https://zenn.dev/mpyw/articles/ce7d09eb6d8117)
* [第150回 PHP勉強会＠東京 #phpstudy - YouTube](https://www.youtube.com/live/qz9Y-WXgxxY?feature=share&t=9672)
* [Eloquentとクエリビルダを両方使った実装の失敗例 - 第150回 PHP勉強会 #phpstudy - Speaker Deck](https://speakerdeck.com/kotomin_m/eloquenttokueribirudawoliang-fang-shi-tutashi-zhuang-noshi-bai-li-di-150hui-phpmian-qiang-hui-number-phpstudy)
* https://twitter.com/taylorotwell/status/1560020999378292736
* [[10.x] Uses PHP Native Type Declarations 🐘 by nunomaduro · Pull Request #6010 · laravel/laravel](https://github.com/laravel/laravel/pull/6010)
* [[10.x] Uses PHP Native Type Declarations 🐘 by nunomaduro · Pull Request #44545 · laravel/framework](https://github.com/laravel/framework/pull/44545)
* https://twitter.com/taylorotwell/status/1592227118481805312
* [Laravel 10 Application Skeleton Code Will Have Native Type Declarations | Laravel News](https://laravel-news.com/laravel-10-type-declarations)
* [Laravel 10 / Release Notes - Laravel - The PHP Framework For Web Artisans](https://laravel.com/docs/10.x/releases#laravel-10)
* https://twitter.com/dillinghamdev/status/1626989292227551232
* [Laravel Daily - YouTube](https://www.youtube.com/c/LaravelDaily)
* https://twitter.com/taylorotwell/status/1626987187274129408
* https://twitter.com/taylorotwell/status/1626987508369178624
* [Use mixed return type on controller stubs by taylorotwell · Pull Request #46166 · laravel/framework](https://github.com/laravel/framework/pull/46166)

## 登壇に言及いただいたブログ記事など

* [PHPerKaigi 2023に初参戦してきました！ | ランサーズ（Lancers）エンジニアブログ](https://engineer.blog.lancers.jp/php/phperkaigi-2023%E3%81%AB%E5%88%9D%E5%8F%82%E6%88%A6%E3%81%97%E3%81%A6%E3%81%8D%E3%81%BE%E3%81%97%E3%81%9F%EF%BC%81/)
* [PHPerKaigi2023に参加してきたよ - テコテック開発者ブログ](https://tec.tecotec.co.jp/entry/2023/04/03/000000)
* [PHPerKaigi 2023にコアスタッフとして參加しました - muno_92の日記](https://muno-92.hatenablog.com/entry/2023/04/12/011040)
* [PHPerKaigi 2023 に参加しました！ #phperkaigi - がんばるぞ](https://y-ahiru.hatenadiary.jp/entry/2023/03/29/105522)
* [PHPerKaigi 2023に3名のメンバーが登壇・プラチナスポンサーとして協賛しました - BASEプロダクトチームブログ](https://devblog.thebase.in/entry/phperkaigi2023)
* [PHPerKaigi2023に参加しました - Qiita](https://qiita.com/Eokutsu/items/2fb0fc41ed5af8d95c57)
* [PHPerKaigi2023参加レポート](https://zenn.dev/tikamoto/articles/8bcc557d83633a)
* [【PHPerKaigi】オフラインカンファレンスの魅力 - Qiita](https://qiita.com/taimax/items/7e6c96978ad8151e8041)
* [PHPerKaigi 2023に参加しました & 登壇しました #phperkaigi - 大好き！にちようび](https://daisuki.nichiyoubi.land/entry/2023/03/27/014217)
* [hanhan's blog - PHPerKaigi 2023 Day 2 参加記録](https://blog.hanhans.net/2023/03/25/phperkaigi2023-day2/)
* [PHPerKaigi2023で「PsySHを使った効率的なデバッグ方法について」を発表しました - Endo Tech Blog](https://www.fendo181.me/entry/spoke-at-phperkaigi2023)

*※ページタイトル50音順。こちらに掲載されていない記事をご存知の方は是非ともお知らせ下さい。追加させて頂きます。*


## 登壇のモチベーション - 開発の効率化

コードの意図を理解し、人に伝える労力を最小限にしたい。これがモチベーションだ。

これまで数多くのPHP案件に関与してきた。自分が参加する時も他者に参加してもらう時も、既存コードを理解するのに一定の時間が必要となる。これは避けられないことだが、開発チームのスケーラビリティも重要だ。タスクが山積みで人手が欲しい時、人を増やすこと自体は可能でも、新しいメンバーと情報を共有する手間が問題となることがある。この部分のコストを抑えられれば開発がより効率的になると考えていた。

そんな時、Ruby on Railsでの開発に次々と関わる機会があった。新メンバーが加わった際の立ち上がりの速さに驚いた。

新しく参加したメンバーが、ドメイン知識は別としてコードベースの知識で経験豊富なメンバーと対等に議論する様子を何度も目にした。最初はその人の能力によるものかと思ったが、それだけではなさそうだった。全員が平均的に速いのだ。

何が違うのだろうと思い [Ruby on Rails チュートリアル](https://railstutorial.jp/) を実践してみた。すぐに理由が解った。APIリファレンスやサンプルコードでは説明しきれない、Rails開発の「型」のようなものが明確に示されていた。他のメンバーに聞いてみると、ほとんど全員がこのチュートリアルから学んでいることが解った。

> LaravelにもRails Tutorialみたいな、とりあえずこれやっとけ的なやつが欲しい
>
> *https://b.hatena.ne.jp/entry/4734153958419525444/comment/hate_nao*

このチュートリアルは初学者にとって有益でありながら、Ruby on Railsでコードを書く際のベストプラクティスも示してもいる。確かにLaravelにはこれに相当するコンテンツが無い。これが、RailsとLaravelとの間で発生する「キャッチアップの所要時間の差」の正体と理解した。

幸いなことに自分の手元にはレビュアーとして書いた文章の蓄積や[過去に書いたblog記事](/post/2022-07-17-laravel-coding-guideline/)がある。それらを再編し発表し洗練することで、問題に対処できると考えた。これが登壇のモチベーションだ。

## Laravelの設計 - それでもLaravelを使う理由

登壇の冒頭でLaravelに対する厳しい意見を紹介した。また途中でFacadeの注意点にも触れた。OOP原則から見て適切とは言い難い実装が数多く存在すると私も考えている。

これらの機能を一切使わず「正しい」コードを書く選択ももちろん有効だ。しかしそうすると前述の課題にぶつかってしまう。プロジェクトごとの「流儀」が生まれてしまうのだ。例えばこんな具合に。

* ~~`Storage` ファサードを使う。~~
* `interface Filesystem` をDIコンテナで解決する。
* `league/flysystem` を直接使う。
* 独自実装する。

「このLaravelとあのLaravel、全く別物じゃないか。」は私が以前書いた記事の冒頭の一節だ。要はこれを避けたいのだ。

{% twitter https://twitter.com/mpyw/status/1639489761479118848 %}

つまり私の主張は、プログラムの正しさより局所的なプロダクト開発効率を優先した1つの形と言える。単一の自社プロダクトをある程度固定されたメンバーだけで開発している場合など、必ずしも *Laravel Way* を突き詰める必要のない状況も存在するため、そこは各位、適切に使い分けて欲しい。

*※余談だが、開発が真に効率化され偶有的困難さからプログラマーは開放されそこで空いた時間をより本質的な設計などに使うことで、開発の効率化がゆくゆくはプログラムの正しさに還元されるとも考えている。この点は意見が分かれるかもしれない。*

## 登壇タイトルと反省点

*ここから先はプログラム成分ゼロの趣味の文章。古典映画やカルト映画が好きな方向け。*

{% twitter https://twitter.com/KentarouTakeda/status/1639918093857353728 %}

鬼才、スタンリー・キューブリックの伝説的映画「博士の異常な愛情」が登壇タイトルの元ネタだ。

半世紀以上前のモノクロ映画だ。知っている人はそう多くないだろうと予想してはいたが、それにしても見込み違いだった。

> ### あらすじ
> 
> 冒頭にアメリカ空軍による「**映画はフィクションであり、現実には起こりえない**」との趣旨の解説が流れる。
>
> *[博士の異常な愛情 または私は如何にして心配するのを止めて水爆を愛するようになったか - Wikipedia](https://ja.wikipedia.org/wiki/%E5%8D%9A%E5%A3%AB%E3%81%AE%E7%95%B0%E5%B8%B8%E3%81%AA%E6%84%9B%E6%83%85_%E3%81%BE%E3%81%9F%E3%81%AF%E7%A7%81%E3%81%AF%E5%A6%82%E4%BD%95%E3%81%AB%E3%81%97%E3%81%A6%E5%BF%83%E9%85%8D%E3%81%99%E3%82%8B%E3%81%AE%E3%82%92%E6%AD%A2%E3%82%81%E3%81%A6%E6%B0%B4%E7%88%86%E3%82%92%E6%84%9B%E3%81%99%E3%82%8B%E3%82%88%E3%81%86%E3%81%AB%E3%81%AA%E3%81%A3%E3%81%9F%E3%81%8B)*

物語の構造はこうだ。

* 前提としてフィクションである。物語の鍵を握る人物は全員が異常者である。
* 笑うしかないようなあり得ない出来事が劇中で起こり続ける。結果、世界は滅びる。
* **このフィクションで描かれる冗談のような世界は、現実より現実味を帯びている。**

冗談のような現実にどう向き合うか、この着想と共に「降りてきた」のが今回の登壇タイトルだった。

OOP原則に則ったコードを息を吐くように書ける人にとってLaravelというフレームワークは何かたちの悪い冗談に見えているはずだ。一方でそんなフレームワークが人気トップという奇妙な現実も存在する。

そんなLaravelに対する純度100%のポジショントークをキューブリックの映画になぞらえたタイトルとともに展開するという、要はネタなのだが、そうではない真正面からの高評価を多く頂いてしまった。大変ありがたいと同時に、複雑な心境でもある。~~次回はせめて国内作品から登壇タイトルを着想したいと思う。~~

![](https://www.sonypictures.jp/themes/custom/spej/images/title-page/keyart/4146.jpg)
https://www.sonypictures.jp/he/4146
