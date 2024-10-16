---
title: いかにして問題をとくか
subtitle: 私達エンジニアは「いかにして課題を解決するか」
description: 数学からエンジニアリングへ。Gポリア著『いかにして問題をとくか』が教える普遍的な問題解決の手法をエンジニア視点で解説。
date: 2024-06-27 18:00
ogimage: ogimage.webp
tags:
  - essay
---

この記事は、6月28日開催予定 [PHPer Tea Night #18 - 技術書オススメバトル](https://phper-tea-night.connpass.com/event/320327/) への参戦エントリです。

## Gポリア著「いかにして問題をとくか」

![いかにして問題をとくか 柿内賢信訳 G.ポリア著 丸善出版](cover.jpg)

およそ80年前、「数学」という分野より、この本は出版された。

そして今に至るまで、数学に留まらないあらゆる分野の課題解決本として参照され続けている。

ソフトウェアエンジニアリングの世界でも評価は高い。元よりエンジニアは、あらゆる問題や課題を、抽象化、汎化、定量化、そして言語化することも生業としている。それをポリアはこの本の中で、「数学」という例題を通じて汎用的にやってのけた。

ここで言う「問題」とは特定の数学問題を指しているわけではない。数学に限らない、私達が出会ったことのない「未知の問題」を指している。

従って、私達エンジニアは、この本の表題を次のように読み替える。

***「いかにして課題を解決するか」***

{% link_preview https://www.maruzen-publishing.co.jp/contents/howtosolveit/index.html %}
{% endlink_preview %}

## 問題解決の原則工程

邦訳版で240ページとなる本書だが、実は全編に渡り、ポリアは同じことしか述べていない。

<!-- textlint-disable ja-technical-writing/ja-no-redundant-expression -->

1. 問題を理解する
2. 計画を立てる
3. 計画を実行する
4. 振り返る

<!-- textlint-enable ja-technical-writing/ja-no-redundant-expression -->

見慣れた開発フレームワークとほぼ同じ内容だ。

邦訳版ではご丁寧に、訳者による要約が表紙見返りに再掲載までされている。それぞれ個別に見ていきたい。

### 問題を理解する

問題の理解は、次の3つの問いを通じて行う。

* 未知のものは何か？
* 与えられたものは何か？
* 条件は何か？

ここで言う「与えられたもの」とは、大まかな機能開発など粒度の粗い課題の場合「ユーザーストーリー」が相当するかもしれない。その場合「未知のもの」は「ユースケース」が該当する。

バグ修正チケットなどの場合、「期待する動作」に対する「実際の動作」、そして、差異の発生する「再現条件」が「与えられたもの」だ。「未知のもの」とは言うまでもなく、バグの原因である。

こんなあたり前のことが手を替え品を替え述べられ続ける。「**よく**理解する」「**十分に**理解する」「**様々な角度から**理解する」など、表現も念入りだ。

バグ修正にせよ機能追加にせよ上流の課題解決にせよ、与えられたものや条件を十分に理解しないまま作業や工程を進めてしまい後で大きな痛手を被った、そんな経験は誰しも持っていることだろう。

それを防ぐ簡単な方法が、これらのシンプルな問いだ。

* 未知のものは何か？
* 与えられたものは何か？
* 条件は何か？

### 計画を立てる

いくら理解しても、難しい問題はやはり難しい。そこでこの「計画」というフェーズが役に立つ。

書中のテクニックを、エンジニアリングになぞらえながら紹介する。

#### 問題を分割できないか？

難度の高いタスクはまず分割し工程を整理すると効率が良い、ビックバンリリースを避け小さなリリースを繰り返すことが価値と品質の両面で有利、これらのことはよく知られている。

#### 問題を変形できないか？

分割するためにはそれより前の工程である程度の変形が必要なことも多い。リリース時のダウンタイムをなくすためデプロイを機能本体と前段のマイグレーションとに分割するような場合、元の要件であった「ユーザーデータの追加」という問題は「テーブル定義の変更」と予め変形されている必要がある。

#### 既に解いた似た問題を使えないか？

バグ修正であれば「過去の類似した修正の横展開」が相当する。これがシンプルな例だ。

より高度または汎用的な例も考えられる。CSVダウンロード機能の性能に困っている場合、過去に実装した「メール送信機能」が使えるかもしれない。解法は何れも「バックグラウンドでの非同期処理」となる。

抽象度の高い問題であれば、「似た問題」は「パターン」という形で世に広く知れ渡っている。「変形」もそうだが、このフェーズでは引き出しの多さや運が必要になることもある。ここばかりは、各々が精進するしかない。これに関しては後でも述べる。

#### データを全て使ったか？

例えば `function add(int $a, int $b): int;` という *とても難しい* 機能の設計をしたとする。見返したところ、どうやら `$b` という変数は実装の中で使われなさそうだ。

さて、この設計は正しいだろうか？もちろん、現実の問題はこれよりも複雑だ。

この指標には少し解説が必要だ。本書の元々の題材は「数学の問題を解く」である。この世界では、例えば「底辺の長さが x である三角形の面積を求めよ」といった不完全な問題は想定しない。

だが、私達の向き合う課題はそうとは限らない。過剰な設計により冗長なパラメータが紛れ込んでいるかもしれない。テストNGの結果報告にバグの再現条件が不足なく含まれていることは期待できない。

従ってこのテクニックは:

> 1. 過剰なデータはないか？（あれば設計を再考）
> 2. 不足しているデータはないか？（あればエスカレーション）
> 3. その上で **データを全て使ったか？**

このように応用して対応する必要がある。もちろん本書で触れられている。

### 計画を実行する

計画を立てたら、あとは実行するだけだ。ここは本書を引用しよう。

> これに引きかえ計画を実行するのははるかにやさしい。必要なのは主に忍耐だけである。

計画段階で問題を小さく分割していることが多いと思う。その場合重要となるのが、分割されたそれぞれの工程に誤り（計算ミス、誤謬、あるいはコーディングミス）がないことを確かめながら進めることだ。ここも突き詰めれば「忍耐」である。

同じく課題の達成を主題とした [国内屈指の実力派エンジニア](https://x.com/soudai1025) のブログ記事にも、同じ言及がある（同じ程度の言及しかない）。

> 3. 実行する

{% link_preview https://soudai.hatenablog.com/entry/2020/12/31/165940 %}
{% endlink_preview %}

### 振り返る

この「振り返り」は、私達が普段使う同じ言葉よりも少し意味が広い。ここでは、私の解釈と言葉で紹介していく。

#### 結果を試す: 自己レビュー・テスト

`$b` が *Unused Parameter* である `add()` 関数はおそらく間違っている。 `$taxRate * $price` はおそらく正しいが `$taxRate + $price` は間違いだ。この程度の自己レビューであればある程度機械的に行える。Lintに任せることもできる。

テストの実装もこのフェーズに分類される。 `$this->assertSame(1 + 2, add(1, 2))` というテストは書いてもほとんど意味がない、ここで網羅テストや境界値テストなどの出番になるわけだが、これらの検討もまた「（本書の定義における）振り返り」の一環である。「足し算」のテストであれば「交換法則は成り立つか？」というテストが有効かもしれない。

このように、問題の解答を、多角的な観点から検討する。上に挙げた例は何れも、本書に掲載されたテクニックを応用したものだ。

#### 他の問題に応用: 水平展開・知見の共有

こちらは、私達がよく使う「振り返り」と近いかもしれない。

せっかく課題を解決したのであれば、その手法を、現在または未来に遭遇する他の課題に応用することをその場で考えよう。

```php
/** 辺の長さがそれぞれ a, b, c の直方体の対角線の長さを求める */
function getRectangularPrismDiagonal(
  float $a,
  float $b,
  float $c,
): float;
```

```php
/** 座標空間上の点 (x, y, z) の原点からの距離を求める */
function getDistanceFromOrigin(
  float $x,
  float $y,
  float $z,
): float;
```

この2つの関数は、おそらく全く同じ実装になる。

与えられた直接の課題は前者かもしれない。その場合、「a, b, c は正数」という事前条件が暗黙で存在する。だが問題を後者に拡張することで、実装は全く変わらないまま事前条件を撤廃し、別の問題を解くことが出来ている。

この応用を *DRY* と考えるか *誤ったDRY* とするかは状況によって異なるが、前者であれば「振り返り」の過程で別の課題も一緒に解決してしまおう。仮に後者だったとしても、こういった観点での熟考は、将来の別の課題での「計画 - 既に解いた似た問題を使えないか？」へと確実に繋がっていく。

苦労して実装を終えたのであれば、そこで仕事を終わりにしてしまうのはあまりにも勿体ない。ぜひとも、未来の自分や他人へその知見を共有しよう。

## 後記

ポリアがこの本を通じて解いたのは「数学の問題」でも「何らかの個別の問題」でもない。「いかにして問題をとくか」という、メタな問題を数学という観点より解いた。

その解法の本質は、私達エンジニアにとっての金言「ドメインと向き合う」と全く同じものだ。80年前に導き出されたロジカルな解法に、少しでも興味を持って頂けたら幸いだ。

ところで、この題材で参加することは予め決めていたのだが、偶然にもエントリーの直後に [ヨビノリたくみ](https://x.com/Yobinori) 氏がご自身のYouTubeチャンネルでこの本を取り上げていた。

{% link_preview https://www.youtube.com/watch?v=sC5miUc1MgQ %}
{% endlink_preview %}

この記事より「数学」にフォーカスした紹介だが、持ち前のひたすらわかりやすい説明が心地良い。少し別の視点でこの本を知りたい方は、ぜひともご覧いただきたい。