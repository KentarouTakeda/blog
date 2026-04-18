---
title: 何をテストしたいか
subtitle: AIが見落とす「性質」と、テストに仕様を語らせる思考法
description: AIが書くテストは具体値の確認に終始する。足し算で交換法則を書けたAIが、カートでは同じ性質を見落とした。抽象と具象を往復する思考が、テストの品質を決める。
date: 2026-04-18 22:00
tags:
  - essay
  - AI
  - testing
---

## ◯◯エンジニアリングの時代

<!-- textlint-disable ja-technical-writing/no-doubled-joshi -->

Prompt Engineering、Flow Engineering、Context Engineering、Harness Engineering、Agentic Engineering。AI周辺で「◯◯エンジニアリング」が量産されている。名前は変われど本質は同じだ。AIをいかに制御するか。

<!-- textlint-enable ja-technical-writing/no-doubled-joshi -->

焦点はプロンプトの書き方から、フローの設計、コンテキストの構成、ハーネスの構築、エージェントの環境整備へと外側に拡大してきた。直近ではこの一連の営みを総称して「ガードレール」と呼ぶことが多い。和田卓人氏はTDDをAIの暴走を防ぐガードレールと位置づけ、テストの重要性を改めて説いている[^twada-agile]。

テストは最も重要なガードレールの1つだ。異論はない。**だが、そのガードレール自体をAIが作っているとしたら？**

AIにテストを書かせるのは今や日常だ。カバレッジは上がる。CIは通る。しかし違和感を抱いている。AIが書くテストには、何かが足りない。

[PHPカンファレンス小田原2026](https://phpcon-odawara.jp/ja/2026/)で、PHPUnit作者のSebastian Bergmannが基調講演に登壇した。質疑で「良いテストコードを書けるようになるには？」と聞かれ、彼は「動作可能な仕様書として書くこと」という趣旨の回答をした（私の拙い英語力での聞き取りなので不正確かもしれない）。そして「AIの書くテストコードは耐え難い」と続けた。同じことを考えている人がいた、なんとPHPUnit作者だ。

## AIが書くテストの正体

この違和感は気のせいなのか。試しに、コンテキストを一切持たないAIエージェントに2つの課題を渡してみた。

1つ目は単純な足し算。2つ目はショッピングカート。いずれもPHPで実装とPHPUnitテストを書かせた。

使用したモデルはClaude Opus 4.6、「実装してテストを書いて、十分なカバレッジを確保して」とだけ指示した。

{% details 足し算のテスト（AIが生成したコード全文） %}

```php
function add(int $a, int $b): int
{
    return $a + $b;
}
```

```php
use PHPUnit\Framework\Attributes\Test;

final class AddTest extends TestCase
{
    #[Test]
    public function 正の数同士の加算(): void
    {
        $this->assertSame(5, add(2, 3));
    }

    #[Test]
    public function 負の数同士の加算(): void
    {
        $this->assertSame(-5, add(-2, -3));
    }

    #[Test]
    public function 正と負の混合(): void
    {
        $this->assertSame(1, add(-2, 3));
        $this->assertSame(-1, add(2, -3));
    }

    #[Test]
    public function ゼロ同士の加算(): void
    {
        $this->assertSame(0, add(0, 0));
    }

    #[Test]
    public function ゼロと正の数の加算(): void
    {
        $this->assertSame(5, add(0, 5));
        $this->assertSame(5, add(5, 0));
    }

    #[Test]
    public function ゼロと負の数の加算(): void
    {
        $this->assertSame(-3, add(0, -3));
        $this->assertSame(-3, add(-3, 0));
    }

    #[Test]
    public function 大きな数の加算(): void
    {
        $this->assertSame(2000000000, add(1000000000, 1000000000));
    }

    #[Test]
    public function 交換法則(): void
    {
        $this->assertSame(add(3, 7), add(7, 3));
    }

    #[Test]
    public function 単位元(): void
    {
        $value = 42;
        $this->assertSame($value, add($value, 0));
        $this->assertSame($value, add(0, $value));
    }

    #[Test]
    public function 加法逆元(): void
    {
        $this->assertSame(0, add(5, -5));
        $this->assertSame(0, add(-100, 100));
    }

    #[Test]
    public function 戻り値の型(): void
    {
        $result = add(1, 2);
        $this->assertIsInt($result);
    }
}
```

{% enddetails %}

{% details ショッピングカートのテスト（AIが生成したコード全文） %}

```php
class Cart
{
    /** @var array<string, array{name: string, price: int, quantity: int}> */
    private array $items = [];

    public function addItem(string $name, int $price, int $quantity): void
    {
        if ($name === '') {
            throw new InvalidArgumentException('商品名は空にできません。');
        }
        if ($price < 0) {
            throw new InvalidArgumentException('単価は0以上でなければなりません。');
        }
        if ($quantity <= 0) {
            throw new InvalidArgumentException('数量は1以上でなければなりません。');
        }

        if (isset($this->items[$name])) {
            $this->items[$name]['quantity'] += $quantity;
        } else {
            $this->items[$name] = [
                'name' => $name,
                'price' => $price,
                'quantity' => $quantity,
            ];
        }
    }

    public function removeItem(string $name): void
    {
        if (!isset($this->items[$name])) {
            throw new InvalidArgumentException("商品「{$name}」はカートに存在しません。");
        }

        unset($this->items[$name]);
    }

    public function getTotal(): int
    {
        $total = 0;
        foreach ($this->items as $item) {
            $total += $item['price'] * $item['quantity'];
        }
        return $total;
    }

    /** @return array<int, array{name: string, price: int, quantity: int}> */
    public function getItems(): array
    {
        return array_values($this->items);
    }
}
```

```php
use PHPUnit\Framework\Attributes\Test;

class CartTest extends TestCase
{
    private Cart $cart;

    protected function setUp(): void
    {
        $this->cart = new Cart();
    }

    #[Test]
    public function 商品をカートに追加できる(): void
    {
        $this->cart->addItem('りんご', 150, 2);

        $items = $this->cart->getItems();
        $this->assertCount(1, $items);
        $this->assertSame('りんご', $items[0]['name']);
        $this->assertSame(150, $items[0]['price']);
        $this->assertSame(2, $items[0]['quantity']);
    }

    #[Test]
    public function 同一商品の追加で数量が増える(): void
    {
        $this->cart->addItem('りんご', 150, 2);
        $this->cart->addItem('りんご', 150, 3);

        $items = $this->cart->getItems();
        $this->assertCount(1, $items);
        $this->assertSame(5, $items[0]['quantity']);
    }

    #[Test]
    public function 異なる商品を複数追加できる(): void
    {
        $this->cart->addItem('りんご', 150, 1);
        $this->cart->addItem('バナナ', 100, 3);

        $items = $this->cart->getItems();
        $this->assertCount(2, $items);
    }

    #[Test]
    public function 空の商品名で例外(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->cart->addItem('', 100, 1);
    }

    #[Test]
    public function 負の単価で例外(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->cart->addItem('りんご', -1, 1);
    }

    #[Test]
    public function 数量ゼロで例外(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->cart->addItem('りんご', 100, 0);
    }

    #[Test]
    public function 負の数量で例外(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->cart->addItem('りんご', 100, -1);
    }

    #[Test]
    public function 単価ゼロを許容する(): void
    {
        $this->cart->addItem('無料サンプル', 0, 1);

        $items = $this->cart->getItems();
        $this->assertCount(1, $items);
        $this->assertSame(0, $items[0]['price']);
    }

    #[Test]
    public function 商品を削除できる(): void
    {
        $this->cart->addItem('りんご', 150, 2);
        $this->cart->removeItem('りんご');

        $this->assertSame([], $this->cart->getItems());
    }

    #[Test]
    public function 存在しない商品の削除で例外(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->cart->removeItem('存在しない商品');
    }

    #[Test]
    public function 削除は他の商品に影響しない(): void
    {
        $this->cart->addItem('りんご', 150, 1);
        $this->cart->addItem('バナナ', 100, 3);
        $this->cart->removeItem('りんご');

        $items = $this->cart->getItems();
        $this->assertCount(1, $items);
        $this->assertSame('バナナ', $items[0]['name']);
    }

    #[Test]
    public function 空カートの合計はゼロ(): void
    {
        $this->assertSame(0, $this->cart->getTotal());
    }

    #[Test]
    public function 単一商品の合計計算(): void
    {
        $this->cart->addItem('りんご', 150, 3);

        $this->assertSame(450, $this->cart->getTotal());
    }

    #[Test]
    public function 複数商品の合計計算(): void
    {
        $this->cart->addItem('りんご', 150, 2); // 300
        $this->cart->addItem('バナナ', 100, 3); // 300
        $this->cart->addItem('みかん', 80, 5);  // 400

        $this->assertSame(1000, $this->cart->getTotal());
    }

    #[Test]
    public function 削除後に合計が更新される(): void
    {
        $this->cart->addItem('りんご', 150, 2); // 300
        $this->cart->addItem('バナナ', 100, 3); // 300
        $this->cart->removeItem('りんご');

        $this->assertSame(300, $this->cart->getTotal());
    }

    #[Test]
    public function 空カートの商品一覧は空配列(): void
    {
        $this->assertSame([], $this->cart->getItems());
    }

    #[Test]
    public function 商品一覧は連番の配列(): void
    {
        $this->cart->addItem('りんご', 150, 1);
        $this->cart->addItem('バナナ', 100, 2);
        $this->cart->removeItem('りんご');

        $items = $this->cart->getItems();
        $this->assertArrayHasKey(0, $items);
        $this->assertArrayNotHasKey(1, $items);
    }
}
```

{% enddetails %}

### 見えてきたパターン

足し算に対してAIは11のテストを書いた。ショッピングカートに対しては17。数だけ見れば十分に見える。

しかし中身を見ると、ほぼ全てが具体的な入出力ペアの羅列だ。`add(2, 3)` が `5` を返す。`add(-2, -3)` が `-5` を返す。りんごを150円で2個追加すると合計300円になる。

学術的にもこの傾向は裏付けられている。Schäferらの研究ではLLMが生成するテストを「もっともらしいが浅い」と評し[^schafer]、Metaの大規模実験でも同様の知見が報告されている[^meta]。

私が日頃テストと向き合う時、必ず自問する言葉がある。「このテストは、何の仕様を表明しているか？」

`add(2, 3) === 5` は「2と3を足すと5になる」としか言っていない。正しいが、それだけだ。足し算が満たすべき性質、そこに踏み込んだテストはAIの出力にない。

## 性質への着目

### 足し算の場合

この関数について考えてみる:

```php
function add(int $a, int $b): int;
```

「足し算」と言えば自明に思える。しかし、自明なものにこそ重要な性質が隠れている。学生時代の記憶を引っ張り出して、定義に立ち戻ってみる。「加算」が満たすべき数学的性質は何か:

- 交換法則: `add($a, $b) === add($b, $a)` - 順番を入れ替えても結果は同じ
- 単位元: `add($a, 0) === $a` - 0を足しても値は変わらない
- 結合法則: `add(add($a, $b), $c) === add($a, add($b, $c))` - どこで括っても結果は同じ

これらは任意の入力に対して常に成り立つべき性質だ。`add(2, 3) === 5` はたまたまその1点を通過しているに過ぎない。

和田卓人氏はAIが書くテストを「As-Is（現状の写し取り）テスト」と捉え、人間が書くべき「To-Be（あるべき姿）テスト」との区別を論じている[^twada-agile]。「性質」への着目は、To-Beテストを書くための具体的な切り口になる。

境界についても考えてみる。`add(PHP_INT_MAX, 1)` はどうなるべきか。オーバーフローで黙って負の数を返すのか、最大値のまま丸めるか、例外を投げるのか。これはテスト技法の話ではなく仕様の話だ。人間でも見落としがちな観点だが、AIに大量のコードを生成させる開発スタイルでは、この手の見落としが静かにコードベースに混入する。AIはこの種の問いを立てるのが苦手だ。

AIが生成した`add()`のテストには `交換法則()` と `単位元()` が含まれていた。交換法則や単位元を「知って」はいる。ただし `add(3, 7) === add(7, 3)` という具体値1ペアで確認しているだけで、任意の入力に対する性質の表明にはなっていない。結合法則は抜け落ちている。

### ショッピングカートの場合

「足し算」は単純すぎてピンとこないかもしれない。ではショッピングカートならどうか。

AIが書いたカートのテストは17件、全て具体値の手続き的テストだった。「りんごを追加するとカートに1件」「りんご300円、バナナ300円、みかん400円で合計1000円」。動作確認としては正しい。しかし性質は1つも表明されていない。

加算で見た3つの性質は、ショッピングカートでも顔を出す。

- 交換法則: 順番を入れ替えても結果は変わらない
  - 商品A→Bの順で追加しても、B→Aでも合計金額は同じ
- 単位元: 何もしない操作は結果に影響しない
  - 空カートの合計は0。既存カートに空の操作をしても変わらない
- 結合法則: どこでグループ化しても結果は同じ
  - 「AとBをまとめ買い→C追加」でも「A→BとCをまとめ買い」でも合計は同じ

AIは`add()`のテストで `交換法則()` を書いた。交換法則を「知って」はいる。**なのに、カートでは「追加順序に依存しない」というテストを1つも書かなかった。** 単純な例では見えていた構造が、ドメインを変えた途端に見えなくなる。

商品の追加順序で合計が変わらない。当たり前すぎてテストに書くまでもない、そう思うかもしれない。だが現実のカートはもっと複雑だ。セット割引、まとめ買い値引き、クーポン適用、カートへの追加日時、ポイント利用。これらの条件が絡み合ったとき、割引計算が商品の投入順序に依存してしまうバグは実際に起きる。交換法則が成り立つべきなのに壊れている。まさにテストで捕まえたい種類の不具合だ。

ドメインの壁だけではない。状況により、性質が成り立ってはいけない場合もある。文字列の結合は結合法則と単位元（空文字列）を満たすが、交換法則は成り立ってはいけない。`concat("ab", "cd")` と `concat("cd", "ab")` は異なる結果になる。

「成り立たないこと」を確認するのも性質のテストだ。むしろバグの予防にはこちらが効く。AIは「動くこと」の確認は得意だが、「これは成り立たないはずだ」という検証を意図的に行うことが少ない。

## Property-based Testing

ここまで述べた「性質に着目してテストする」という思考法には名前があるそうだ。*Property-based Testing*（PBT）というらしい。

実は私はこの言葉を知らなかった。テストを書く際に「何をテストしたいか」「このコードが満たすべき不変条件は何か」を問う習慣から、自然とこの考え方に辿り着いていたが、名前を知ったきっかけはこの記事の執筆中だ。

2000年、Koen ClaessenとJohn HughesがHaskellのテストツール*QuickCheck*として発表したのが原点らしい。被引用数3000を超えるソフトウェアテスト分野の古典的論文だった[^quickcheck]。Hughes自身は後に「テストケースを書くな、性質を書け」と講演で説いている[^hughes]。

PBTの基本的な仕組みはシンプルだ。テスターは「任意の入力に対して成り立つべき性質」を宣言し、フレームワークがランダムな入力を大量に生成して性質を検証する。失敗した場合は*shrinking*と呼ばれる仕組みで最小の反例を自動的に特定する。

## 結局、何をテストしたかったのか？

AIが書くテストは具体値の羅列になりがちだ。動作確認にはなるが、仕様の表明にはならない。足りないのは性質への着目、つまり定義へ立ち戻り、問題を一般化し、必要に応じて別のドメインに変形する思考だ。

「何をテストしたいか」を問うことは「何を解くべき問題とみなすか」を問うことと同じだ。テストの品質は、問題のとき方で決まる。私はそう考えている。

加算の交換法則をカートの文脈で再発見できなかった事実。あの実験が示しているのは、抽象と具象の往復がまだAIの手の届かない場所にある、ということだ。Gojko Adzicはテストを「動作可能な仕様書」と呼んだ[^adzic]。冒頭で触れたBergmannも、同じ言葉で語っていた。その仕様を書けるかどうかは、ツールではなく思考の問題だろう。

この思考法については、以前に別の角度から詳しく論じたことがある。抽象化・一般化・変形というポリアの方法論が、なぜエンジニアリングの核心なのか。興味があればそちらも参照してほしい。

{% post_link 2024-06-27-how-to-resolve-the-issue いかにして問題をとくか - 私達エンジニアは「いかにして課題を解決するか」 %}

[^quickcheck]: [QuickCheck: A Lightweight Tool for Random Testing of Haskell Programs](https://www.cs.tufts.edu/~nr/cs257/archive/john-hughes/quick.pdf) (Claessen & Hughes, ICFP 2000)
[^hughes]: [John Hughes - Don't Write Tests](https://www.youtube.com/watch?v=hXnS_Xjwk2Y) (Curry On! 2017)
[^schafer]: [An Empirical Evaluation of Using Large Language Models for Automated Unit Test Generation](https://arxiv.org/abs/2302.06527) (Schäfer et al., 2023)
[^meta]: [Automated Unit Test Improvement using Large Language Models at Meta](https://arxiv.org/abs/2402.09171) (2024)
[^adzic]: Gojko Adzic, "Specification by Example" (Manning, 2011)
[^twada-agile]: [AIエージェント時代に、テスト駆動開発（TDD）は「ガードレール」になる](https://agilejourney.uzabase.com/entry/2025/08/29/103000) (Agile Journey, 2025)
