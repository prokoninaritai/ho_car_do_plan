class StartingPoint < ApplicationRecord
  class StartingPoint < ApplicationRecord
      validates :starting_point, presence: true, length: { maximum: 255 }
      validates :starting_point_latitude, presence: true, numericality: { greater_than_or_equal_to: -90, less_than_or_equal_to: 90 }
      validates :starting_point_longitude, presence: true, numericality: { greater_than_or_equal_to: -180, less_than_or_equal_to: 180 }
    
    # 暗号化
      encrypts :starting_point
      encrypts :starting_point_latitude
      encrypts :starting_point_longitude
    
    # アソシエーション
      belongs_to :itinerary
      has_many :destinations, dependent: :nullify
    end
end
