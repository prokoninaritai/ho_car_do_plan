# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.0].define(version: 2025_01_12_030447) do
  create_table "business_hours", charset: "utf8mb3", force: :cascade do |t|
    t.integer "station_number", null: false
    t.string "start_date"
    t.string "end_date"
    t.time "opening_time"
    t.time "closing_time"
    t.integer "start_day"
    t.integer "end_day"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "closed_days", charset: "utf8mb3", force: :cascade do |t|
    t.integer "station_number", null: false
    t.string "start_date"
    t.string "end_date"
    t.string "closed_info"
    t.string "remarks"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "destinations", charset: "utf8mb3", force: :cascade do |t|
    t.bigint "itinerary_id", null: false
    t.date "visit_date", null: false
    t.integer "arrival_order", null: false
    t.string "departure", null: false
    t.string "destination", null: false
    t.string "api_travel_time"
    t.decimal "distance", precision: 10, scale: 2
    t.decimal "departure_latitude", precision: 10, scale: 6
    t.decimal "departure_longitude", precision: 10, scale: 6
    t.decimal "destination_latitude", precision: 10, scale: 6
    t.decimal "destination_longitude", precision: 10, scale: 6
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["itinerary_id"], name: "index_destinations_on_itinerary_id"
  end

  create_table "itineraries", charset: "utf8mb3", force: :cascade do |t|
    t.string "title", null: false
    t.date "start_date", null: false
    t.date "end_date", null: false
    t.bigint "user_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_itineraries_on_user_id"
  end

  create_table "stamp_available_hours", charset: "utf8mb3", force: :cascade do |t|
    t.integer "station_number", null: false
    t.string "available_hour", null: false
    t.string "remarks"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "starting_points", charset: "utf8mb3", force: :cascade do |t|
    t.bigint "itinerary_id", null: false
    t.string "starting_point", null: false
    t.decimal "starting_point_latitude", precision: 10, scale: 6, null: false
    t.decimal "starting_point_longitude", precision: 10, scale: 6, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["itinerary_id"], name: "index_starting_points_on_itinerary_id"
  end

  create_table "stations", charset: "utf8mb3", force: :cascade do |t|
    t.string "region", null: false
    t.integer "station_number", null: false
    t.string "name", null: false
    t.string "address", null: false
    t.string "phone", null: false
    t.decimal "latitude", precision: 10, scale: 6
    t.decimal "longitude", precision: 10, scale: 6
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "time_managements", charset: "utf8mb3", force: :cascade do |t|
    t.bigint "destination_id", null: false
    t.string "departure_time", null: false
    t.string "custom_travel_time", null: false
    t.string "arrival_time", null: false
    t.string "stay_duration", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["destination_id"], name: "index_time_managements_on_destination_id"
  end

  create_table "users", charset: "utf8mb3", force: :cascade do |t|
    t.string "nickname", null: false
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  add_foreign_key "destinations", "itineraries"
  add_foreign_key "itineraries", "users"
  add_foreign_key "starting_points", "itineraries"
  add_foreign_key "time_managements", "destinations"
end
