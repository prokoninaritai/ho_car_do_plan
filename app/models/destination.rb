class Destination < ApplicationRecord
  belongs_to :itinerary
  has_one :time_management

  validates :visit_date, presence: true
  validates :arrival_order, presence: true
  validates :departure, presence: true
  validates :destination, presence: true
end
