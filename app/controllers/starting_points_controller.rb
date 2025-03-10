class StartingPointsController < ApplicationController
  def create
    starting_point = StartingPoint.new(starting_point_params)
    if starting_point.save
      head :ok # 成功した場合にHTTP 200を返す
    else
      render json: { message: '保存失敗', errors: starting_point.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def starting_point_params
    params.require(:starting_point).permit(:itinerary_id, :starting_point, :starting_point_latitude, :starting_point_longitude)
  end
end
