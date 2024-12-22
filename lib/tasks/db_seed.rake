namespace :db do
  desc "Run seeds.rb in production"
  task seed_production: :environment do
    RAILS_ENV=production
    load Rails.root.join('db/seeds.rb')
  end
end