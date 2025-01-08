class DestinationsController < ApplicationController
  before_action :set_itinerary, only: [:new, :create]

  def new
    @destination = Destination.new
    @stations = Station.all

    # 現在の「何日目」を取得（デフォルトは1日目）
    current_day = params[:current_day].present? ? params[:current_day].to_i : 1
    current_date = @itinerary.start_date + (current_day - 1).days

    @day_number = (current_date - @itinerary.start_date).to_i + 1 # 開始日が1日目
    @display_date = current_date.strftime("%Y年%-m月%-d日")
    @day_label = "#{@day_number}日目"
  end

  def create
    Rails.logger.debug "Received params: #{params.inspect}"

    ActiveRecord::Base.transaction do
      params[:destinations].each do |destination_data|
        next if destination_data[:destination].nil? # destination が nil の場合はスキップ  
        @itinerary.destinations.create!(destination_data.permit(
          :visit_date,
          :arrival_order, 
          :departure, 
          :departure_latitude, 
          :departure_longitude, 
          :destination, 
          :destination_latitude, 
          :destination_longitude, 
          :distance, 
          :api_travel_time
        ))
      end
    end

    render json: { message: '保存成功' }, status: :ok
  rescue => e
    Rails.logger.error "保存エラー: #{e.message}"
    render json: { message: '保存失敗', error: e.message }, status: :unprocessable_entity
  end

  private

  def set_itinerary
    @itinerary = Itinerary.find(params[:itinerary_id])
  end

  def destination_params
    params.require(:destinations).map do |destination|
      destination.permit(:arrival_order, :latitude, :longitude, :departure, :destination)
    end
  end
end