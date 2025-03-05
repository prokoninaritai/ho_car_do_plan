class TimeManagement < ApplicationRecord
  belongs_to :destination

  validates :departure_time, presence: true
  validates :custom_travel_time, presence: true
  validates :arrival_time, presence: true
  validates :stay_duration, presence: true
end
