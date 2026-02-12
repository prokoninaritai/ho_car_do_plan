class ItinerariesController < ApplicationController
  before_action :set_itinerary, only: [:show, :day_schedule]

  def create
    @itinerary = Itinerary.new(itinerary_params)

    if @itinerary.save
      render json: { success: true, itinerary_id: @itinerary.id }
    else
      render json: { success: false, errors: @itinerary.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def show
    @destinations = @itinerary.destinations.includes(:time_management).order(:visit_date, :arrival_order)
    @destinations_by_date = @destinations.group_by(&:visit_date)
    @total_days = (@itinerary.end_date - @itinerary.start_date).to_i + 1

    # 地図表示用: 全目的地を日ごとの色分け情報付きで準備
    @all_destinations_for_map = @destinations.map do |d|
      day_number = (d.visit_date - @itinerary.start_date).to_i + 1
      {
        name: d.destination,
        lat: d.destination_latitude,
        lng: d.destination_longitude,
        arrival_order: d.arrival_order,
        day: day_number
      }
    end

    # 出発地情報
    @starting_point = @itinerary.starting_point
  end

  def day_schedule
    @current_day = params[:current_day].to_i
    @visit_date = @itinerary.start_date + (@current_day - 1).days
    @total_days = (@itinerary.end_date - @itinerary.start_date).to_i + 1
    # 当日の目的地を取得（time_management含む）
    @destinations = @itinerary.destinations.includes(:time_management).where(visit_date: @visit_date).order(:arrival_order)
    # 出発地情報
    @starting_point = StartingPoint.find_by(itinerary_id: @itinerary.id)
    # 目的地の駅情報を取得
    @station_data = Station.where(name: @destinations.pluck(:destination))
  end

  private

  def itinerary_params
    params.require(:itinerary).permit(:title, :start_date, :end_date).merge(user_id: current_user.id)
  end

  def set_itinerary
    @itinerary = Itinerary.find(params[:id])
  end
end
