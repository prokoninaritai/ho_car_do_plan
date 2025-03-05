class CreateTimeManagements < ActiveRecord::Migration[7.0]
  def change
    create_table :time_managements do |t|
      t.references :destination, null: false, foreign_key: true
      t.string :departure_time, null: false
      t.string :custom_travel_time, null: false
      t.string :arrival_time, null: false
      t.string :stay_duration, null: false
      t.timestamps
    end
  end
end
