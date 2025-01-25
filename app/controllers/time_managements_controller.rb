class TimeManagementsController < ApplicationController
  def new
    @destination = Destination.find(params[:destination_id])
  end

  def create
    time_managements = params[:time_managements]

    saved_records = []

    time_managements.each do |tm|
      saved_records << TimeManagement.create!(
        destination_id: tm[:destination_id],
        arrival_time: tm[:arrival_time],
        departure_time: tm[:departure_time],
        custom_travel_time: convert_time_to_minutes(tm[:custom_travel_time]),
        stay_duration: convert_time_to_minutes(tm[:stay_duration])
      )
    end

    def convert_time_to_minutes(time_str)
      hours, minutes = time_str.split(':').map(&:to_i)
      hours * 60 + minutes
    end

    render json: { message: 'Time managements saved successfully', saved_records: saved_records }, status: :ok
  rescue StandardError => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  private

  def time_management_params
    params.require(:time_management).permit(:destination_id, :departure_time, :custom_travel_time, :arrival_time, :stay_duration)
  end
end
