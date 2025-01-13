class CreateTimeManagements < ActiveRecord::Migration[7.0]
  def change
    create_table :time_managements do |t|
      t.references :destination, null: false, foreign_key: true
      t.time :departure_time, null: false
      t.integer :custom_travel_time, null: false
      t.time :arrival_time, null: false
      t.integer :stay_duration, null: false
      t.timestamps
    end
  end
end
