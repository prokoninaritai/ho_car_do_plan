class MapsController < ApplicationController
  before_action :authenticate_user!
  
  def dashboard
    @stations = Station.left_outer_joins(:stamps)
                       .select("stations.*, stamps.stamp_completed")
                       .where("stamps.user_id = ?", current_user.id)
    respond_to do |format|
      format.html
      format.json{ rende json: @stations }
    end
  end
end
