class AddColumnsToStations < ActiveRecord::Migration[7.0]
  def change
    add_column :stations, :region, :string, null: false
    add_column :stations, :station_number, :integer, null: false
    add_column :stations, :phone, :string, null: false
    add_index :stations, :station_number, unique: true
  end
end
