class Station < ApplicationRecord
  # アソシエーション
  has_many :stamps, dependent: :destroy, primary_key: :station_number, foreign_key: :station_number
  has_many :closed_days, dependent: :destroy, primary_key: :station_number, foreign_key: :station_number
  has_many :business_hours, dependent: :destroy, primary_key: :station_number, foreign_key: :station_number
  has_many :stamp_available_hours, dependent: :destroy, primary_key: :station_number, foreign_key: :station_number
  # バリデーション
  validates :name, presence: true
  validates :address, presence: true
  validates :latitude, presence: true, numericality: true
  validates :longitude, presence: true, numericality: true
end
