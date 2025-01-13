Rails.application.routes.draw do
  devise_for :users
  resources :itineraries, only: [:index, :create, :show] do
    resources :starting_points, only: [:create]
    resources :destinations, only: [:new, :create] 
    member do
      get 'day_schedule'
    end
  end
  
  
  authenticated :user do
    root 'maps#dashboard', as: :authenticated_root
  end

  unauthenticated do
    root 'static_pages#home'
  end

  # Stations data endpoint for JSON
  get 'maps/stations_data', to: 'maps#stations_data'

end
