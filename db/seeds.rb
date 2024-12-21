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

