class CreateStamps < ActiveRecord::Migration[7.0]
  def change
    create_table :stamps do |t|
      t.references :user, null: false, foreign_key: true
      t.integer :station_number, null: false
      t.date :visited_at, null: false
      t.timestamps
    end
    add_index :stamps, [:user_id, :station_number], unique: true
  end
end
