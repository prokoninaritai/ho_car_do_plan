class ItinerariesController < ApplicationController
  def create
    @itinerary = Itinerary.new(itinerary_params)

    if @itinerary.save
      # 登録成功時にdestinations#newへリダイレクト
      redirect_to new_itinerary_destination_path(@itinerary), notice: "日程が登録されました！"
    else
      # 登録失敗時にエラーメッセージ付きでフォームを再表示
      render :_new, status: :unprocessable_entity
    end
  end

  private

  def itinerary_params
    params.require(:itinerary).permit(:title, :start_date, :end_date).merge(user_id: current_user.id)
  end
end