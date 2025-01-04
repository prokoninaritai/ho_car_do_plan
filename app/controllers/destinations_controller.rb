class DestinationsController < ApplicationController
  before_action :set_itinerary, only: [:new, :create]

  def new
    @destination = Destination.new
    @stations = Station.all
    @itinerary = Itinerary.find(params[:itinerary_id])

    # 現在の「何日目」を取得（デフォルトは1日目）
    current_day = params[:current_day].present? ? params[:current_day].to_i : 1
    current_date = @itinerary.start_date + (current_day - 1).days

    @day_number = (current_date - @itinerary.start_date).to_i + 1 # 開始日が1日目
    @display_date = current_date.strftime("%Y年%-m月%-d日")
    @day_label = "#{@day_number}日目"
  end

  def create
    @destination = @itinerary.destinations.build(destination_params)
    if @destination.save
      next_day = params[:current_day].to_i + 1
      if @itinerary.start_date + (next_day - 1).days <= @itinerary.end_date
        redirect_to new_itinerary_destination_path(@itinerary, current_day: next_day), notice: "しおりが作成されました！次の日に進みます。"
      else
        redirect_to itinerary_path(@itinerary), notice: "全てのしおりが完成しました！"
      end
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