class ClosedDay < ApplicationRecord
  belongs_to :station, primary_key: :station_number, foreign_key: :station_number

  # 同じ `station_number` で重複する期間を登録しない
  validates :start_date, uniqueness: { scope: [:end_date, :station_number], message: '既に登録されています' }
end
