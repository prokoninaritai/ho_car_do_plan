function initMap() {
  // 地図のオプション
  const mapOptions = {
    center: {lat: 43.24662, lng: 141.80439 }, // 三笠
    zoom: 10
  };

  // 地図のインスタンスを生成
  const map = new google.maps.Map(document.getElementById('map'),mapOptions);

  // Railsのエンドポイントからstationsデータを取得
  fetch("/maps/stations_data")
    .then((response) => response.json())
    .then((stations) => {
      // 各stationに対してマーカーを作成
      stations.forEach((station) => {
        new google.maps.Marker({
          position: { lat: parseFloat(station.latitude), lng: parseFloat(station.longitude) },
          map: map,
          title: station.name, // 駅名を表示
        });
      });
    })
    .catch((error) => console.error("Error fetching stations data:", error));
}

window.initMap = initMap;