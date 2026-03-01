class MapsController < ApplicationController
  before_action :authenticate_user!

  def dashboard
    @stations = Station.select(:id, :name, :latitude, :longitude, :address)
    @itinerary = Itinerary.new
  end

  def stations_data
    stations = Station
               .select(:station_number, :name, :latitude, :longitude, :address)
               .includes(:closed_days, :business_hours, :stamp_available_hours)

    stamped = current_user.stamps.index_by(&:station_number)

    stations_json = stations.as_json(include: [:closed_days, :business_hours, :stamp_available_hours])
    stations_json.each do |s|
      stamp = stamped[s['station_number']]
      s['stamped'] = stamp.present?
      s['visited_at'] = stamp&.visited_at&.strftime('%Y-%m-%d')
    end

    render json: stations_json
  end
end
