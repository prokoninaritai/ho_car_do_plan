class CreateClosedDays < ActiveRecord::Migration[7.0]
  def change
    create_table :closed_days do |t|
      t.integer :station_number, null: false, foreign_key: true # 駅の関連付け
      t.string :start_date                     # 休館開始日
      t.string :end_date                       # 休館終了日
      t.string :closed_info                    # 休館情報
      t.string :remarks  
      t.timestamps
    end
  end
end
