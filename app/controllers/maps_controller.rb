class MapsController < ApplicationController
  before_action :authenticate_user!

  def dashboard
    @stations = Station.select(:id, :name, :latitude, :longitude, :address)
    @itinerary = Itinerary.new
  end

  def stations_data
    stations = Station.select(:id, :name, :latitude, :longitude, :address)
    render json: stations.to_json(include: [:closed_days, :business_hours, :stamp_available_hours])
  end
end
