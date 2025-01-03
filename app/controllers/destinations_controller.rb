class DestinationsController < ApplicationController
  before_action :set_itinerary, only: [:new, :create]

  def new
    @destination = Destination.new
    @stations = Station.all
  end

  def create
    @destination = @itinerary.destinations.build(destination_params)
    if @destination.save
      redirect_to itinerary_path(@itinerary), notice: "目的地が登録されました！"
    else
      @stations = Station.all
      render :new, status: :unprocessable_entity
    end
  end

  private

  def set_itinerary
    @itinerary = Itinerary.find(params[:itinerary_id])
  end

  def destination_params
    params.require(:destination).permit(:departure, :manual_address, :visit_date)
  end
end