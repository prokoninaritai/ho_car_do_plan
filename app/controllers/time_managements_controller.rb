class TimeManagementsController < ApplicationController
  def new
    @destination = Destination.find(params[:destination_id])
  end

  def create
    time_managements = params.require(:timeManagements)

    time_managements.each do |tm_params|
      time_management = TimeManagement.new(tm_params.permit(:destination_id, :departure_time, :custom_travel_time, :arrival_time, :stay_duration))

      if time_management.save
        Rails.logger.info "TimeManagement saved: #{time_management.inspect}"
      else
        Rails.logger.error " TimeManagement save failed: #{time_management.errors.full_messages}"
      end
    end

    render json: { message: "保存成功！" }, status: :ok
  end

  private

  def time_management_params
    params.require(:time_management).permit(:destination_id, :departure_time, :custom_travel_time, :arrival_time, :stay_duration)
  end
end
