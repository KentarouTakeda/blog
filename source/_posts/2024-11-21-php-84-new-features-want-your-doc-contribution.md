---
title: PHP 8.4 新機能の紹介と日本語ドキュメントへのコントリビューション
subtitle: 本日はPHP 8.4のリリース日です。新機能を見てみましょう。おや？
description: PHP 8.4リリース！プロパティフック、非対称可視性プロパティ、レイジーオブジェクトなど、開発を進化させる新機能を網羅。翻訳活動でコミュニティを支える方法も解説。
date: 2024-11-21 18:00
ogimage: ogimage.webp
tags:
  - PHP
---

この記事は、11月21日開催予定 [第170回 PHP勉強会＠東京](https://phpstudy.connpass.com/event/335943/) （ハッシュタグは [#phpstudy](https://x.com/hashtag/phpstudy) ）のメイントーク資料、およびその補足ポエムです。イベント開催の前日に、この文章を書いています。

## トーク資料: PHP 8.4 新機能紹介

{% reveal "2024-11-21-php-84-new-features-want-your-doc-contribution/" %}

## PHPドキュメントの現状

類を見ない量の機能が追加されたPHP 8.4だが、マニュアルが整備されないと使う人は限られる。だが、その執筆状況は、原文の英語、翻訳の日本語、共に厳しい。PHPやそのドキュメントも他のOSS同様、活動量の多い小数のコントリビューターに依存している状況だ。

メジャーバージョンアップの前後は特に大変になる。原文がリリース直前の完成となるため、追随する日本語訳のスケジュールは非常にタイトだ。そして、今年は例年になく厳しい状況と耳に入ってきた:

{% twitter https://x.com/youkidearitai/status/1851922515234275754 %}

## 日本語ドキュメントへの貢献

PHP 8.4には自分が作った新機能も入っている。それらのマニュアルは、英語、日本語、共に自分が書いた。その執筆を終え、リリースへ向けた自分の作業は終わりと認識していた。

だが、日本語全体が厳しいと知ってしまうとそうは言ってられない。30年ぶりのC言語の勉強（復習）材料として過去1年のコード変更はざっと見ている。以前{% post_link 2024-04-03-contributing-to-hexos-japanese-documentation Hexoのドキュメントを全て翻訳 %}した経験もある。何より、たとえ末席であっても、メンテナというものに名を連ねてみたい。

機を逃すと後悔しそうだったので、過去のPHPへの貢献やHexoの実績を添えて（少々、熱い文章で）[アカウントをリクエスト](https://news-web.php.net/php.doc/969388464)した。なんと翌日に[承認](https://news-web.php.net/php.doc/969388465)されてしまった。

おかしな話だが困惑した。望んで手を上げたものの、リリースまで2週間。原文は半分も完成していない。日本語訳は更にその4分の1程度。間に合う気がしない。どうしよう。

アカウントが付与された。要は「他の人には出来ないことが自分にはできる」ということだ。チームプレイの鉄則は、各々が「自分にしか出来ないこと」を見極め実践することだ。翻訳自体はプルリクエストという形で皆が参加できる。必然的に、自分の役割はタスクの追跡やレビュー、情報収集ということになる。

真っ先にIssue Trackerを作成した:

{% link_preview https://github.com/php/doc-ja/issues/150 %}
[php/doc-ja#150 PHP 8.4 マニュアル翻訳状況 #150](https://github.com/php/doc-ja/issues/150)
{% endlink_preview %}

意識してXに、出来るだけ高い頻度で元気に投稿した:

{% twitter https://x.com/KentarouTakeda/status/1854461443133038899 %}

何名か、プルリクエストを送ってくださるようになった:

{% twitter https://x.com/KentarouTakeda/status/1855183514791981244 %}

進捗を出来るだけ、元気に投稿した:

{% twitter https://x.com/KentarouTakeda/status/1858039635366260975 %}

非常に簡潔なビルド環境を公開して下さる方も現れた:

{% twitter https://x.com/jdkfx/status/1855214575118844098 %}

今もなお更新されている上流の英語マニュアルは、随時ウォッチしなければならない:

{% link_preview https://github.com/php/doc-en/issues/3872 %}
[php/doc-en#3872 PHP 8.4 documentation tracker](https://github.com/php/doc-en/issues/3872)
{% endlink_preview %}

~~感想:~~

~~*「仕事か…」*~~

冗談はさておき、プルリクエストを送って下さっている方には本当に感謝している。お会いできる機会があれば、是非とも直接お礼をお伝えしたい。

現実的には、英語版が終わっていない以上は日本語版も全て揃うことは無い。だがお陰様で、目玉となる新機能や多くの人が使うであろう個別の機能は概ね翻訳できている。実は自分自身も大量の翻訳をしたが、それが出来たのは、取り組んでいるのは決して自分だけではない安心感や、PHP 8.4自体を熟知せずとも翻訳可能な細かい箇所を取り組んで下さる方がいたからこそだ。

## 自分にとっての PHP 8.4

PHP 8.4は自分にとって、とても思い入れのあるバージョンだ。このバージョンは、自分のプログラミングに対する考え方を大きく変えた。

空いた時間は出来るだけOSSへの貢献に充てるようにしている。以前は、大きなものではLaravel、他にPHPやJavaScriptの小さなライブラリが主だったが、1年ほど前から、C言語で書かれたPHP自体のソースコードにプルリクエストを送るようになった。

普段とは全く異なるパラダイムの言語や設計、20年前のコードと2週間前のそれとが隣に並ぶ巨大なコードベース、破壊的変更を丁寧に避けながら革新的な新機能を模索する仕様検討プロセス、世界レベルのプログラマーとの会話やコードレビュー、どれも鮮烈な体験だった。そして最後の最後、自分から手を上げて自分が旗り皆で成果を出すという、エンジニアリングとは全く別の興奮を味わった。関係各位には本当に感謝している。

文章はこれで締められていそうだが、ドキュメントの整備はまだ終わっていない。未訳、それ以前の原文未完成、完成の原文も随時改善されている。それらに追随する作業をしばらく続ける必要がある。

実を言うと、長期に渡り私だけでそれを継続することは難しい。今回はPHP 8.4に触発され多くの時間を割いたが、本業に若干の支障を出している。今後は、コミュニティの協力を仰ぎながら、より多くの皆さんと翻訳を整備していく土台を作っていくことが課題と認識している。

ご興味のある方、是非ともご連絡ください！IssueやPull Requestも歓迎です！