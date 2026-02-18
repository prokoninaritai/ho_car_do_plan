class UsersController < ApplicationController
  before_action :authenticate_user!

  def update_home
    if current_user.update(home_params)
      render json: { message: '自宅が保存されました' }, status: :ok
    else
      render json: { error: '保存に失敗しました' }, status: :unprocessable_entity
    end
  end

  private

  def home_params
    params.require(:user).permit(:home_address, :home_latitude, :home_longitude)
  end
end
