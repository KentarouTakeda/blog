---
title: 本日はPHP 8.4のリリース日です。新機能を見てみましょう。おや？
---
<!-- textlint-disable -->

### 本日はPHP 8.4のリリース日です。
#### 新機能を見てみましょう。おや？

---

## プロパティフック

---

### 復習: privateとgetter


```php [|3-6|8-16|18-21]
class User
{
  public function __construct(
    private string $firstName,
    private string $lastName,
  ) {}

  public function getFirstName(): string
  {
    return $this->firstName;
  }

  public function getLastName(): string
  {
    return $this->lastName;
  }

  public function getFullName(): string
  {
    return $this->firstName . ' ' . $this->lastName;
  }
}
```

```php
// 変更されたくないプロパティは直接公開せずgetterを経由
$user->getFirstName(); // Kenta
$user->getLastName(); // Usami

// 計算型プロパティはgetterとして実装
$user->getFullName(); // Kenta Usami
```

---

### 復習: PHP 8.1: readonlyプロパティ


```php [3-6]
class User
{
  public function __construct(
    public readonly string $firstName,
    public readonly string $lastName,
  ) {}

  public function getFullName(): string
  {
    return $this->firstName . ' ' . $this->lastName;
  }
}
```

```php
// `readonly` なのでプロパティを直接公開できる
$user->firstName; // Yuya
$user->lastName; // Hamada

// 計算型プロパティは従来通りgetterを実装
$user->getFullName(); // Yuya Hamada
```

---

### 復習: マジックメソッド

```php [8-15]
class User
{
  public function __construct(
    private string $firstName,
    private string $lastName,
  ) {}

  public function __get(string $name)
  {
    return match ($name) {
      'firstName' => $this->firstName,
      'lastName' => $this->lastName,
      'fullName' => $this->firstName . ' ' . $this->lastName,
    };
  }
}
```

```php
$user->firstName; // Tetsuji
$user->lastName; // Koyama
$user->fullName; // Tetsuji Koyama

// エラーハンドリングは開発者の責任: この例は明確に想定外エラー
// $user->nickName
//   UnhandledMatchError: Unhandled match case 'nickName'
```

---

### PHP 8.4: `get` フック

```php
class User
{
  public function __construct(
    public readonly string $firstName,
    public readonly string $lastName,
  ) {}

  public string $fullName {
    get => $this->firstName . ' ' . $this->lastName;
  }
}
```

```php
$user->firstName; // Taichi
$user->lastName; // Inaba
$user->fullName; // Taichi Inaba

// エラーハンドリングに責任を持つ必要はない
// $user->nickName;
//   Undefined property: User::$nickName
```

---

### `set` フックの活用例

* 全文検索機能を実装したい
* 大文字小文字を区別しない検索が必要
* 負荷軽減のため**内部表現は小文字**に正規化
* **外部表現は *Upper First*** に統一

---

### PHP 8.4: プロパティフックで透過変換

```php [8-16|3-5]
class User
{
  public string $fullName {
    get => $this->firstName . ' ' . $this->lastName;
  }

  public function __construct(
    public string $firstName {
      get => mb_ucfirst($this->firstName);
      set => mb_strtolower($value);
    },

    public string $lastName {
      get => mb_ucfirst($this->lastName);
      set => mb_strtolower($value);
    },
  ) {}
}
```

---

### PHP 8.4: プロパティフック 動作例

```php
// 入力時は正規化
$user = new User('ILIJA', 'TOVILO');

// 出力時は適切に加工
$user->firstName; // Ilija
$user->lastName; // Tovilo
$user->fullName; // Ilija Tovilo

var_dump($user);
// object(User)#1 (2) {
//   ["firstName"]=>
//   string(5) "ilija"
//   ["lastName"]=>
//   string(6) "tovilo"
// }

```

---

## 非対称可視性プロパティ

---

### 復習: PHP 8.1:  [readonlyプロパティ](https://www.php.net/manual/ja/language.oop5.properties.php#language.oop5.properties.readonly-properties)


> #### 読み取り専用プロパティ
>
> PHP 8.1.0 以降では、readonly を付けてプロパティを宣言できます。これによって、 **プロパティを初期化した後に値が変更されることを防止** できます。

---

### 復習: PHP 8.1: readonlyの条件

```php
class User
{
  public readonly string $name;

  public function setName(string $name)
  {
    $this->name = $name;
  }
}
```

```php
$user = new User();

$user->setName('soudai1025'); // OK

// $user->setName('uzulla');
//   Uncaught Error: Cannot modify readonly property User::$name
```

* 最初の1度だけ書き込める
* スコープ内から書き込める

---

### PHP 8.4: 非対称可視性プロパティ

```php [4]
class User
{
  public function __construct(
    public private(set) string $name
  ) {}

  public function setName(string $name)
  {
    $this->name = $name;
  }
}
```

---

### PHP 8.4: 非対称可視性プロパティ

```php [5-6]
$user = new User('asumikam');

$user->name; // asumikam

// $user->name = 'stefafafan';
//   Cannot modify private(set) property User::$name from global scope

$user->setName('stefafafan');
$user->name; // stefafafan
```

---

### PHP 8.4: `set-protected`

```php [4,8,10-13]
class User
{
  public function __construct(
    public protected(set) string $name
  ) {}
}

class PHPer extends User
{
  public function setName(string $name)
  {
    $this->name = $name;
  }
}

```

```php [3-4]
$phper = new PHPer('tadsan');

$phper->setName('zonuexe');
$phper->name; // zonuexe
```


---

## レイジーオブジェクト

---

### [PHP レイジーオブジェクト](https://www.php.net/manual/ja/language.oop5.lazy-objects.php)

> レイジーオブジェクトは、**状態が参照または変更されるまで 初期化が遅延されるオブジェクト**です。

* 必要な時だけ初期化される遅延DIコンポーネント
* 必要な時だけデータを読み込む遅延ORM
* 必要な時だけ解析を行う遅延JSONパーサー

---

### [Laravel 遅延プロバイダ](https://readouble.com/laravel/11.x/ja/providers.html#deferred-providers)

> Laravelは遅延サービスプロバイダが提示した全サービスのリストをコンパイルし、サービスプロバイダのクラス名と共に保存します。その後、**登録されているサービスのどれか一つを依存解決する必要が起きた時のみ、Laravelはそのサービスプロバイダをロードします。**

---

### 2種類のレイジーオブジェクト

#### ゴースト: 主に自作クラスで利用

```php [2-4]
$reflector = new ReflectionClass(User::class);
$userGhost = $reflector->newLazyGhost(function (User $user) {
  $user->__construct();
});
```

#### プロキシ: 主に外部ライブラリのクラスで利用

```php [2-4]
$reflector = new ReflectionClass(User::class);
$userProxy = $reflector->newLazyProxy(function (User $user) {
  return new User();
});
```

---

### 遅延初期化の動作例

```php [7]
class User
{
  public string $name;

  public function __construct()
  {
    throw new Exception();
  }
}
```

```php
get_class($userGhost); // User

$userGhost->name;
// Fatal error: Uncaught Exception in /tmp/lazy-object.php:8
// Stack trace: #0 /tmp/lazy-object.php(3): User->__construct()
```

```php
get_class($userProxy); // User

$userProxy->name;
// Fatal error: Uncaught Exception in /tmp/lazy-object.php:8
// Stack trace: #0 /tmp/lazy-object.php(3): User->__construct()
```

---

### 特定プロパティの事前初期化

#### 例: データベース接続を管理するクラス

```php [5-9|11-17|19-27]
class DatabaseConnection
{
  private readonly PDO $pdo;

  public function __construct(private readonly string $dsn)
  {
    $this->pdo = new PDO($dsn);
    error_log('LOG: データベースに接続しました');
  }

  /**
   * データベース接続を取得
   */
  public function getConnection()
  {
    return $this->pdo;
  }

  /**
   * 接続文字列を取得
   */
  public function getDsn()
  {
    return $this->dsn;
  }
}
```

---

#### レイジーインスタンスを取得する関数

```php [1,5-9]
function getDatabaseConnection(string $dsn): DatabaseConnection
{
  $reflector = new ReflectionClass(DatabaseConnection::class);

  $databaseConnection = $reflector->newLazyGhost(
    function(DatabaseConnection $databaseConnection) use($dsn) {
      $databaseConnection->__construct($dsn);
    }
  );

  return $databaseConnection;
}
```

---

#### プロパティが最初に参照された時に接続

```php [6-8]
// データベース接続のレイジーインスタンスを取得
$databaseConnection = getDatabaseConnection('sqlite::memory:');

/* ここではデータベース未接続 */

// データベース接続を取得: ここでで接続が行われる
$pdo = $databaseConnection->getConnection();
// LOG: データベースに接続しました

/* ここから下はデータベース接続状態 */
```

---

#### 最初に参照された時に接続されてしまう

```php [6-8]
// データベース接続のレイジーインスタンスを取得
$databaseConnection = getDatabaseConnection('sqlite::memory:');

/* ここではデータベース未接続 */

// 接続文字列を取得: ここで接続されてしまう
$dsn = $databaseConnection->getDsn();
// LOG: データベースに接続しました

/* ここではデータベース接続は要らないかもしれない */
```

---

#### 特定プロパティを事前に初期化

```php [11-16]
function getDatabaseConnection(string $dsn): DatabaseConnection
{
  $reflector = new ReflectionClass(DatabaseConnection::class);

  $databaseConnection = $reflector->newLazyGhost(
    function(DatabaseConnection $databaseConnection) use($dsn) {
      $databaseConnection->__construct($dsn);
    }
  );

  // setRawValueWithoutLazyInitialization: プロパティを事前初期化
  $reflector->getProperty('dsn')->setRawValueWithoutLazyInitialization(
    $databaseConnection,
    $dsn
  );

  return $databaseConnection;
}
```

---

#### 事前初期化で初期化がバイパスされる

```php [6-8|12-19]
// データベース接続のレイジーインスタンスを取得
$databaseConnection = getDatabaseConnection('sqlite::memory:');

/* ここではデータベース未接続 */

// `$this->dsn` の値は事前初期化済
$dsn = $databaseConnection->getDsn(); // (データベース接続は行われない)
// （コンストラクタは実行されていない）

/* ここでもデータベース未接続 */

// var_dumpで違いを確認できる
var_dump($databaseConnection);
// lazy ghost object(DatabaseConnection)#3 (1) {
//   ["pdo":"DatabaseConnection":private]=>
//   uninitialized(PDO)
//   ["dsn":"DatabaseConnection":private]=>
//   string(15) "sqlite::memory:"
// }
```

---

### レイジーオブジェクトを「使う」側

* 通常のオブジェクトとほぼ同じように扱える
* 状態は `var_dump()` である程度確認できる

---

### レイジーオブジェクトを「作る」側

* 事前初期化時と正式初期化時の整合
* プロキシとゴーストの違い
* インスタンスの初期化が行われる条件
* インスタンスが初期化済と判断される条件
* 継承を伴う場合の動作
* デストラクタが起動する条件
* `serialize()`, `unserialize()`, `clone()`

*マニュアルの一読を推奨*

---

## `#[\Deprecated]`

---

### 復習: 従来の非推奨への対応

```php
/**
 * @deprecated `fizzBuzz()` を使用してください。
 */
function fizBuzz()
{
    trigger_error(__FUNCTION__ . ': `fizzBuzz()` を使用してください。', E_USER_DEPRECATED);

    return fizzBuzz();
}
```

* 事前対応: `@deprecated`
  * エディタ上での警告表示
* 事後対応: `trigger_error()`
  * 実行時のログ出力

---

### PHP 8.4: 事前事後を両対応

```php [1-4,11-13]
#[\Deprecated(
  message: '`fizzBuzz()` を使用してください。',
  since: '2024-11-21'
)]
function fizBuzz()
{
    return fizzBuzz();
}

fizBuzz();
// Deprecated:
//   Function fizBuzz() is deprecated since 2024-11-21,
//   `fizzBuzz()` を使用してください。
```

---

### `new`式の簡略化

### PHP 8.3

```php
(new Datetime())->format('Y-m-d');
```

### PHP 8.4

```php
new Datetime()->format('Y-m-d');
```

---

## Closure デバッグ情報改善

---

### `var_dump()` によるクロージャの出力

```php
$f = function () {};

var_dump($f);
```

#### PHP 8.3 まで

```
object(Closure)#1 (0) {
}
```

#### PHP 8.4

```
object(Closure)#1 (3) {
  ["name"]=>
  string(60) "{closure:/tmp/closure-debug-info.php:3}"
  ["file"]=>
  string(48) "/tmp/closure-debug-info.php"
  ["line"]=>
  int(3)
}
```

---

#### xdebugでフレームワークの動作をデバッグ

```php
// Illuminate\Database\DatabaseServiceProvider

protected function registerConnectionServices()
{
  $this->app->singleton('db.factory', function ($app) {
    return new ConnectionFactory($app);
  });

  $this->app->singleton('db', function ($app) {
    return new DatabaseManager($app, $app['db.factory']);
  });

  $this->app->bind('db.connection', function ($app) {
    return $app['db']->connection();
  });

  $this->app->bind('db.schema', function ($app) {
    return $app['db']->connection()->getSchemaBuilder();
  });

  $this->app->singleton('db.transactions', function ($app) {
    return new DatabaseTransactionsManager;
  });
}
```
* [Laravel データベース機能の初期化](https://github.com/laravel/framework/blob/v11.32.0/src/Illuminate/Database/DatabaseServiceProvider.php#L53-L80)
* 以前の `__debugInfo()` は実質的に情報ゼロ

---

## 新しい `mb_*` 関数

---

### 前後の空白を削除

```php
$name = $request->input('name');

$trimmed = trim($name);
```

### 前後の空白を削除（全角対応）

```php
$name = $request->input('name');

$trimmed = preg_replace('/\A[\s　]+/', '', $name);
$trimmed = preg_replace('/[\s　]+\z/', '', $name);
```

---

### PHP 8.4: `mb_trim()`

```php
$name = $request->input('name');

$trimmed = mb_trim($name);
```

*`mb_trim()` が取り除く「空白」は[全27種類](https://www.php.net/manual/ja/function.mb-trim.php)*

---

### `mb_strtolower()`, `mb_strtoupper()`

```php
strtolower('ZENKAKU')
// string(7) "zenkaku"

strtolower('ＺENKAKU');
// string(9) "Ｚenkaku"
```

```php
mb_strtolower('ＺENKAKU');
// string(9) "ｚenkaku"
```

---

### PHP 8.4 `grapheme_str_split()`

#### `mb_str_split()` は文字の接合に非対応

```php
var_export(mb_str_split('🙇🏻🙇🏿'));
// array (
//   0 => '🙇',
//   1 => '🏻',
//   2 => '🙇',
//   3 => '🏿',
// )
```

#### `grapheme_str_split()` で接合を考慮し分割

```php
var_export(grapheme_str_split('🙇🏻🙇🏿'));
// array (
//   0 => '🙇🏻',
//   1 => '🙇🏿',
// )
```

---

## BCMath 任意精度数学関数

---

### 復習: 小数（浮動小数点数）とは？

```php
var_dump(0.1);// double(0.1)

var_dump(0.2); // double(0.2)

// php < 8.4
var_dump(0.1 + 0.2); // double(0.3)

// 浮動小数点数の計算は常に不正確
var_dump(0.1 + 0.2 === 0.3); // bool(false)
```

#### 参考: PHP 8.4以降の浮動小数点数の扱い

```php
var_dump(0.1 + 0.2); // float(0.30000000000000004)
```

---

### BCMath による小数の計算

```php
// 10 / 3 を `float` で計算
var_dump(10 / 3); // double(3.3333333333333)

// 10 / 3 を `BCMath` で **小数第5位まで** 計算
var_dump(bcdiv(10, 3, 5)); // string(7) "3.33333"

// 10 / 3 を `BCMath` で **小数第20位まで** 計算
var_dump(bcdiv(10, 3, 20)); // string(22) "3.33333333333333333333"
```

---

### コード例

####  PHP標準の浮動小数点数で計算

```php
var_dump(((150 * 2) + 100) * 1.1);
// double(440)
```

#### BCMath で計算

```php
var_dump(bcmul(bcadd(bcmul('150', '2', 0), '100', 0), '1.1', 2));
// string(6) "440.00"
```

---

### 変更点1: 高速化

#### 10 / 3 (小数第20位まで) を1000万回計算

```php
for($i=0; $i < 10000000; $i++) {
    bcdiv(10, 3, 20);
}
```

#### PHP 8.3

```
real 0m5.411s
user 0m5.365s
sys  0m0.037s
```

#### PHP 8.4

```
real 0m1.051s
user 0m1.013s
sys  0m0.034s
```

*計算の種類により1000倍以上の高速化も*

---

### 変更点2: オブジェクト対応

```php
use BcMath\Number;

$number = new Number(0);

$result = $number
    ->add(150)
    ->mul(2)
    ->add(100)
    ->mul('1.1', 2);

var_dump($result);
// object(BcMath\Number)#3 (2) {
//   ["value"]=>
//   string(6) "440.00"
//   ["scale"]=>
//   int(2)
// }
```

---

### 変更点3: 演算子オーバーロード

```php
use BcMath\Number;

$answer = new Number(42);
$enigma = new Number(23);

get_class($answer); // BcMath\Number
get_class($enigma); // BcMath\Number
get_class($answer + $enigma); // BcMath\Number

error_log($answer + $enigma); // 65
error_log($answer - $enigma); // 19
error_log($answer * $enigma); // 966
error_log($answer / $enigma); // 1.8260869565
error_log($answer % $enigma); // 19
error_log($answer ** $enigma); // 21613926941579800829422581272845221888
```

---

## 紹介しきれなかった新機能

* POST 以外の HTTP リクエストでの RFC1867 (マルチパート)リクエストの解析
* WeakReference のデバッグ情報の改善
* 異なる名前空間ブロックで同一のシンボルを定義
* 他にも多くの新機能や改善
  * cURL / DOM / Intl / OpenSSL / PCRE / PDO / PDO_MYSQL / PDO_PGSQL / PDO_SQLITE / Phar / Readfile / Reflection / SOAP / Standard / XSL / Zip

<!-- textlint-enable -->
