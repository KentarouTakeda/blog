---
title: モダンLaravelを体験しよう！
subtitle: いつからLaravelがサーバサイドフレームワークだと錯覚していた？
description: PHPMatsuri Reboot in Hackoneで開催予定のハンズオン資料。Laravel + Wayfinder + Inertia.js + React + Laravel AI SDKによるAI時代のフルスタックLaravel開発
date: 2026-11-05 23:30
tags:
  - PHP
  - Laravel
---

[PHPMatsuri Reboot in Hackone](https://phpmatsuri.asumikam.com/)で11月7日に開催予定のハンズオン資料。参加者以外の方が記事を読みながら手元で体験できる構成にもなっている。

現在は、ハンズオンの概要と前提環境やセットアップ方法のみ。開催直前に全内容を公開する予定。

## ハンズオンの内容

Laravelと聞いて、何を思い浮かべるだろうか？

多くの人は「PHP用のサーバサイドフレームワーク」と答えるだろう。間違いではないが、それは現代のLaravelの一面しか捉えていない。

2026年現在、LaravelはモダンフロントエンドやAIエージェント開発、ゼロスケールを含むオートスケール完備のクラウドデプロイ環境までを内包するようになった。それを体験するのがこのハンズオンの目的だ。デプロイはGitHub連携だけで済んでしまうので、このハンズオンではモダンフロントエンドとAIエージェント開発に焦点を当てる。

「前提環境」の確認、余裕があれば「セットアップ」の実施を済ませておくと、当日のHackoneが捗るはずだ。

## 前提環境

- PHP: `>=8.4.1`
  - `memory_limit >= 256M`
  - `pdo_sqlite`
- Composer: `>=2.10`
- Node.js: `^22.18 || ^24.11 || >=26`
- お好みのAIプロバイダ（このハンズオンはClaude Codeで動作確認した）
  - コーディングエージェントの動作する環境
  - Laravel AI SDKで使うAPIキー

## セットアップ

**このハンズオンではWayfinder（当日解説する）の開発版を使う。** 安定版での実行も可能だが、型安全なフロントエンド開発の体験が一部失われる。是非とも開発版で試してみて欲しい。

開発版はLaravelの標準インストールに対していくつかの調整が必要なため、予めそれらを済ませたリポジトリを用意した。次の手順でセットアップできる:

Wayfinder開発版対応スターターキット（Laravel Cloudへのデプロイも試す場合は、forkしたリポジトリをclone）:
```sh
git clone https://github.com/KentarouTakeda/modern-laravel-hands-on-2026.git
cd modern-laravel-hands-on-2026
```

Laravelセットアップ・`install` ではなく `setup` である点に注意:
```sh
composer setup
```

Laravel Boostセットアップ・コーディングエージェントをインストールした後に実行:
```sh
php artisan boost:install --no-interaction
```

Wayfinder開発版の利用に抵抗がある方のために、安定版のセットアップ方法も記載しておく。

{% details 参考: Wayfinder安定版を使う場合 %}

Laravel Installerのインストールまたは最新版への更新:
```sh
composer global require laravel/installer
```

このハンズオンと同等（Wayfinderのみ安定版）のセットアップ・コーディングエージェントをインストールした後に実行:
```sh
laravel new modern-laravel-hands-on-2026 \
  --react \
  --phpunit \
  --npm \
  --boost \
  --no-interaction
cd modern-laravel-hands-on-2026
```

*または*、対話プロンプトで好みのオプションを指定:
```sh
laravel new modern-laravel-hands-on-2026
cd modern-laravel-hands-on-2026
```

{% enddetails %}

どちらのセットアップも、次の方法で動作確認できる:

1. `composer dev` を実行
2. `http://localhost:8000` にアクセス
3. 確認: Laravelのウェルカムページが表示される

## 内容の予告

以上のセットアップの後は、実はやることは多くない。要点だけ押さえたごく短いプロンプトを2回ほど入力すれば、モダンフロントエンドに対応したAIエージェント内蔵アプリケーションが完成する。

ハンズオンでは完成の様子を眺めながら、「モダンLaravel」とは何なのか、開発者やユーザーにとって何が嬉しいのか、これらを説明していく予定だ。最後に、ごく少額のサブスクリプション（初月は無料）に抵抗がなければ、完成したアプリケーションをLaravel Cloudへデプロイするところまで体験して欲しい。

それでは皆さん、当日お会いしましょう！
