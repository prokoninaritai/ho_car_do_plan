# CLAUDE.md - 開発ガイド

## プロジェクト概要

北海道道の駅スタンプラリー向けドライブ旅程作成アプリ。
Rails 7.0 + Google Maps API + Turbo/Stimulus。

## よく使うコマンド

### サーバー起動

```bash
bin/rails server -b 0.0.0.0
```

### データベース

```bash
bin/rails db:migrate          # マイグレーション実行
bin/rails db:seed              # シードデータ投入
bin/rails db:reset             # DB削除→作成→シード
bin/rails db:migrate:status    # マイグレーション状態確認
```

### アセット

```bash
bin/rails assets:precompile    # アセットプリコンパイル
bin/rails assets:clobber       # プリコンパイル済みアセット削除
```

### コンソール・デバッグ

```bash
bin/rails console              # Railsコンソール
bin/rails routes               # ルーティング一覧
```

### Lint

```bash
bundle exec rubocop            # Rubyコード静的解析
```

## プロジェクト構成

```
app/
  controllers/
    application_controller.rb  # Basic認証、Devise設定
    maps_controller.rb         # ダッシュボード、道の駅JSON
    itineraries_controller.rb  # しおりCRUD、日程スケジュール
    destinations_controller.rb # 経路選択・保存
    starting_points_controller.rb  # 出発地登録
    time_managements_controller.rb # 時間情報保存
  models/
    station.rb                 # 道の駅マスタ
    itinerary.rb               # しおり
    destination.rb             # 目的地
    starting_point.rb          # 出発地
    time_management.rb         # 時間管理
  javascript/
    dashboard.js               # ダッシュボード地図・モーダル
    itineraries.js             # しおり作成フォーム
    starting_points.js         # 出発地選択・地図初期化(destinations/new)
    destinations.js            # 経路選択・描画・保存
    day_schedule.js            # 時間計算・登録
  views/
    maps/dashboard.html.erb    # メイン画面
    destinations/new.html.erb  # 経路選択画面
    itineraries/
      day_schedule.html.erb    # 時間管理画面
      show.html.erb            # しおり表示
  assets/stylesheets/
    shared.scss                # 共通スタイル（ヘッダー/フッター/地図）
    day_schedule.scss          # 時間管理画面用
    itineraries.scss           # しおり関連
```

## 技術スタック

| 項目 | 技術 |
|------|------|
| バックエンド | Ruby on Rails 7.0 |
| フロントエンド | Turbo + Stimulus + importmap |
| DB（開発） | SQLite3 |
| DB（本番） | PostgreSQL |
| 認証 | Devise |
| 地図API | Google Maps JavaScript API / Directions API |
| CSS | SCSS + Bootstrap 5.3 |
| デプロイ | Render |

## コーディング規約

### Ruby / Rails

- モデルのバリデーションは `presence` を基本とし、数値は `numericality` で範囲指定する
- コントローラーのアクションは `before_action` でリソース取得を共通化する
- JSON応答は `render json:` で返す。jbuilderは使用していない
- 時間データは `"HH:MM"` の文字列形式で保存する（time_managements, api_travel_time）
- 座標は `decimal(10,6)` で保存する

### JavaScript

- `turbo:load` イベントで初期化する（`DOMContentLoaded` は destinations.js のみ使用）
- グローバル変数は `window.xxx` で宣言し、ファイル間で共有する
- Google Maps のマーカー・レンダラーは配列（`window.markers`, `routeRenderers`）で管理する
- 非同期処理は `fetch` + `Promise` を使用する（async/awaitは使用していない）
- DOM要素からのデータ受け渡しは `data-*` 属性を使用する

### ビュー

- レイアウトは `application.html.erb` 単一
- 各画面にヘッダー（緑 `#4CAF50`、固定）とフッター（緑、固定、円形ボタン）を配置する
- フォーム送信は JavaScript の `fetch` で行い、ページ遷移は `window.location.href` で制御する
- ERBの `data-*` 属性でコントローラーからJSにデータを渡す

### スタイル

- カラーパレット: 緑 `#4CAF50`（メイン）、赤 `#ff4d4d`（ログアウト）、青 `#2196F3`（アクセント）
- 時間管理画面のブロック色: 出発=ピンク `#ffe4e1` / 移動=黄 `#ffffe0` / 目的地=緑 `#e6ffe6` / 最終=青 `#d1f5fc`
- `reset.scss` でブラウザデフォルトスタイルをリセットしている

## 環境変数

| 変数名 | 用途 | 必須環境 |
|--------|------|----------|
| `GOOGLE_MAPS_API_KEY` | Google Maps API キー | 全環境 |
| `BASIC_AUTH_USER` | Basic認証ユーザー名 | 本番 |
| `BASIC_AUTH_PASSWORD` | Basic認証パスワード | 本番 |
| `DATABASE_URL` | PostgreSQL接続文字列 | 本番 |

## 主要なデータフロー

1. **しおり作成**: JS(itineraries.js) → POST /itineraries → リダイレクト destinations/new
2. **出発地登録**: JS(starting_points.js) → POST /starting_points → UI切り替え（経路選択モード）
3. **経路保存**: JS(destinations.js) → Google Directions API → POST /destinations → リダイレクト day_schedule
4. **時間登録**: JS(day_schedule.js) → POST /time_managements → リダイレクト（次の日 or しおり表示）
