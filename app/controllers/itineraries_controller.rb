class ItinerariesController < ApplicationController
  def create
    @itinerary = Itinerary.new(itinerary_params)

    if @itinerary.save
      render json: { success: true, itinerary_id: @itinerary.id }
    else
      render json: { success: false, errors: @itinerary.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def itinerary_params
    params.require(:itinerary).permit(:title, :start_date, :end_date).merge(user_id: current_user.id)
  end
end