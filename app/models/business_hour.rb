class BusinessHour < ApplicationRecord
  belongs_to :station, primary_key: :station_number, foreign_key: :station_number

  def formatted_opening_time
    opening_time.strftime('%H:%M') if opening_time.present?
  end

  def formatted_closing_time
    closing_time.strftime('%H:%M') if closing_time.present?
  end
end
