class AddRemarksToBusinessHours < ActiveRecord::Migration[7.0]
  def change
    add_column :business_hours, :remarks, :string
  end
end
