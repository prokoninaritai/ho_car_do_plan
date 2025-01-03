class CreateDestinations < ActiveRecord::Migration[7.0]
  def change
    create_table :destinations do |t|
      t.references :itinerary, null: false, foreign_key: true
      t.date :visit_date, null: false
      t.integer :arrival_order, null: false
      t.string :departure, null: false
      t.string :destination, null: false
      t.integer :api_travel_time
      t.decimal :distance, precision: 10, scale: 2
      t.decimal :latitude, precision: 10, scale: 6
      t.decimal :longitude, precision: 10, scale: 6
      t.timestamps
    end
  end
end
