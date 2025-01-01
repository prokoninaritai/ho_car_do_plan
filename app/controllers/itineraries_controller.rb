class ItinerariesController < ApplicationController
  def create
    @itinerary = Itinerary.new(itinerary_params)
    if @itinerary.save
      redirect_to root_path, notice: '旅程が登録されました！'
    else
      Rails.logger.debug "Turbo Stream Response: #{@itinerary.errors.full_messages}"
      respond_to do |format|
        format.turbo_stream
        format.html { render :new, status: :unprocessable_entity }
      end
    end
  end

  private

  def itinerary_params
    params.require(:itinerary).permit(:title, :start_date, :end_date).merge(user_id: current_user.id)
  end
end
