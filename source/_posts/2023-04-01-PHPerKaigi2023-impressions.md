---
title: PHPerKaigi 2023 感想
date: 2023-04-01 18:00
tags:
  - PHP
  - phperkaigi2023
  - phperkaigi
---

PHPerKaigi 2023感想。[fortee](https://fortee.jp/phperkaigi-2023) より登壇者の方へ送ったフィードバックと同じ内容。他の方のブログなどを読み、同じ登壇に対し他人がどのような感想を持ったかを知るのも学びの機会になると気づきでは自分の分もブログにも掲載することにしました。~~いえ、単にフィードバックとブログを別で書く時間がないだけです。~~

今回は登壇もさせて頂いたので、そのレポートや余談、解説しきれなかった内容などを近日中に別の記事として掲載する予定です。

## [名著「パーフェクトPHP」のPart3に出てきたフレームワークを令和5年に書き直したらどんな感じですかね？](https://fortee.jp/phperkaigi-2023/proposal/db787adc-c855-4114-99b6-8c6958d47b42) [@o0h_](https://twitter.com/o0h_)
 

後輩に是非とも聞かせたいと感じる非常に価値のあるトークでした。ありがとうございました。

まずは歴史や（過去の）仕様の話をし、それらと最新仕様とを比較した上でいざ実装という流れだったので、それぞれ何を目的に実装されているのかなどが必然的に示されていた、と感じます。

周囲のエンジニアの中でも特に「一通り書けるようになったので次は設計とか意識してみて欲しい」くらいのレベルの人たちにどんどんシェアさせて頂きたいと思います！

## [名付けできない画面を作ってはならない - 名前を付けるとは何か](https://fortee.jp/phperkaigi-2023/proposal/c740e87e-6808-43ae-bdff-a798e999cdd4) [@chatii](https://twitter.com/chatii)

周囲に伝えたいと感じ続けていたことをほとんどそのまま語って頂いたような内容でした。

画面にせよ機能にせよ、変数名にせよはたまたプロダクトにせよ、微妙な名前を付けられてしまったために意識統一に支障が生じ結果的に出来上がるものも微妙、というケースを様々なプロジェクトで見てきました。「名前が悪い！」とそのまま指摘しても聞いてもらえるはずもないので、定期的に苦労している気がします。

「オーナーシップの重要性」というテーマであると理解しました。重要だが軽視もされがち、でも難しくないはず、というメッセージがすっと入ってくるプレゼンだったと感じてます。定期的に見たり必要に応じてシェアしていきたいと思います。

## [技術負債とプロジェクトと私たち](https://speakerdeck.com/weddingpark/phperkaigi2023-ji-shu-fu-zhai-topuroziekutotosi-tati-technical-debt-and-project-and-us) [@WeddingParkTECH](https://twitter.com/WeddingParkTECH)

登壇ではサラリと語られてましたが実際には長い道のりだったと思います。お疲れさまでした。

テストの価値を非エンジニアにも説明しながらの進行、これだけで大変だったと思いますが、テストに端を発し実装側のリファクタリングなども行われていくなど、強い改善の意志が感じられました。

バリデータの例は非常に良かったと思います。テストそれ自体だけでなくテストの整備により実装が必然的に綺麗になっていく、これもテストの大きな効果。その実例が端的に説明されていると感じました。

コミュニティへのアウトプットやそのフィードバックがモチベーションになっていた、という点も好感が持てました。この点を会社ぐるみで評価してくれる組織は意外と少ない気がしているので、非常に良い雰囲気なんだろうな、と想像しました。

## [ウォーターフォールに思えたプロジェクトにあったアジャイルの要素](https://fortee.jp/phperkaigi-2023/proposal/9fc52c6a-a295-4bbf-a465-9d27110dc7db) [@kubotak_public](https://twitter.com/kubotak_public)

アジャイルは実践したことがなく、用語を何となく知っている程度の知識で聞いていました。

ウォーターフォールでも小さなプロジェクトだと、途中でスコープを変えたり要件をバラしたりなど（私は）普通にやるのですが、そういった際の注意点が「権利」という言葉で一通り述べられていました。これまでは「本来はルール違反ながら進行上ここは変える」というトップダウン的な説明で進めてきてしまっていたのですが、そうではなく誰でも再現可能な判断の仕方のヒントを頂いた気がします。実践してみたいと思いました。

## [PHPをブラウザで動かす技術](https://fortee.jp/phperkaigi-2023/proposal/de0c3936-8780-487b-a9ce-92a8b90da480) [@glassmonekey](https://twitter.com/glassmonekey)

広い範囲の技術を知ることや、それらをどう組み合わせるか考えを巡らせることの楽しさや価値を垣間見せられました。

トークの中では、TypeScript、C、C++のコードが登場していました。コードだけを見るとそこまで高度な技術を駆使してるわけでもなく、ある程度その言語に精通している人であれば難なく書ける内容だった思います。

ではそれらを書ける全員がブラウザでPHPを動かせるかというとおそらく無理、TSとCとC++のプログラマ合計3名がかりPHP Playground作るのもかなり難しい。どの技術どどの技術を組み合わせ、足りない部分はどの先行プロダクトの力を借り、など総合的な設計力やアイデアを駆使した賜物なのだろう、と想像しながら聞いていました。

という観点での設計やアイデアの面で学びの大きいトークでした。ありがとうございました。

## [PHPで学ぶ "Cacheの距離" の話](https://fortee.jp/phperkaigi-2023/proposal/280706e0-7158-4237-8202-c9d64330b96f) [@hanhan1978](https://twitter.com/hanhan1978)

内容自体は感覚的に、あるいは経験的に知っていたものの、実のところきちんと計測した上で実施したことがあまりありません。そのおかげもあり特にパフォーマンスチューニングなどは人に引き継いだりノウハウを共有することが出来ず困ってました。

きちんと計測し筋道だって説明していけば共有もできるだろう。頭では解っていつつなかなか食指が動かなかったものの、今回のトークでは多くの数字的な根拠や設計上の裏付けが示されており、なるほどこうやって説明していけば何となりそうだ、という感触を得られました。いい機会を頂いたので試してみようと思います。

## [ブラウザの向こう側で「200 OK」を返すまでに何が起きているのか調べてみた](https://fortee.jp/phperkaigi-2023/proposal/f7f2f18a-e6b0-47e4-ade0-e324f72428ae) [@akase244](https://twitter.com/akase244)

HTTPプロトコルの概要を網羅的に学べるトークでした。

基礎として是非とも理解すべきだが普段の業務では触れる機会が意外と少ない、そういった分野を学びやすいのもカンファレンスの魅力のひとつなので、まさに聞きたかった内容です。

curlコマンドを駆使しながら出力内容を端的に説明する構成は非常に解りやすく、そしてcurlコマンド自体の使い方の説明にもなっており、見事な説明だったと思います。

一方この説明で一点だけ惜しいと感じた点があります。説明範囲をHTTP/1.1以下に絞り、かつリクエストレスポンスのフォーマットの解説もしていました。であればcurlすら使わずnc(netcat)やtelnetでそのプロトコルを手打ちで送ってみるような解説やデモが一例でもあれば「HTTPとは言えども所詮はテキストのやり取り」という事実を多くの人がより身近に実感できたのではと思います。

後半「阻む技術」も優れた内容でした。HTTPに限らないネットワーク全般の知識を網羅的に解説しながらトラブル事例や問題切り分けの方法を紹介。個人的には、これら事例集やノウハウを掘り下げた形で単独のトークとして聞いてみたいとすら思いました。

## [時間を気にせず普通にカンニングもしつつ ISUCON12 本選問題を PHP でやってみる](https://fortee.jp/phperkaigi-2023/proposal/7e212cb2-be37-43e8-b6ee-5236d259fcbf) [@sji_ch](https://twitter.com/sji_ch)

パフォーマンス改善のノウハウ共有に困難を感じていた自分にとって、非常に有り難いトークでした。

パフォーマンス改善、手順や考え方などはある程度確立されていると思うのですが「リアルな」記録として公開されているコンテンツが少ないと感じてます。業務やシステム上の機密が含まれることが多いので当然なのですが…

その上で今回のトーク、題材こそISUCONですが改善の度に新たな問題にぶつかる様など現実での取り組みと同じ軌跡が「スコア」という指標と共に克明に記録されており、つまりモデル事例として完成されているように見えます。ISUCONのブログを読んでもここまで体系的にまとめられた資料はありません。悩んでいるプロジェクトを見つけたらまずは今回のトークを紹介させて頂きつつ、また自分が何らか改善した際も今回のような形で記録を残せるようになりたいと思いました。

個別の箇所では、自分の作ったプロファイラなので慣れていて楽という点、AltFPMはどうせ必要になるので素振りが重要という点、これらが印象に残りかつ同意を感じました。改善活動はその時だけの知見では成立し得ず普段からの準備あってこそ、ということだと理解しています。この点も広めていきたいと思います。

## [Composerを「なんとなく使う」から「理解して使う」になる](https://fortee.jp/phperkaigi-2023/proposal/46c96d4a-194d-4bde-a4d8-f9c82c3b0302) [@asumikam](https://twitter.com/asumikam)

題材であるcomposer（依存管理）にせよそれ以外にせよ「動いているのでヨシ」と済ませてしまうことを決してせず、仕組みや概念を率先して理解しシェアする姿勢に好感が持てました。別の登壇でもそう感じています。

後半のDockerの話は一見するとcomposerとは無関係ですが、そこで紹介されていたマルチステージビルドやイメージ運用の手法はcomposerの動作をある程度知っていないと行えないのも確かです。前半を「ちゃんと理解した！」からこそ後半の取り組みも行うことができた、何かを学ぶことで別のなにかの学びも深まるような、言わば研鑽の醍醐味のようなものを味わえる構成だったと感じます。

## [データの民主化はじめました 〜俺たちの民主化はこれからだ〜](https://fortee.jp/phperkaigi-2023/proposal/979ceebe-479d-4310-b5be-c2912e634224) [@akki_megane](https://twitter.com/akki_megane)

当初は使ってもらえなかった理由を分析する着眼点の鋭さ、その改善を実際に行う行動力、共に素晴らしいと感じました。

ダッシュボードに限らずエンジニアによるエンジニアの視点でツールは、つい「綺麗に」作ってしまい汎用的すぎたり抽象的だったりで本当に使って欲しいユーザーに響かないことは、割とよくあることだと感じています。

またその際、多くのエンジニアは「しかし自分は現場での生のユースケースは解らない」と諦めてしまうことが多いようにも思います。

しかし諦めず、これまでと真逆の「目的特化型」へと舵を取る決断をし、そのために業務を知りに行く、中々できないことだと思います。トークのテーマは「データ」ですが、私はプロダクトのオーナーシップの話と捉えました。優秀なエンジニアになるためにはエンジニアリングのことだけ考えていれば良いわけではない、ということを再確認させてもらえるトークでした。ありがとうございました。

## [ふんわり使う PlantUML](https://fortee.jp/phperkaigi-2023/proposal/e2cde744-72a9-40d5-ab02-515526685798) [@suzuki](https://twitter.com/suzuki)

PlantUMLの普及を心から願っている者です。なので、初心者初級者向けのトークはそれだけで有り難いです。

エディタやツールの解説もそうですが、何より「ふんわり」というコンセプトが大切だと思いました。また私自身、つい頑張ってしまう癖があるので、良い戒めになります。

例えばレビューの際メモをとるかのようにPlantUMLで作図（視覚化）する使い方なども強調されてました。なまじ真面目に「UML」と向き合ってしまうとこういった使い方が逆に難しくなるかもしれません。バランス感覚に優れた知見だったと思います。ありがとうございました。

## [CodeCrafters にチャレンジして PHP で Redis を作ってみる](https://fortee.jp/phperkaigi-2023/proposal/dc54af9b-f879-47b6-9737-12ae6e84bf1d) [@gennei](https://twitter.com/gennei)

冒頭「チュートリアルを終えたけど次何を〜」「複雑なアプリケーションの裏側を〜」と悩みの事例を紹介された上で「そんな悩みを解決できるかもしれない」と導入されていました。

CodeCraftersは知らなかったのですが、「かもしれない」どころか、確実に解決できるので是非ともチャレンジ、と感じました。

「順番に小さく作ることでコア機能は作れる」と締められていました。CodeCraftersやRedisに限らず実務含むあらゆる開発に言えることだと思います。実際、大きめの粒度でタスクを依頼してみたが進捗が出ない、ので依頼側でタスクを適度に分割してやった。すると急に進捗し始める、こう言ったことが多いです。こういった「成功体験」により次からは多少大きめの粒度でもタスクをこなせるようになる、このサイクルが重要です。

それをそこまで高くないハードルで疑似体験できるサービスということで、是非とも試してみたい・人に勧めてみたい、と思いました。

## [パフォーマンスを改善せよ！大規模システム改修の仕事の進め方](https://fortee.jp/phperkaigi-2023/proposal/4a67cc68-83f0-492d-86ca-54304fc256c8) [@taclose](https://twitter.com/taclose)

スライドの至る所に、また締めのスライドの全箇所に「計測せよ」と書かれている点が印象深くまた身につまされました。

私自身はパフォーマンスチューニングかなり得意なのですが、実を言うと「計測せよ」をあまり実践していません。

良くないとは知りつつ、数学や暗算が得意なため、またこれまでの経験や引き出しのおかげで計測せずとも概ねポイントは抑えることが「出来てしまう」ためだと思うのですが、おかげでノウハウを他人にシェアすることが出来ないのが悩みです。

問題点は分かっているので出来るだけ「計測」を交えて説明しようと試みるも、自分自身があまりやっていないことなので実例を示せず、この悪循環なのだと思います。

その意味で有り難かったのが「MISSION②未達」の失敗談の共有です。自分が同じ仕事をしていたとしてもまずはここで同じ失敗をすると思うのですが、その場合もおそらく勘や経験だけで解決してしまいそうです。これではノウハウの共有はままなりません。

計測していた箇所の成功例、計測していなかった箇所の失敗例、双方が解りやすい図と共に対比して示されており、それだけでノウハウの引き出しが増えた感覚があります。ありがとうございました。

## [PHPの最高機能、配列を捨てよう！！](https://fortee.jp/phperkaigi-2023/proposal/e00788a4-ef25-49ee-b254-9d2b53e19633) [@uzulla](https://twitter.com/uzulla)

伝え方の巧さにひたすら脱帽し続けるトークでした。

語られている内容の多くは「堅牢なコード」ための一般的なプラクティスの範疇、かつ極めてシンプルなものだったと思います。シンプルであるが故に伝えるのも難しい話題とも思います。

それらをこのトークでは、たとえばフェイルファストを「壊れたのが解るのはうれしい」、複雑度の爆発を「無限の可能性」、値のライフサイクルを「旅をさせる」などとキャッチーな言葉に言い換え、軽妙なジョークや煽りを交えつつも重要なポイントは決して外さず絶妙なバランスで説明していました。

初心者には楽しく心に響き、上級者にとってはひたすら頷き続けるような、幅の広い層へ深く突き刺さるトークだったと思います。自分もこのようなトークをいつか出来るようになってみたいと思いました。

## [いろいろなフレームワークの仕組みを index.php から読み解こう](https://fortee.jp/phperkaigi-2023/proposal/e68c1ed6-8fb4-4ff9-9d99-99214d9dba8d) [@okashoi](https://twitter.com/okashoi)

終始安定した丁寧な説明がとても良いと感じました。今回のトークに限らずいつも感じていることです。

私の登壇も含む多くのトークでは、対象となる聴衆をある程度限定した上でテーマ上の前提事項や用語定義などはある程度省き（あるいは説明を失念してしまい）終始本題のみを語るものが多いと思います。この限定されたスタイルは、テーマによっては悪くないものの今回のような普遍的な基礎技術を扱うトークはそうでなく可能な限り聴衆の層を広げたほうが良く、その点で普段からの丁寧に伝えるスタイルが特に活きていたと感じました。

ところで、途中「slimのindex.phpが長いのはslim本体が薄いから」と言った説明が出てきました。

ほとんど全てのindex.phpは同じ内容、しかし細かくは違う点もある。この違う点を深堀りすることでフレームワークの特徴も見えてくるのでは、と思い至りました。（たとえばLaravelでは「メンテナンス」というアプリケーション側の責務をindex.phpに持ち込んでいる点より「Easyを提供する」と方針が垣間見えます。）

4つのフレームワークのindex.phpを一通り読んだ観点を踏まえ深堀りするような形でそれらの差異、と言った話を聞いてみたいな思いました。機会があればお願いします。

---

*一通り書いた後に読み返したところ、抄「勘で仕事してるのでノウハウを共有できず困ってる」と複数箇所に書いてある事に気づいた。フィードバックとして言語化すること自体がさらなる学びとなった感があり嬉しい。*