---
title: 良い設計は読み手を選ばない
subtitle: Claude CodeとLaravel Boost Skillsで得た確信
date: 2026-02-01 19:00
description: Laravel Boost 2.0のSkills対応を通じて見えた、AIコーディングの精度とパフォーマンスを向上させる設計。Laravel OpenAPI Validatorの対応記録とベンチマーク結果を交えて紹介する。
tags:
  - Laravel
  - AI
---

## はじめに

まずはLaravelユーザー向けの結論。ぜひとも[Laravel Boost](https://laravel.com/ai/boost)を導入してほしい。既に使っている方はバージョンを2.0に上げてほしい。ベンチマークでは速度が1.5倍に向上し、出力されるコードの品質も改善した。AIを活用したコーディング体験が格段に向上する。

最近、AI技術のキャッチアップに努めている。特にSkillsが便利だと感じている。数個のファイルを設置するだけで体験が変わる。単一責務原則に基づく小さなSkillを自由に組み合わせ、思い通りのコードをAIに出力させる。これは設計としても合理的だ。

だが、その場の思いつきで小さなアプリを作るのはすぐに飽きてしまった。そういえばLaravelパッケージを公開しているので、それをLaravel Boostに対応してみた。この過程での技術検証の結果や所感を共有する。

## Laravel BoostによるAGENTS.md自動生成

AGENTS.mdは、AIが対象のコードベースを理解しやすいよう、そのプロジェクトで利用中のライブラリやコーディングのベストプラクティスを予め記載しておく、言わば「AI向けのREADME」だ。

Laravel Boostはこれを自動生成する。PHPやLaravel Frameworkのバージョン、インストール済Laravelパッケージなどを横断的に取得し、いつでもそれをAGENTS.mdに反映できる。

例えば Laravel + React Starter Kit + Pest 構成の初期状態に対して Laravel Boost 1.0 をセットアップすると、次のセクションを含むAGENTS.mdが自動生成される。

> ## Foundational Context
>
> This application is a Laravel application and its main Laravel ecosystems package & versions are below. You are an expert with them all. Ensure you abide by these specific packages & versions.
>
> - php - 8.5.2
> - inertiajs/inertia-laravel (INERTIA) - v2
> - laravel/fortify (FORTIFY) - v1
> - laravel/framework (LARAVEL) - v12
> - laravel/prompts (PROMPTS) - v0
> - laravel/wayfinder (WAYFINDER) - v0
> - laravel/mcp (MCP) - v0
> - laravel/pint (PINT) - v1
> - laravel/sail (SAIL) - v1
> - pestphp/pest (PEST) - v4
> - phpunit/phpunit (PHPUNIT) - v12
> - @inertiajs/react (INERTIA) - v2
> - react (REACT) - v19
> - tailwindcss (TAILWINDCSS) - v4
> - @laravel/vite-plugin-wayfinder (WAYFINDER) - v0
> - eslint (ESLINT) - v9
> - prettier (PRETTIER) - v3

引用は冒頭の概要のみだが、この下に、各パッケージの詳しいガイドラインが続く。パッケージの構成を変えた場合、AGENTS.mdにも最新の情報が反映される。

[Inertia.js](https://inertiajs.com/)や[Laravel Wayfinder](https://github.com/laravel/wayfinder)は、開発体験を根本から変えるライブラリだ。これらが導入されたプロジェクトはコーディング上のベストプラクティスも大きく変わるわけだが、ユーザーはLaravel Boostをセットアップするだけで、AIにそれらの知識を自動的に伝えられる。

自作パッケージのガイドラインをLaravel Boostを通じてユーザーに提供することも可能。最近のWebアプリケーションは、ライブラリ選定の無限の組み合わせに対応することに多くの労力が割かれるが、この課題をエコシステムを巻き込んで解消しにかかるデザインは、非常にLaravelらしいと感じる。

しかし、ここで問題が発生する。AGENTS.mdの記述量が簡単に爆発してしまうのだ。上述のStarter Kit初期構成だけで505行23KBに達し、パッケージを追加する度に増えていく。

すぐに *"Anti-Prompting"—指示が多すぎてAIが性能低下する現象* に陥ってしまう。これは、Laravel Boostに限らず、多くのユーザーやコーディングエージェントが抱える課題だった。

## SkillsとLaravel Boost 2.0

この記述量爆発問題を解決するために考案されたのがSkillsだ。

コーディングエージェントには「設計のSkill」「実装のSkill」「テストを書くSkill」などの存在だけを伝えておき、それぞれ必要な時だけ具体的な内容を読み込む作りだ。

Laravel Boost 2.0ではSkillsの自動生成や管理をサポートした。先ほどと同じようにLaravel + React Starter Kit + Pest 構成の初期状態に対し Laravel Boost 2.0 をセットアップし、自動生成されるファイルの行数やファイルサイズを比較してみる。

### AGENTS.md—Laravel Boost 1.0 vs 2.0

| | 1.0 | 2.0 | 削減 |
|-|:-:|:-:|-|
| 行数 | 505行 | 296行 | 41% |
| サイズ | 23KB | 15KB | 35% |

ポイント:

* この容量はコンテキストを常に占有する

### Skills—Laravel Boost 2.0

* developing-with-fortify
* inertia-react-development
* pest-testing
* tailwindcss-development
* wayfinder-development

ポイント:

* この容量は必要な時しかコンテキストを占有しない
* Laravel Boost 2.0ではAGENTS.mdの記述の大部分がSkillsへ分離された

## パフォーマンス比較

Anti-Promptingの影響を軽減できることは分かった。実際にどの程度の効果があるのかベンチマークした。n=2 程度の簡易ベンチマークのため、あくまで参考値として捉えてほしい。

### ベンチマーク方法

1. Laravel + React Starter Kit + Pest 構成の初期状態を2つ準備
2. それぞれに対しLaravel Boostの1.0と2.0をセットアップ
3. 次のプロンプトでClaude Codeにコードを書かせる
   > PostリソースのCRUD-APIを作って。

### ベンチマーク結果

#### コンテキストサイズ

| | 1.0 | 2.0 | 削減 |
|-|:-:|:-:| :-: |
| System Prompt | 2.3k | 2.3k | - |
| System Tools | 17.0k | **16.6k** | 2% |
| MCP Tools | 2.0k | 2.0k | - |
| Memory Files | 6.3k | **3.9k** | 38% |
| Skills | - | 0.4k | - |
| Messages | 0.01k | 0.01k | - |
| **合計** | 28k | **25k** | 11% |

#### 所要時間

| | 1.0 | 2.0 | 削減 |
|-|:-:|:-:| :-: |
| 合計時間 | 約6分 | 約4分 | 33% |

#### 総括

AGENTS.mdの記述量の削減がそのままMemory Filesのコンテキスト削減に繋がっている。「PostリソースのCRUD-API」を書くには追加のSkillは必要ないため、削減がそのまま速度向上に繋がったということだろう。

出力されたコードはいずれも、過去に書いた「{% post_link 2025-10-30-laravel-api-resource-tutorial Laravelで理解するREST設計の基本 %}」と同等の内容だが、品質は2.0の方が高かった。1.0では認可を`StorePostRequest`, `UpdatePostRequest`に記述していた。2.0では`PostPolicy`を生成し、`destroy()`への認可も正しく行っていた。

## Skillsへの分離による精度向上

ベンチマークや出力例は割愛するが、Skillが呼び出されるケースでの出力の精度は更に向上していた。Inertia.jsでフォーム入力を含む複雑なReactコンポーネントを作成するケースなどは特に顕著だった。

Skillsは「必要な時だけ呼び出される」という仕組みなのでAnti-Promptingを気にする必要がない。それを受け、Laravel BoostのSkills対応では、指示をGuidelinesからSkillsへ単純に分離するだけでなく、内容の詳細化も行われていた。この対応により**Inertia.js, React, Tailwind CSSなどLaravel Boost 2.0に対応したパッケージを使っている場合、Laravel Boostのバージョンを上げるだけでコード品質が向上する**。

## Laravel OpenAPI ValidatorをLaravel Boostに対応

ここまでで、拙作ライブラリのBoost対応の方向性が見えてきた。調査を踏まえると、Laravel OpenAPI ValidatorはSkillsとの相性が良い。

{% link_preview https://github.com/KentarouTakeda/laravel-openapi-validator %}{% endlink_preview %}

このライブラリは単なるバリデーターではない。背景にはスキーマファーストな開発サイクルを促進する設計思想がある。

{% link_preview https://speakerdeck.com/kentaroutakeda/sukimaqu-dong-kai-fa-niyorupin-zhi-tosupidonoliang-li-si-da-hahe-gu-sukimawoshu-kunoka %}{% endlink_preview %}

つまり、このライブラリが入っている場合と入っていない場合とで、同じプロンプトでも出力されるコードが変わるような動作を望まれる。これを実現するにはAIに対し予め十分なコード例を与えておく必要がある。モノリシックでファットなAGENTS.mdにそれを詰め込むのは得策ではない、というわけだ。

### GuidelineとSkillの役割分担

では具体的に何をGuidelineに残し、何をSkillに分離するのか。判断基準は明快だ。Guidelineには「このライブラリが入っていることでコーディングの前提がどう変わるか」だけを書く。Skillには「具体的にどう実装するか」を書く。

Laravel OpenAPI Validatorの場合、Guidelineはわずか15行で済む。例えば「正常系テストだけでスキーマ準拠を保証できる」といった前提の転換を伝えるだけだ。これだけでAIのコード生成方針は変わる。この15行だけ、常時コンテキストを占有するが、その負荷は十分に小さい。

一方、Skillは270行に及ぶ。実装に必要な詳細を網羅しているが、これらは実際にコードを書く時にだけ必要であり、常時読み込む必要はない。

### Bladeテンプレートによる動的生成

Laravel Boostのもう1つの特徴は、GuidelineもSkillもBladeテンプレートとして記述できる点だ。

例えばLaravel OpenAPI Validatorは複数のスキーマプロバイダに対応しており、どれを使っているかでセットアップ手順もコード例も大きく異なる。Skillを静的なマークダウンで書くと、全パターンの説明を含めざるを得ない。

Bladeテンプレートであれば、`composer.json`から検出したプロバイダに応じて、該当するセクションだけを出力できる。プロジェクトの環境に応じた内容だけが提供され、不要な情報でコンテキストを浪費しない。

これはLaravel Boostの基本設計と一貫している。`boost:install`時に`composer.json`や`package.json`を読み取り、環境に適応したファイルを生成する。サードパーティパッケージもこの仕組みに乗れるのだ。

結果、プルリクエストは次のようになった:

{%link_preview https://github.com/KentarouTakeda/laravel-openapi-validator/pull/65 %}
{% endlink_preview %}

### コード生成の比較

では実際にどの程度コードが変わるのか。先のベンチマークと同じ条件で、Laravel OpenAPI Validatorを追加しBoostに取り込んだ状態とそうでない状態とで比較した。プロンプトも同じ「PostリソースのCRUD-APIを作って。」だ。

結果、Guidelineの指示を受けて生成されるコードの構成が大きく変わった。コントローラやAPI ResourceにOpenAPI用のアトリビュートが追加され、リクエスト・レスポンスのスキーマがコード上で定義されるようになった。

**Boost 2.0のみの場合**、コントローラはFormRequestに依存する。

{% details Boost 2.0のみ: StorePostRequest %}

```php app/Http/Requests/StorePostRequest.php
class StorePostRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string'],
        ];
    }
}
```

{% enddetails %}

**Boost 2.0 + OpenAPI Validatorの場合**、コントローラにアトリビュートが追加され、リクエスト・レスポンスのスキーマが定義される。

{% details Boost 2.0 + OpenAPI Validator: PostController %}

```php app/Http/Controllers/PostController.php
#[OA\Info(title: 'Post API', version: '1.0.0')]
class PostController extends Controller
{
    #[OA\Post(
        path: '/api/posts',
        summary: 'Create a new post',
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['title', 'body'],
                properties: [
                    new OA\Property(property: 'title', type: 'string', maxLength: 255),
                    new OA\Property(property: 'body', type: 'string'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Post created',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'data', ref: '#/components/schemas/Post'),
                    ]
                )
            ),
        ]
    )]
    public function store(StorePostRequest $request): PostResource
    {
        $post = Post::query()->create($request->validated());

        return PostResource::make($post);
    }
}
```

{% enddetails %}

また、レスポンスの型定義としてAPI Resourceに対するアトリビュートが生成された。

{% details Boost 2.0 + OpenAPI Validator: PostResource（アトリビュート） %}

```php app/Http/Resources/PostResource.php
#[OA\Schema(
    schema: 'Post',
    required: ['id', 'title', 'body', 'created_at', 'updated_at'],
    properties: [
        new OA\Property(property: 'id', type: 'integer'),
        new OA\Property(property: 'title', type: 'string'),
        new OA\Property(property: 'body', type: 'string'),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time'),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time'),
    ]
)]
class PostResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'body' => $this->body,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
```

{% enddetails %}

当然だが、ここで追加したAPIのスキーマはOpenAPIドキュメントとして出力できる。

{% details Boost 2.0 + OpenAPI Validator: OpenAPIドキュメント %}

```json storage/api-docs/api-docs.json
{
    "openapi": "3.0.0",
    "info": {
        "title": "Post API",
        "version": "1.0.0"
    },
    "paths": {
        "/api/posts": {
            "get": {
                "summary": "List all posts",
                "operationId": "listPosts",
                "responses": {
                    "200": {
                        "description": "List of posts",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "properties": {
                                        "data": {
                                            "type": "array",
                                            "items": {
                                                "$ref": "#/components/schemas/Post"
                                            }
                                        }
                                    },
                                    "type": "object"
                                }
                            }
                        }
                    }
                }
            },
            "post": {
                "summary": "Create a new post",
                "operationId": "createPost",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "required": [
                                    "title",
                                    "body"
                                ],
                                "properties": {
                                    "title": {
                                        "type": "string",
                                        "maxLength": 255
                                    },
                                    "body": {
                                        "type": "string"
                                    }
                                },
                                "type": "object"
                            }
                        }
                    }
                },
                "responses": {
                    "201": {
                        "description": "Post created",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "properties": {
                                        "data": {
                                            "$ref": "#/components/schemas/Post"
                                        }
                                    },
                                    "type": "object"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/posts/{post}": {
            "get": {
                "summary": "Show a post",
                "operationId": "showPost",
                "parameters": [
                    {
                        "name": "post",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "integer"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Post detail",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "properties": {
                                        "data": {
                                            "$ref": "#/components/schemas/Post"
                                        }
                                    },
                                    "type": "object"
                                }
                            }
                        }
                    }
                }
            },
            "put": {
                "summary": "Update a post",
                "operationId": "updatePost",
                "parameters": [
                    {
                        "name": "post",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "integer"
                        }
                    }
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "properties": {
                                    "title": {
                                        "type": "string",
                                        "maxLength": 255
                                    },
                                    "body": {
                                        "type": "string"
                                    }
                                },
                                "type": "object"
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Post updated",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "properties": {
                                        "data": {
                                            "$ref": "#/components/schemas/Post"
                                        }
                                    },
                                    "type": "object"
                                }
                            }
                        }
                    }
                }
            },
            "delete": {
                "summary": "Delete a post",
                "operationId": "deletePost",
                "parameters": [
                    {
                        "name": "post",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "integer"
                        }
                    }
                ],
                "responses": {
                    "204": {
                        "description": "Post deleted"
                    }
                }
            }
        }
    },
    "components": {
        "schemas": {
            "Post": {
                "required": [
                    "id",
                    "title",
                    "body",
                    "created_at",
                    "updated_at"
                ],
                "properties": {
                    "id": {
                        "type": "integer"
                    },
                    "title": {
                        "type": "string"
                    },
                    "body": {
                        "type": "string"
                    },
                    "created_at": {
                        "type": "string",
                        "format": "date-time"
                    },
                    "updated_at": {
                        "type": "string",
                        "format": "date-time"
                    }
                },
                "type": "object"
            }
        }
    }
}
```

{% enddetails %}

## 総括: エコシステムとしての拡張性とコーディングエージェントの今後

AIの出力はライブラリ作者として完全に意図した通りのコードだった。ライブラリと共にAIがそれを扱う際のベストプラクティスを同梱して配布。これが今後のOSSエコシステムにおける「標準」になると感じた。

Laravel Boostは、サードパーティベンダーがユーザーにGuidelineやSkillを提供する仕組みをいち早く整備した。エコシステム全体でAIコーディングの品質を底上げする設計だ。

AI技術のキャッチアップのためふと試したLaravel Boost対応だったが、多くの学びがあった。書くものはコードだけではなくなった。だが必要な原則は同じだ。

良い設計は、読み手が人間でもAIでも等しく効く。
