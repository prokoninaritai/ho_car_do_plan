class ItinerariesController < ApplicationController
  def new
    @itinerary = Itinerary.new
  end

  def create
    @itinerary = Itinerary.new(itinerary_params)
    if @itinerary.save
      render json: { message: "旅程が登録されました！" }, status: :created
    else
      render json: { errors: @itinerary.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def itinerary_params
    params.require(:itinerary).permit(:title, :start_date, :end_date).merge(user_id: current_user.id)
  end

end
