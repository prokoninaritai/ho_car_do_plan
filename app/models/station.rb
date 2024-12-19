class Station < ApplicationRecord
  geocoded_by :address
  after_validation :geocode

  # アソシエーション
  has_many :stamps, dependent: :destroy
  has_many :closed_days, dependent: :destroy
  has_many :business_hours, dependent: :destroy
  has_many :stamp_available_hours, dependent: :destroy

  # バリデーション
  validates :name, presence: true
  validates :address, presence: true
  validates :latitude, presence: true, numericality: true
  validates :longitude, presence: true, numericality: true
end