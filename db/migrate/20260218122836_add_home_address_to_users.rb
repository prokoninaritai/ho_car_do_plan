class AddHomeAddressToUsers < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :home_address, :string
    add_column :users, :home_latitude, :decimal, precision: 10, scale: 6
    add_column :users, :home_longitude, :decimal, precision: 10, scale: 6
  end
end
