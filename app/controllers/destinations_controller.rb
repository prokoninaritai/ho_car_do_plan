class DestinationsController < ApplicationController
  before_action :set_itinerary, only: [:new, :create]

  def new
    @destination = Destination.new
    @stations = Station.all
    @itinerary = Itinerary.find(params[:itinerary_id])
    @start_date = @itinerary.start_date

    # 現在の「何日目」を取得（デフォルトは1日目）
    @current_day = params[:current_day].present? ? params[:current_day].to_i : 1
    current_date = @itinerary.start_date + (@current_day - 1).days

    @day_number = (current_date - @itinerary.start_date).to_i + 1 # 開始日が1日目
    @display_date = current_date.strftime('%Y年%-m月%-d日')
    @day_label = "#{@day_number}日目"

    # 既存の出発地と当日の目的地を取得（経路選択画面に戻った場合の復元用）
    @existing_starting_point = @itinerary.starting_point
    current_date = @itinerary.start_date + (@current_day - 1).days
    @existing_destinations = @itinerary.destinations
      .where(visit_date: current_date)
      .order(:arrival_order)

    # 2日目以降の場合、前日の最後の目的地を取得
    if @current_day >= 2
      previous_date = @itinerary.start_date + (@current_day - 2).days
      @previous_last_destination = @itinerary.destinations
        .where(visit_date: previous_date)
        .order(arrival_order: :desc)
        .first

      # 過去全日の目的地を取得（日ごとの色分け表示用）
      @previous_destinations = @itinerary.destinations
        .where("visit_date < ?", @itinerary.start_date + (@current_day - 1).days)
        .order(:visit_date, :arrival_order)
        .map do |d|
          day_number = (d.visit_date - @itinerary.start_date).to_i + 1
          {
            name: d.destination,
            lat: d.destination_latitude,
            lng: d.destination_longitude,
            arrival_order: d.arrival_order,
            day: day_number
          }
        end
    end
  end

  def create
    Rails.logger.debug "Received params: #{params.inspect}"

    ActiveRecord::Base.transaction do
      # 同じ日の既存データを削除（経路選択画面から戻って再保存した場合の重複防止）
      visit_date = params[:destinations]&.first&.dig(:visit_date)
      if visit_date.present?
        existing = @itinerary.destinations.where(visit_date: visit_date)
        existing.each { |d| d.time_management&.destroy }
        existing.destroy_all
      end

      params[:destinations].each_with_index do |destination_data, index|
        destination_data[:arrival_order] = index + 1
        Rails.logger.debug "Saving destination with arrival_order: #{destination_data[:arrival_order]}"
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

    # 保存後、1日目のスケジュールページにリダイレクト
    render json: { message: '保存成功', destination_id: @itinerary.destinations.last.id }, status: :ok
  end

  def show
    @itinerary = Itinerary.find(params[:itinerary_id])
    @destinations = @itinerary.destinations.includes(:time_management)
    @day_label = "#{(@itinerary.start_date + (params[:current_day].to_i - 1).days).strftime('%m/%d')}の日程"
  end

  def arrival_time
    return nil if departure_time.nil? || api_travel_time.nil?

    # api_travel_timeを"HH:MM"形式から秒に変換
    travel_seconds = api_travel_time.split(':').map(&:to_i).inject(0) { |a, b| a * 60 + b }
    departure_time + travel_seconds
  end

  def arrival_time
    return nil if departure_time.nil? || api_travel_time.nil?

    # api_travel_timeを"HH:MM"形式から秒に変換
    travel_seconds = api_travel_time.split(':').map(&:to_i).inject(0) { |a, b| a * 60 + b }
    departure_time + travel_seconds
  end

  def arrival_time
    return nil if departure_time.nil? || api_travel_time.nil?

    # api_travel_timeを"HH:MM"形式から秒に変換
    travel_seconds = api_travel_time.split(':').map(&:to_i).inject(0) { |a, b| a * 60 + b }
    departure_time + travel_seconds
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

  def format_time(seconds)
    minutes = seconds / 60
    hours = minutes / 60
    format('%02d:%02d', hours, minutes % 60)
  end
end
