require 'csv'

# 空欄をnilにする共通メソッド
def normalize_row(row)
  row.to_h.transform_values { |v| v.presence }
end

# Stationデータの登録・更新
CSV.foreach(Rails.root.join('db/csv/stations.csv'), headers: true) do |row|
  data = normalize_row(row)

  station = Station.find_or_initialize_by(station_number: data['station_number'])

  station.region = data['region']
  station.name = data['name']
  station.address = data['address']
  station.phone = data['phone']
  station.latitude = data['latitude']&.to_f
  station.longitude = data['longitude']&.to_f

  if station.changed?
    station.save!
    puts "Updated station: #{station.station_number}"
  end
end

# ClosedDaysデータの登録・更新
CSV.foreach(Rails.root.join('db/csv/closed_days.csv'), headers: true) do |row|
  data = normalize_row(row)

  closed_day = ClosedDay.find_or_initialize_by(
    station_number: data['station_number'],
    start_date: data['start_date'],
    end_date: data['end_date']
  )

  closed_day.closed_info = data['closed_info']
  closed_day.remarks = data['remarks']

  if closed_day.changed?
    closed_day.save!
    puts "Updated ClosedDay: station_number=#{data['station_number']} start_date=#{data['start_date']} end_date=#{data['end_date']}"
  end
end

# BusinessHoursデータの登録・更新
CSV.foreach(Rails.root.join('db/csv/business_hours.csv'), headers: true) do |row|
  data = normalize_row(row)

  business_hour = BusinessHour.find_or_initialize_by(
    station_number: data['station_number'],
    start_date: data['start_date'],
    end_date: data['end_date'],
    start_day: data['start_day'],
    end_day: data['end_day']
  )

  business_hour.opening_time = data['opening_time']
  business_hour.closing_time = data['closing_time']

  if business_hour.changed?
    business_hour.save!
    puts "Updated BusinessHour: station_number=#{data['station_number']} start_date=#{data['start_date']} end_date=#{data['end_date']}"
  end
end

# StampAvailableHoursデータの登録・更新
CSV.foreach(Rails.root.join('db/csv/stamp_available_hours.csv'), headers: true) do |row|
  data = normalize_row(row)

  stamp_available_hour = StampAvailableHour.find_or_initialize_by(
    station_number: data['station_number']
  )

  stamp_available_hour.available_hour = data['available_hour']
  stamp_available_hour.remarks = data['remarks']

  if stamp_available_hour.changed?
    stamp_available_hour.save!
    puts "Updated StampAvailableHour: station_number=#{data['station_number']}"
  end
end