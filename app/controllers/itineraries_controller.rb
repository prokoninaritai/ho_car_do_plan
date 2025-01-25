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

  def day_schedule
    current_day = params[:current_day].to_i
    @visit_date = @itinerary.start_date + (current_day - 1).days
    # 当日の目的地を取得
    @destinations = @itinerary.destinations.order(:arrival_order)
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
