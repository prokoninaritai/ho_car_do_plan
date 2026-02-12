# ほっ。CarDo! Plan - 設計仕様書

## 1. アプリケーション概要

北海道の道の駅スタンプラリーを効率的に回るための、車旅しおり作成アプリケーション。
Google Maps APIを活用し、複数日にわたるドライブ旅程の経路・時間管理を行う。

- **本番URL:** https://ho-car-do-plan.onrender.com
- **技術スタック:** Ruby on Rails 7.0 / SQLite(dev) / PostgreSQL(prod) / Google Maps API / Turbo + Stimulus

---

## 2. 機能一覧

### 2.1 認証機能（Devise）

| 機能 | 画面 | 説明 |
|------|------|------|
| 新規登録 | `/users/sign_up` | ニックネーム・メール・パスワードで登録 |
| ログイン | `/users/sign_in` | メール・パスワードで認証 |
| ログアウト | - | 全画面ヘッダーのボタンから実行（DELETE） |
| Basic認証 | - | 本番環境のみ。環境変数 `BASIC_AUTH_USER` / `BASIC_AUTH_PASSWORD` |

### 2.2 ダッシュボード（トップ画面）

| 機能 | 説明 |
|------|------|
| 道の駅マップ表示 | 北海道全域の道の駅をピンで表示（Google Maps） |
| 道の駅詳細モーダル | ピンクリックで休館日・営業時間・スタンプ押印時間を表示 |
| しおり作成モーダル | タイトル・開始日・終了日を入力して旅程を作成 |

### 2.3 経路選択（destinations/new）

| 機能 | 説明 |
|------|------|
| 出発地選択 | 地図上の道の駅クリック、または現在地取得（Geolocation API）で設定 |
| 出発地登録 | サーバーに保存し、経路選択モードに切り替え |
| 経路選択 | 道の駅ピンを順番にクリックして経路を構築。番号ラベル付き |
| 経路描画 | Google Maps Directions APIで実際の道路上に経路を描画（DRIVING） |
| 経路解除 | 選択済みピンを再クリックで解除。番号・経路を再計算 |
| 前日目的地の自動引き継ぎ | 2日目以降は前日最後の目的地を自動で出発地に設定 |
| 過去日の目的地表示 | 過去の日の目的地を日ごとに色分けしたピンで表示（番号付き） |
| 状態復元 | 経路選択画面に戻った場合、出発地・選択済み経路を復元 |

**日ごとのピン色:**

| 日目 | 色 |
|------|------|
| 1日目 | 赤 |
| 2日目 | オレンジ |
| 3日目 | 黄色 |
| 4日目 | 緑 |
| 5日目 | 水色 |
| 6日目 | 青 |
| 7日目 | 紫 |

### 2.4 時間管理（day_schedule）

| 機能 | 説明 |
|------|------|
| 出発時間入力 | 当日の出発時間を手動入力 |
| 移動時間表示・編集 | Google Maps APIから取得した移動時間を表示。手動変更可能 |
| 到着時間自動計算 | 出発時間 + 移動時間 = 到着予定時間（リアルタイム更新） |
| 滞在時間入力 | デフォルト20分。手動変更可能 |
| 出発予定時間自動計算 | 到着時間 + 滞在時間 = 次の出発予定時間 |
| 道の駅情報表示 | 各目的地の休館日・営業時間・スタンプ押印時間を表示 |
| しおり登録 | 時間情報をサーバーに保存 |
| 経路選択に戻る | 同じ日の経路選択画面に戻る |
| 日程遷移 | 登録後、次の日の経路選択画面へ自動遷移。最終日はしおり表示へ |

### 2.5 しおり表示（itineraries/show）

| 機能 | 説明 |
|------|------|
| 全体旅程表示 | 日ごとに目的地を一覧表示（出発地 → 目的地、距離、移動時間） |

---

## 3. 画面遷移図

```
ランディングページ (/)
  ├── ログイン (/users/sign_in)
  └── 新規登録 (/users/sign_up)
          │
          v
ダッシュボード (/maps/dashboard) ※ログイン後のルート
  ├── 道の駅詳細モーダル（ピンクリック）
  └── しおり作成モーダル
          │ POST /itineraries
          v
経路選択 (/itineraries/:id/destinations/new?current_day=N)
  │  1. 出発地登録 → POST /itineraries/:id/starting_points
  │  2. 経路選択（ピンクリック）
  │  3. しおり作成 → POST /itineraries/:id/destinations
  v
時間管理 (/itineraries/:id/day_schedule?current_day=N)
  │  ├── 経路選択に戻る → destinations/new (同じ日)
  │  └── しおり登録 → POST /time_managements
  │          │
  │          ├── 次の日がある場合 → 経路選択 (current_day + 1)
  │          └── 最終日の場合 ↓
  v
しおり表示 (/itineraries/:id)
```

---

## 4. API エンドポイント一覧

| メソッド | パス | コントローラ#アクション | 説明 |
|----------|------|-------------------------|------|
| GET | `/` | `static_pages#home` | ランディング（未認証時） |
| GET | `/` | `maps#dashboard` | ダッシュボード（認証時） |
| GET | `/maps/stations_data` | `maps#stations_data` | 道の駅JSON取得 |
| POST | `/itineraries` | `itineraries#create` | しおり作成 |
| GET | `/itineraries/:id` | `itineraries#show` | しおり表示 |
| GET | `/itineraries/:id/day_schedule` | `itineraries#day_schedule` | 日程スケジュール |
| GET | `/itineraries/:id/destinations/new` | `destinations#new` | 経路選択画面 |
| POST | `/itineraries/:id/destinations` | `destinations#create` | 経路保存 |
| POST | `/itineraries/:id/starting_points` | `starting_points#create` | 出発地登録 |
| POST | `/time_managements` | `time_managements#create` | 時間情報一括保存 |

---

## 5. ER図

```
users
  |
  | 1:N
  v
itineraries ----+---- 1:1 ----> starting_points
  |
  | 1:N
  v
destinations
  |
  | 1:1
  v
time_managements


stations (マスタ, station_number で関連)
  |
  +-- 1:N --> business_hours
  +-- 1:N --> closed_days
  +-- 1:N --> stamp_available_hours
```

---

## 6. テーブル定義

### users

| カラム | 型 | 制約 | 説明 |
|--------|------|------|------|
| id | integer | PK | |
| nickname | string | NOT NULL | 表示名 |
| email | string | NOT NULL, UNIQUE | メールアドレス |
| encrypted_password | string | NOT NULL | パスワード（Devise） |
| reset_password_token | string | UNIQUE | パスワードリセット用 |
| reset_password_sent_at | datetime | | |
| remember_created_at | datetime | | |
| created_at | datetime | NOT NULL | |
| updated_at | datetime | NOT NULL | |

### itineraries

| カラム | 型 | 制約 | 説明 |
|--------|------|------|------|
| id | integer | PK | |
| title | string | NOT NULL | しおりタイトル |
| start_date | date | NOT NULL | 旅行開始日 |
| end_date | date | NOT NULL | 旅行終了日 |
| user_id | integer | NOT NULL, FK(users) | |
| created_at | datetime | NOT NULL | |
| updated_at | datetime | NOT NULL | |

### starting_points

| カラム | 型 | 制約 | 説明 |
|--------|------|------|------|
| id | integer | PK | |
| itinerary_id | integer | NOT NULL, FK(itineraries) | |
| starting_point | string | NOT NULL | 出発地名 |
| starting_point_latitude | decimal(10,6) | NOT NULL | 緯度 |
| starting_point_longitude | decimal(10,6) | NOT NULL | 経度 |
| created_at | datetime | NOT NULL | |
| updated_at | datetime | NOT NULL | |

### destinations

| カラム | 型 | 制約 | 説明 |
|--------|------|------|------|
| id | integer | PK | |
| itinerary_id | integer | NOT NULL, FK(itineraries) | |
| visit_date | date | NOT NULL | 訪問日 |
| arrival_order | integer | NOT NULL | 到着順（1始まり） |
| departure | string | NOT NULL | 出発地名 |
| destination | string | NOT NULL | 目的地名 |
| api_travel_time | string | | 移動時間（"H:MM"形式） |
| distance | decimal(10,2) | | 距離（メートル） |
| departure_latitude | decimal(10,6) | | 出発地緯度 |
| departure_longitude | decimal(10,6) | | 出発地経度 |
| destination_latitude | decimal(10,6) | | 目的地緯度 |
| destination_longitude | decimal(10,6) | | 目的地経度 |
| created_at | datetime | NOT NULL | |
| updated_at | datetime | NOT NULL | |

### time_managements

| カラム | 型 | 制約 | 説明 |
|--------|------|------|------|
| id | integer | PK | |
| destination_id | integer | NOT NULL, FK(destinations) | |
| departure_time | string | NOT NULL | 出発時間（"HH:MM"） |
| custom_travel_time | string | NOT NULL | 移動時間（"HH:MM"） |
| arrival_time | string | NOT NULL | 到着時間（"HH:MM"） |
| stay_duration | string | NOT NULL | 滞在時間（"HH:MM"） |
| created_at | datetime | NOT NULL | |
| updated_at | datetime | NOT NULL | |

### stations（マスタ）

| カラム | 型 | 制約 | 説明 |
|--------|------|------|------|
| id | integer | PK | |
| region | string | NOT NULL | 地域名 |
| station_number | integer | NOT NULL, UNIQUE | 道の駅番号 |
| name | string | NOT NULL | 道の駅名 |
| address | string | NOT NULL | 住所 |
| phone | string | NOT NULL | 電話番号 |
| latitude | decimal(10,6) | | 緯度 |
| longitude | decimal(10,6) | | 経度 |
| created_at | datetime | NOT NULL | |
| updated_at | datetime | NOT NULL | |

### business_hours

| カラム | 型 | 制約 | 説明 |
|--------|------|------|------|
| id | integer | PK | |
| station_number | integer | NOT NULL | 道の駅番号（FK相当） |
| start_date | string | | 営業開始日（"M-D"形式） |
| end_date | string | | 営業終了日（"M-D"形式） |
| opening_time | time | | 開店時間 |
| closing_time | time | | 閉店時間 |
| start_day | integer | | 曜日開始（1=月〜7=日） |
| end_day | integer | | 曜日終了 |
| created_at | datetime | NOT NULL | |
| updated_at | datetime | NOT NULL | |

### closed_days

| カラム | 型 | 制約 | 説明 |
|--------|------|------|------|
| id | integer | PK | |
| station_number | integer | NOT NULL | 道の駅番号（FK相当） |
| start_date | string | | 休館開始日 |
| end_date | string | | 休館終了日 |
| closed_info | string | | 休館情報（例: "毎週月曜日"） |
| remarks | string | | 備考 |
| created_at | datetime | NOT NULL | |
| updated_at | datetime | NOT NULL | |

### stamp_available_hours

| カラム | 型 | 制約 | 説明 |
|--------|------|------|------|
| id | integer | PK | |
| station_number | integer | NOT NULL | 道の駅番号（FK相当） |
| available_hour | string | NOT NULL | 押印可能時間（例: "8:00-17:00"） |
| remarks | string | | 備考 |
| created_at | datetime | NOT NULL | |
| updated_at | datetime | NOT NULL | |

---

## 7. 外部キー制約

| 対象テーブル | カラム | 参照先 |
|-------------|--------|--------|
| destinations | itinerary_id | itineraries.id |
| itineraries | user_id | users.id |
| starting_points | itinerary_id | itineraries.id |
| time_managements | destination_id | destinations.id |

※ stations系テーブル（business_hours, closed_days, stamp_available_hours）は `station_number` で論理的に関連しているが、DBレベルのFK制約はない。
