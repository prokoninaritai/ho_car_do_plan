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
|Column    |Type      |Options|
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
|Column        |Type    |Options                 |
|--------------|--------|------------------------|
|region        |string  |null: false             |　
|station_number|integer |null: false unique: true|  
|name          |string  |null: false             |　
|address       |string  |null: false             |　
|phone         |string  |null: false             |  
|latitude      |decimal |null: false             |  
|longitude     |decimal |null: false             |  

## Association
- has_many :stamps
- has_many :closed_days
- has_many :business_hours
- has_many :stamp_available_hours

## closed_days
|Column              |Type      |Options                        |
|--------------------|----------|-------------------------------|
|station             |references|null: false, foreign_key: true |　
|start_date          |string    |null: false                    |
|end_date            |string    |null: false                    |
|closed_info         |string    |null: false                    |
|remarks             |string    |                               |


## Association
- belongs_to :station

## business_hours
|Column         |Type       |Options                        |
|---------------|-----------|-------------------------------|
|station        |references |null: false, foreign_key: true |
|start_date     |string     |                               |
|end_date       |string     |                               |
|opening_time   |time       |                               |
|closing_time   |time       |                               |
|start_day      |integer    |                               |
|end_day        |integer    |                               |

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