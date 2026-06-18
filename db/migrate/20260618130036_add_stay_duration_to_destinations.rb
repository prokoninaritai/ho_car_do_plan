class AddStayDurationToDestinations < ActiveRecord::Migration[7.0]
  def change
    add_column :destinations, :stay_duration, :string
  end
end
