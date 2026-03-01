class Stamp < ApplicationRecord
  belongs_to :user
  belongs_to :station, primary_key: :station_number, foreign_key: :station_number

  validates :station_number, presence: true
  validates :visited_at, presence: true
  validates :station_number, uniqueness: { scope: :user_id }
end
