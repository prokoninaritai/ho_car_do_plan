class ItinerariesController < ApplicationController
  before_action :set_itinerary, only: [:show, :day_schedule]

  def index
    @itineraries = current_user.itineraries.includes(:destinations, :starting_point).order(created_at: :desc)
    stamped_numbers = current_user.stamps.pluck(:station_number)
    @stamped_station_names = Station.where(station_number: stamped_numbers).pluck(:name).to_set
    @station_number_by_name = Station.where(name: @itineraries.flat_map { |i| i.destinations.map(&:destination) }.uniq)
                                     .pluck(:name, :station_number).to_h
  end

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
    @departure_time = params[:departure_time].presence
    @visit_date = @itinerary.start_date + (@current_day - 1).days
    @total_days = (@itinerary.end_date - @itinerary.start_date).to_i + 1
    # 当日の目的地を取得（time_management含む）
    @destinations = @itinerary.destinations.includes(:time_management).where(visit_date: @visit_date).order(:arrival_order)
    # 出発地情報（2日目以降は当日最初の目的地のdepartureを使用）
    if @current_day >= 2 && @destinations.present?
      @departure_name = @destinations.first.departure
    else
      @starting_point = StartingPoint.find_by(itinerary_id: @itinerary.id)
      @departure_name = @starting_point&.starting_point
    end
    # 目的地の駅情報を取得（出発地も含む）
    all_station_names = @destinations.pluck(:destination)
    all_station_names << @departure_name if @departure_name.present?
    @station_data = Station.includes(:closed_days, :business_hours, :stamp_available_hours).where(name: all_station_names.uniq)
    @departure_station = @station_data.find { |s| s.name == @departure_name }
  end

  private

  def itinerary_params
    params.require(:itinerary).permit(:title, :start_date, :end_date).merge(user_id: current_user.id)
  end

  def set_itinerary
    @itinerary = Itinerary.find(params[:id])
  end
end
