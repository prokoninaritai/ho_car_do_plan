document.addEventListener("turbo:load", () => {
  if (window.map) { // Google Maps の地図オブジェクトを確認
    initMap(); // 初回のみマップを初期化
  }
});

// --- 変数の宣言 ---
window.startMarker = null;
window.markers = []; // グローバル変数として定義
const itineraryElement = document.getElementById('itinerary-data');
const itineraryId = itineraryElement.dataset.itineraryId;

// マップを初期化
function initMap() {
  window.map = new google.maps.Map(document.getElementById('map2'), {
    center: { lat: 41.92591, lng: 140.65724 },
    zoom: 7,
  });

  // DirectionsServiceとDirectionsRendererをグローバルスコープで初期化
  window.directionsService = new google.maps.DirectionsService();
  window.directionsRenderer = new google.maps.DirectionsRenderer({
    map: window.map,
    preserveViewport: true,
    suppressMarkers: true,
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

    // マーカークリック時の処理を登録
    marker.addListener("click", () => {
      if (window.routeSelectionEnabled) {
        // 経路選択モード
        selectRouteMarker(marker); // 経路選択用の処理
      } else {
        // 出発地点登録モード
        setStartingPoint(marker.getPosition().lat(), marker.getPosition().lng(), marker.getTitle());
      }
    });
  });
}

window.initMap = initMap;


// 現在地を選ぶ
document.getElementById('search-location').addEventListener('click', () => {
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
  if (window.startMarker) window.startMarker.setMap(null); 
  window.startMarker = new google.maps.Marker({
    position: { lat: lat, lng: lng },
    map: window.map,
    label: 'S',
    title: title,
  });

  // グローバル変数に出発地点を保存
  window.startPoint = { lat: lat, lng: lng, title: title };

  console.log("出発地点が設定されました:", window.startPoint); // デバッグ用
}


// 出発地を登録
document.getElementById('register-starting-point').addEventListener('click', () => {
  if (startMarker) {
    const position = startMarker.getPosition();
    const title = startMarker.getTitle(); // マーカーのタイトル（出発地名）
    saveStartingPoint(position.lat(), position.lng(), title);
  } else {
    alert("出発地点を選択してください。");
  }
});

// サーバーに送信する関数
function saveStartingPoint(lat, lng, title) {
  fetch(`/itineraries/${itineraryId}/starting_points`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content,
    },
    body: JSON.stringify({
      starting_point: {
        itinerary_id: itineraryId,
        starting_point: title, // ここで出発地名を送信
        starting_point_latitude: lat,
        starting_point_longitude: lng,
      },
    }),
  })
  .then(response => {
    if (!response.ok) throw new Error("出発地の登録に失敗しました");
    alert("出発地が登録されました！");
    console.log(window.startPoint);

     // 文言を変更する
    const heading = document.querySelector('.starting-point-heading'); 
    if (heading) {
      heading.textContent = '経路を選択する:';
    }

    // 隠したい部分だけ非表示にする
    //document.getElementById('starting-point').style.display = 'none';
    document.getElementById('search-location').style.display = 'none';
    document.getElementById('register-starting-point').style.display = 'none';

    enableRouteSelection(); // 経路選択を有効化
  })
  .catch(error => {
    console.error("エラー:", error);
    alert("出発地の登録に失敗しました。");
  });
}


// 経路選択を有効化
function enableRouteSelection() {
  window.routeSelectionEnabled = true;

  // 出発地マーカー（startMarker）を固定
  if (startMarker) {
    startMarker.setDraggable(false); // マーカーをドラッグ不可にする
    startMarker.setLabel('S'); // ラベルを 'S' に固定
    startMarker.setIcon({
      url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png", // 青色のアイコンに変更（任意）
      scaledSize: new google.maps.Size(50, 50), // サイズ調整（任意）
    });
  } else {
    console.error("出発地のマーカーが見つかりません");
  }
}

// 駅名ラベルを作成
function createStationLabel(map2, marker, name) {
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

  overlay.setMap(map2);
}
