require 'net/http'
require 'uri'
require 'json'

# Nominatim APIを使って住所や施設名から緯度・経度を取得
def get_lat_lng(address)
  base_url = "https://nominatim.openstreetmap.org/search"
  params = {
    q: address, # 検索クエリ（住所や施設名）
    format: "json", # 結果のフォーマットをJSONで指定
    addressdetails: 1, # 住所の詳細も含む
    limit: 1, # 結果を1件に限定
    countrycodes: "jp" # 日本国内を限定
  }

  uri = URI("#{base_url}?#{URI.encode_www_form(params)}")
  response = Net::HTTP.get_response(uri)
  json = JSON.parse(response.body)

  if json.any?
    location = json[0]
    return location["lat"], location["lon"]
  else
    puts "Error: No results found for '#{address}'"
    return nil, nil
  end
end

# 入力を促す
puts "道の駅の名前または住所を入力してください（終了するにはexitを入力）:"
while true
  print "> "
  input = gets.chomp
  break if input.downcase == "exit" # "exit"で終了

  # 緯度・経度を取得
  lat, lng = get_lat_lng(input)
  if lat && lng
    puts "住所: #{input}"
    puts "緯度: #{lat}"
    puts "経度: #{lng}"
  else
    puts "緯度・経度が取得できませんでした。"
  end
end

puts "終了しました。"