class AddKanaToStations < ActiveRecord::Migration[7.0]
  def change
    add_column :stations, :kana, :string
  end
end
