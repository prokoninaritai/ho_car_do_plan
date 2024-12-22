class CreateBusinessHours < ActiveRecord::Migration[7.0]
  def change
    create_table :business_hours do |t|
      t.references :station, null: false, foreign_key: true # 駅の関連付け
      t.string :start_date                                 # 営業開始日
      t.string :end_date                                   # 営業終了日
      t.time :opening_time, null: false                    # 開館時間
      t.time :closing_time, null: false                    # 閉館時間
      t.integer :start_day                                 # 開始曜日 (1=月, 7=日)
      t.integer :end_day                                   # 終了曜日 (1=月, 7=日)
      t.timestamps                                         # 作成日・更新日
    end
  end
end
