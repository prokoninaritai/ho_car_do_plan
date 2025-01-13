class CreateStartingPoints < ActiveRecord::Migration[7.0]
  def change
    create_table :starting_points do |t|
      t.references :itinerary, null: false, foreign_key: true
      t.string :starting_point, null: false
      t.decimal :starting_point_latitude, precision: 10, scale: 6, null: false
      t.decimal :starting_point_longitude, precision: 10, scale: 6, null: false
      t.timestamps
    end
  end
end
