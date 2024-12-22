function initMap() {
  // 地図のオプション
  const mapOptions = {
    center: {lat: 41.92591, lng: 140.65724 }, // なないろ・ななえ
    zoom: 9
  };

  // 地図のインスタンスを生成
  const map = new google.maps.Map(document.getElementById('map'),mapOptions);

  // Railsのエンドポイントからstationsデータを取得
  fetch("/maps/stations_data")
    .then((response) => response.json())
    .then((stations) => {
      // 各stationに対してマーカーを作成
      stations.forEach((station) => {
        const marker = new google.maps.Marker({
          position: { lat: parseFloat(station.latitude), lng: parseFloat(station.longitude) },
          map: map,
          title: station.name, // 駅名を表示
        });
      // InfoWindowを作成
      const infoWindow = new google.maps.InfoWindow({
      content: `<strong>${station.name}</strong>`, // 道の駅名を表示
      });

      // マーカーがクリックされたときにInfoWindowを開く
      marker.addListener("click", () => {
        infoWindow.open(map, marker);
      });
    });
  })
  .catch((error) => 
    console.error("Error fetching stations data:", error));
}

window.initMap = initMap;