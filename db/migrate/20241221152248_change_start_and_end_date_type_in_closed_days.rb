class ChangeStartAndEndDateTypeInClosedDays < ActiveRecord::Migration[7.0]
  def up
    # 型を変更
    change_column :closed_days, :start_date, :string
    change_column :closed_days, :end_date, :string
  end

  def down
    # 変更を元に戻す
    change_column :closed_days, :start_date, :date
    change_column :closed_days, :end_date, :date
  end
end