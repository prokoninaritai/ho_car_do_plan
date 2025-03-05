class StampAvailableHour < ApplicationRecord
  belongs_to :station, primary_key: :station_number, foreign_key: :station_number
end
