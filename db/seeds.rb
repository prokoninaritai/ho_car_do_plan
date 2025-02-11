require 'csv'

# Stationデータの登録
CSV.foreach(Rails.root.join('db/csv/stations.csv'), headers: true) do |row|
  Station.find_or_create_by!(
    station_number: row['station_number'] # 一意性を確認
  ) do |station|
    station.region = row['region']
    station.name = row['name']
    station.address = row['address']
    station.phone = row['phone']
    station.latitude = row['latitude']
    station.longitude = row['longitude']
  end
end

# ClosedDays データの登録
CSV.foreach(Rails.root.join('db/csv/closed_days.csv'), headers: true) do |row|
  ClosedDay.find_or_create_by!(
    station_id: row['station_id'],
    start_date: row['start_date'], 
    end_date: row['end_date']      
  ) do |closed_day|
    closed_day.closed_info = row['closed_info']
    closed_day.remarks = row['remarks']
  end
end

# business_hours データの登録
CSV.foreach(Rails.root.join('db/csv/business_hours.csv'), headers: true) do |row|
  BusinessHour.find_or_create_by!(
    station_id: row['station_id'],
    start_date: row['start_date'], 
    end_date: row['end_date'],      
    start_day: row['start_day'].presence, # 空欄を nil に変換
    end_day: row['end_day'].presence      # 空欄を nil に変換
  ) do |business_hour|
    business_hour.opening_time = row['opening_time']
    business_hour.closing_time = row['closing_time']
  end
end

# stamp_available_hours データの登録
CSV.foreach(Rails.root.join('db/csv/stamp_available_hours.csv'), headers: true) do |row|
  StampAvailableHour.find_or_create_by!(
    station_id: row['station_id'],     
  ) do |stamp_available_hour|
    stamp_available_hour.available_hour = row['available_hour']
    stamp_available_hour.remarks = row['remarks']
  end
end

