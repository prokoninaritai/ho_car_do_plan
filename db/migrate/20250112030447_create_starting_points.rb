class CreateStartingPoints < ActiveRecord::Migration[7.0]
  def change
    create_table :starting_points do |t|

      t.timestamps
    end
  end
end
