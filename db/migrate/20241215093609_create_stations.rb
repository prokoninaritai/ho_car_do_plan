class CreateStations < ActiveRecord::Migration[7.0]
  def change
    create_table :stations do |t|
      t.string :region, null: false
      t.integer :station_number, null: false, unique: true
      t.string :name, null: false
      t.string :address, null: false
      t.string :phone, null: false
      t.decimal :latitude, precision: 10, scale: 6  # 緯度
      t.decimal :longitude, precision: 10, scale: 6  # 経度
      t.timestamps
    end
  end
end
