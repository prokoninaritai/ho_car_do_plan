class CreateClosedDays < ActiveRecord::Migration[7.0]
  def change
    create_table :closed_days do |t|
    t.references :station, null: false, foreign_key: true # 駅の関連付け
      t.date :start_date, null: false                      # 休館開始日
      t.date :end_date, null: false                        # 休館終了日
      t.string :closed_info, null: false                   # 休館情報
      t.string :remarks                                    # 備考
      t.timestamps                                         # 作成日・更新日
    end
  end
end
