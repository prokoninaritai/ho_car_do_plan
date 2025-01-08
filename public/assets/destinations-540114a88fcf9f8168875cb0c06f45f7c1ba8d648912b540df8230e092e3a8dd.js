function initMap() {
  const map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 41.92591, lng: 140.65724},
    zoom: 9,
  });

    // 駅データを取得
    const stationsElement = document.getElementById("stations-data");
    const stations = JSON.parse(stationsElement.dataset.stations);

    //取得した駅データを元にマーカーを表示する
    const markers = [];
    stations.forEach((station) => {
      const marker = new google.maps.Marker({
        position: { lat: parseFloat(station.latitude), lng: parseFloat(station.longitude) },
        title: station.name,
        map: map,
      });
      markers.push(marker);

      // マーカークリック時に駅名を出発地に設定
      google.maps.event.addListener(marker, "click", () => {
        document.getElementById("departure").value = marker.getTitle();
      });
    });

    // 出発地選択方法を切り替える
    document.getElementById("departure-method").addEventListener("change", (e) => {
      document.getElementById("marker-selection").style.display = "none";
      document.getElementById("current-location").style.display = "none";
      document.getElementById("manual-address").style.display = "none";

      const selectedMethod = e.target.value;
      if (selectedMethod === "marker") {
        document.getElementById("marker-selection").style.display = "block";
      } else if (selectedMethod === "current") {
        document.getElementById("current-location").style.display = "block";
      } else if (selectedMethod === "manual") {
        document.getElementById("manual-address").style.display = "block";
      }
    });

    // 現在地を設定する
    document.getElementById("set-current-location").addEventListener("click", () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          const geocoder = new google.maps.Geocoder();
          const latlng = { lat: parseFloat(lat), lng: parseFloat(lng) };

          geocoder.geocode({ location: latlng }, (results, status) => {
            if (status === "OK" && results[0]) {
              document.getElementById("departure").value = results[0].formatted_address;
            } else {
              alert("現在地を取得できませんでした");
            }
          });
        });
      } else {
        alert("このブラウザでは現在地取得がサポートされていません");
      }
    });
  }

  // 地図を初期化
  if (typeof google !== "undefined" && typeof google.maps !== "undefined") {
    initMap();
  };
