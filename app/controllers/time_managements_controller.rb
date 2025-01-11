class TimeManagementsController < ApplicationController
  def new
    @destination = Destination.find(params[:destination_id])
  end
  
  def create
  end

end
