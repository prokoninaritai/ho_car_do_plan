class AddPlaceHoursToDestinations < ActiveRecord::Migration[7.0]
  def change
    add_column :destinations, :place_hours, :text
  end
end
