## users
|Column             |Type  |Options                  |
|-------------------|------|-------------------------|
|nickname           |string|null: false              |
|email              |string|null: false, unique: true|
|encrypted_password |string|null: false              |

## Association
- has_many :stamps
- has_many :itineraries

## stamps
|Column         |Type      |Options|
|---------------|----------|------------------------------|
|station        |references|null: false, foreign_key: true|
|user           |references|null: false, foreign_key: true|
|stamp_completed|boolean   |default: false                |
|stamp_date     |date      |null: true                    |

## Association
- belongs_to :user
- belongs_to :station

## itineraries
|Column    |Type|Options|
|----------|----------|------------------------------|
|user      |references|null: false, foreign_key: true|
|title	   |string	  |null: false                   |
|start_date|date      |null: false                   |
|end_date  |date	    |null: false                   |

## Association
- belongs_to :user
- has_many :destinations
- has_many :time_managements, through: :destinations

## destinations
|Column         |Type      |Options                        |
|---------------|----------|-------------------------------|
|itinerary      |references|null: false, foreign_key: true |
|visit_date     |date      |null: false                    |
|arrival_order  |integer   |null: false                    |
|departure      |string    |null: false                    |
|destination    |string    |null: false                    |
|api_travel_time|integer   |                               |
|distance       |decimal   |                               |
|latitude       |decimal   |                               |
|longitude      |decimal   |                               |

### Association
- belongs_to :itinerary
- has_one :time_management

## time_managements
|Column             |Type      |Options                        |
|-------------------|----------|-------------------------------|
|destination        |references|null: false, foreign_key: true |
|departure_time     |time      |null: false                    |
|custom_travel_time |integer   |                               | 
|arrival_time       |time      |null: false                    | 
|stay_duration      |integer   |                               |

## Association
- belongs_to :destination

## stations
|Column    |Type    |Options     |
|----------|--------|------------|
|name      |string  |null: false |
|address   |string  |null: false |
|latitude  |decimal |            | 
|longitude |decimal |            | 

## Association
- has_many :stamps
- has_many :closed_days
- has_many :business_hours
- has_many :stamp_available_hours

## closed_days
|Column              |Type      |Options                        |
|--------------------|----------|-------------------------------|
|station             |references|null: false, foreign_key: true |
|start_date          |date      |null: false                    |
|end_date            |date      |null: false                    |
|closed_info         |string    |                               |
|remarks             |string    |                               |
|holiday_season_break|string    |                               |

## Association
- belongs_to :station

## business_hours
|Column         |Type       |Options                        |
|---------------|-----------|-------------------------------|
|station        |references |null: false, foreign_key: true |
|start_date     |date       |null: false                    |
|end_date       |date       |null: false                    |
|business_hours |string     |null: false                    |

## Association
- belongs_to :station

## stamp_available_hours
|Column         |Type      |Options                        |
|---------------|----------|-------------------------------|
|station        |references|null: false, foreign_key: true |
|available_hours|string    |null: false                    |
|remarks        |string    |                               |

## Association
- belongs_to :station

# アプリケーション名	
ほっ。CarDo!Plan  

# アプリケーション概要	
北海道の道の駅スタンプを効率的に集めるためのドライブ計画（旅のしおり）を作成するマップアプリ

# URL
デプロイが完了次第記載

# テスト用アカウント
ログインID  
パスワード  
Basic認証  
ID  
Pass  

# 利用方法
・道の駅スタンプを押印したか登録しておく。  
・マップ上の道の駅のピン表示について   
　・スタンプ押印していない⇒青  
　・スタンプ押印している⇒赤  

・日程を作成する  
・ドライブの日程を選択する  
・出発地を登録する  
・目的地を登録する    
・目的地を変更する  
・しおりを作成する  
・休館日、営業時間外、スタンプ押印時間外に該当しないか確認し、問題なければ登録
・日程はいつでも変更可能


# アプリケーションを作成した背景
車中泊で北海道の道の駅スタンプを集めるのがすきな人に向けたアプリです。
思ったより移動に時間がかかってしまったり、寄り道してしまったせいで行きたかったところにいけなくなってしまったという問題を解決するために旅に出る前にあらかじめ移動のルートや時間的なイメージ、どのくらいゆっくりしてもいいのかを考え、計画し、しおりにします。  
余裕のある計画で安全で楽しい車旅をしてほしいとの思いでこのアプリを作りたいと思いました。

# 実装予定の機能
◎ユーザー管理機能  
◎目的地登録機能  
◎目的地編集機能  
◎しおり登録機能  
◎日程確認機能  
◎スタンプ押印登録機能  
◎マイページ機能  
◎設定機能  

# データベース設計
[![Image from Gyazo](https://i.gyazo.com/d28732fc48b22a564c03fdf4e6f3e7e8.png)](https://gyazo.com/d28732fc48b22a564c03fdf4e6f3e7e8)

# 画面遷移図
[![Image from Gyazo](https://i.gyazo.com/88efafa7ed33f368aa1283514b57d41f.png)](https://gyazo.com/88efafa7ed33f368aa1283514b57d41f)

# 開発環境
使用した言語:Ruby

# 制作背景
車中泊で北海道の道の駅スタンプを集めるのがすきです。  
道の駅ごとに休日が異なり、営業時間が異なり、スタンプ押印可能時間が異なるため、到着したは良いけど実は押印時間外、休館日で次の日まで待つか、別の日にその道の駅のために寄り道しなければいけなくなり、寄り道したせいで行きたかったところがまたいけなくなったなんてことや、営業時間ギリギリで「急いで次の道の駅行かないと」という焦りで心に余裕が無くなることも経験しており、１年間で１２８個の道の駅を効率よく制覇するためには、旅のしおりが必要だと思い、このアプリを作りたいと思いました。

