class StampsController < ApplicationController
  before_action :authenticate_user!

  def index
    all_stations = Station.order(:region, :station_number)
    stamped_by_number = current_user.stamps.index_by(&:station_number)

    @regions = all_stations.group_by(&:region).transform_values do |stations|
      stations.map do |station|
        stamp = stamped_by_number[station.station_number]
        { station: station, stamped: stamp.present?, visited_at: stamp&.visited_at }
      end
    end

    @stamp_count = stamped_by_number.count
    @total_count = all_stations.count
  end

  def create
    stamp = current_user.stamps.find_or_initialize_by(station_number: params[:stamp][:station_number])
    stamp.visited_at = params[:stamp][:visited_at]

    if stamp.save
      render json: { success: true, stamp_id: stamp.id }
    else
      render json: { success: false, errors: stamp.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    stamp = current_user.stamps.find_by(station_number: params[:id])
    if stamp&.destroy
      render json: { success: true }
    else
      render json: { success: false }, status: :not_found
    end
  end
end
