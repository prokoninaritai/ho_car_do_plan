# stations テーブル
stations_data = [
  { name: "三笠", address: "三笠市岡山1056番地1", latitude: 35.2851844, longitude: 139.6743413 },
  { name: "スタープラザ 芦別", address: "芦別市北4条東1丁目1番地", latitude: 43.52516805, longitude: 142.1893597 },
  { name: "南ふらの", address: "空知郡南富良野町字幾寅687番地", latitude: 43.16925865, longitude: 142.5727102 },
  { name: "しらぬか恋問", address: "白糠郡白糠町恋問3丁目3番地1", latitude: 42.9927264, longitude: 144.1982765 },
  { name: "びふか", address: "中川郡美深町字大手307番地1", latitude: 44.4713603, longitude: 142.3715808 },
  { name: "江差", address: "檜山郡江差町字尾山町1番地", latitude: 34.5067399, longitude: 136.7927058 },
  { name: "望羊中山", address: "虻田郡喜茂別町字川上345番地", latitude: 42.85584665, longitude: 141.0968284 },
  { name: "えんべつ富士見", address: "天塩郡遠別町富士見46-21", latitude: 44.71425005, longitude: 141.7926454 },
  { name: "忠類", address: "中川郡幕別町忠類白銀町384番地12", latitude: 43.7220226, longitude: 145.0896705 }
]

stations_data.each do |station|
  Station.upsert(
    { name: station[:name], address: station[:address], latitude: station[:latitude], longitude: station[:longitude] },
    unique_by: :name # name を基準に重複チェック
  )
end


