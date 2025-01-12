// --- 変数の宣言 ---
let startMarker = null;
window.markers = []; // グローバル変数として定義
let currentOrder = 1; 
let routeRenderers = []; 
const itineraryElement = document.getElementById('itinerary-data');
const itineraryId = itineraryElement.dataset.itineraryId; 

// マップを初期化
function initMap() {
  window.map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 41.92591, lng: 140.65724 },
    zoom: 10,
  });

  // 駅データを取得
  const stationsElement = document.getElementById("stations-data");
  const stations = JSON.parse(stationsElement.dataset.stations);

  // マーカーを表示
  stations.forEach((station) => {
    const marker = new google.maps.Marker({
      position: { lat: parseFloat(station.latitude), lng: parseFloat(station.longitude) },
      map: window.map,
      title: station.name,
      icon: {
        url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
        scaledSize: new google.maps.Size(50, 40),
      },
    });

    createStationLabel(window.map, marker, station.name);
    window.markers.push(marker);

    // マーカーのクリックイベントをここで登録
    marker.addListener("click", () => {
      const position = marker.getPosition();
      setStartingPoint(position.lat(), position.lng(), marker.getTitle());
    });
  });
}

window.initMap = initMap;


// 現在地を選ぶ
document.getElementById('choose-current-location').addEventListener('click', () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        setStartingPoint(latitude, longitude, "現在地");
      },
      (error) => alert("現在地を取得できませんでした: " + error.message)
    );
  } else {
    alert("ブラウザが現在地取得をサポートしていません。");
  }
});

// 出発地を設定する
function setStartingPoint(lat, lng, title) {
  if (startMarker) startMarker.setMap(null); 
  startMarker = new google.maps.Marker({
    position: { lat: lat, lng: lng },
    map: window.map,
    label: 'S',
    title: title,
  });
}

// 出発地を登録
document.getElementById('register-starting-point').addEventListener('click', () => {
  if (startMarker) {
    const position = startMarker.getPosition();
    saveStartingPoint(position.lat(), position.lng());
  } else {
    alert("出発地点を選択してください。");
  }
});

// サーバーに出発地点を保存
function saveStartingPoint(lat, lng) {
  fetch(`/itineraries/${itineraryId}/starting_points`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content,
    },
    body: JSON.stringify({
      starting_point: {
        itinerary_id: itineraryId,
        starting_point_latitude: lat,
        starting_point_longitude: lng,
      },
    }),
  })
  .then(response => {
    if (!response.ok) throw new Error("出発地の登録に失敗しました");
    alert("出発地が登録されました！");
    enableRouteSelection(); 
  })
  .catch(error => {
    console.error("エラー:", error);
    alert("出発地の登録に失敗しました。");
  });
}

// 経路選択を有効化
function enableRouteSelection() {
  window.routeSelectionEnabled = true;
}



// 駅名ラベルを作成
function createStationLabel(map, marker, name) {
  const labelDiv = document.createElement("div");
  labelDiv.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
  labelDiv.style.border = "1px solid #ccc";
  labelDiv.style.borderRadius = "4px";
  labelDiv.style.padding = "5px";
  labelDiv.style.fontSize = "12px";
  labelDiv.style.textAlign = "center";
  labelDiv.innerText = name;

  const overlay = new google.maps.OverlayView();
  overlay.onAdd = function () {
    const panes = this.getPanes();
    panes.overlayLayer.appendChild(labelDiv);
  };

  overlay.draw = function () {
    const projection = this.getProjection();
    const position = projection.fromLatLngToDivPixel(marker.getPosition());
    labelDiv.style.position = "absolute";
    labelDiv.style.left = position.x - labelDiv.offsetWidth / 2 + "px";
    labelDiv.style.top = position.y + 10 + "px";
  };

  overlay.setMap(map);
}