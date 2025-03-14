class Itinerary < ApplicationRecord
  belongs_to :user
  has_many :destinations, dependent: :destroy
  has_one :starting_point, dependent: :destroy

  # バリデーション
  validates :title, presence: true
  validates :start_date, presence: true
  validates :end_date, presence: true
  validate :end_date_after_start_date

  # メソッド: 終了日が開始日より後であることをチェック
  private

  def end_date_after_start_date
    return if start_date.blank? || end_date.blank?

    return unless end_date < start_date

    errors.add(:end_date, 'は開始日より後の日付を選択してください')
  end
end
