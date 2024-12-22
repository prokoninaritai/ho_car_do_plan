class ClosedDay < ApplicationRecord
  belongs_to :station

  # 必須のフィールド
  validates :start_date, presence: true
  validates :end_date, presence: true
  validates :closed_info, presence: true

  # 同じ `station_id` で重複する期間を登録しない
  validates :start_date, uniqueness: { scope: [:end_date, :station_id], message: "既に登録されています" }
end

