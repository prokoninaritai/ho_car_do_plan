class CreateStampAvailableHours < ActiveRecord::Migration[7.0]
  def change
    create_table :stamp_available_hours do |t|
      t.integer :station_number, null: false, foreign_key: true # 駅の関連付け
      t.string :available_hour, null: false               # スタンプ押印可能時間
      t.string :remarks                                    # 備考
      t.timestamps                                         # 作成日・更新日
    end
  end
end
