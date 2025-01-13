class TimeManagement < ApplicationRecord
  belongs_to :destination

  validates :departure_time, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :custom_travel_time, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :arrival_time, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :stay_duration, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
end
