# Pin npm packages by running ./bin/importmap

pin "application"
pin "@hotwired/turbo-rails", to: "turbo.min.js"
pin "@hotwired/stimulus", to: "stimulus.min.js"
pin "@hotwired/stimulus-loading", to: "stimulus-loading.js"
pin_all_from "app/javascript/controllers", under: "controllers"
pin "dashboard", to: "dashboard.js"
pin "itineraries", to: "itineraries.js"
pin "destinations", to: "destinations.js"
pin "day_schedule", to: "day_schedule.js"
pin "starting_points", to: "starting_points.js"

