// --- 変数の宣言 ---
let currentOrder = 1; // 現在の順番をトラッキング
let routeMarkers = []; // 経路に含まれるマーカー
let routeRenderers = []; // 各経路を描画する DirectionsRenderer を保存
let directionsService, directionsRenderer;
const markers = []; // すべてのマーカーを格納
const labeledMarkers = new Map(); // ラベルを設定したマーカーを追跡

// --- ページロード時に地図を初期化 ---
document.addEventListener('turbo:load', () => {
  if (typeof google !== "undefined" && typeof google.maps !== "undefined") {
    initMap();
  }
});

// --- 地図を初期化 ---
function initMap() {
  const map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 41.92591, lng: 140.65724 },
    zoom: 10,
  });

  // DirectionsRendererを初期化し、preserveViewportを設定
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({
    map: map,
    preserveViewport: true, // ズームを変更しないようにする
    suppressMarkers: true, // デフォルトマーカーを非表示にする
  });

  // 駅データを取得
  const stationsElement = document.getElementById("stations-data");
  const stations = JSON.parse(stationsElement.dataset.stations);

  //取得したデータを元にマーカーを表示
  stations.forEach((station) => {
    const marker = new google.maps.Marker({
      position: { lat: parseFloat(station.latitude), lng: parseFloat(station.longitude) },
      map: map,
      icon: {
        url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png", // デフォルトのマーカーURL
        scaledSize: new google.maps.Size(60, 60), // サイズを指定
      },
    });

    // 駅名のオーバーレイを作成
    createStationLabel(map, marker, station.name);

    markers.push(marker);

    // マーカーのクリックイベント
    marker.addListener("click", () => handleMarkerClick(marker));
  });
}

// --- 駅名ラベルを作成 ---
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

// --- マーカークリック時の処理 ---
function handleMarkerClick(marker) {
  const clickedIndex = routeMarkers.indexOf(marker);

  if (clickedIndex > -1) {
    // 既に設定済みのマーカーをクリックした場合（取り消し）
    routeMarkers.splice(clickedIndex, 1); // マーカーをリストから削除
    marker.setLabel(null); // マーカーのラベルをリセット
    updateMarkerLabels(); // 順番を詰める
    
    // 対応する経路を削除
    if (clickedIndex > 0) {
      routeRenderers[clickedIndex - 1].setMap(null); // 経路を削除
      routeRenderers.splice(clickedIndex - 1, 1); // 経路を配列から削除
    }

    if (clickedIndex < routeRenderers.length) {
      routeRenderers[clickedIndex].setMap(null); // 経路を削除
      routeRenderers.splice(clickedIndex, 1); // 経路を配列から削除
    }
    drawAllRoutes(); // 経路の再描画
    
  } else {
    // 新しいマーカーをクリックした場合
    routeMarkers.push(marker); // マーカーを追加
    updateMarkerLabels(); // 順番を更新
    currentOrder++; // 次の順番へ
    drawAllRoutes(); // 経路を再描画
  }
}

// --- マーカーの再ラベル付け ---
function updateMarkerLabels() {
  routeMarkers.forEach((marker, index) => {
    marker.setLabel((index + 1).toString()); // 順番にラベルを付け直す
  });
}

// --- すべての経路を描画 ---
function drawAllRoutes() {
  // 現在の経路描画をクリア
  routeRenderers.forEach(renderer => renderer.setMap(null));
  routeRenderers = []; // 配列をリセット

  // 経路を順番に描画
  for (let i = 0; i < routeMarkers.length - 1; i++) {
    drawRoute(routeMarkers[i].getPosition(), routeMarkers[i + 1].getPosition());
  }
}

// --- 経路を描画する関数 ---
function drawRoute(startPosition, endPosition) {
  const request = {
    origin: startPosition,
    destination: endPosition,
    travelMode: 'DRIVING', // 車での移動
  };

  directionsService.route(request, (result, status) => {
    if (status === 'OK') {
      const renderer = new google.maps.DirectionsRenderer({
        map: directionsRenderer.getMap(),
        suppressMarkers: true, // デフォルトマーカーを非表示
        preserveViewport: true, // ビューポートを変更しない
      });
      renderer.setDirections(result); // 新しい経路を描画
      routeRenderers.push(renderer); // 経路を保存
    } else {
      console.error('経路を取得できませんでした:', status);
    }
  });
}

// --- 経路を完全にリセット ---
function clearRoutes() {
  directionsRenderer.setDirections({}); // 既存の経路をクリア
}

// --- マーカーと経路をリセット ---
function resetMarkers() {
  routeMarkers.forEach(marker => marker.setLabel(null)); // ラベルをクリア
  routeMarkers = []; // ルートマーカーをクリア
  currentOrder = 1; // 順番をリセット
  clearRoutes(); // 経路をリセット
}

