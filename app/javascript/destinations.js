document.addEventListener('DOMContentLoaded', () => {
  const saveButton = document.getElementById('save-route-btn');
  if (saveButton) {
    saveButton.addEventListener('click', saveRoute);
  } else {
    console.error('save-route-btn 要素が見つかりませんでした。');
  }
});

// --- 変数の宣言 ---
let currentOrder = 1; // 現在の順番をトラッキング
let routeMarkers = []; // 経路に含まれるマーカー
let routeRenderers = []; // 各経路を描画する DirectionsRenderer を保存
const markers = []; // すべてのマーカーを格納
const labeledMarkers = new Map(); // ラベルを設定したマーカーを追跡
const itineraryElement = document.getElementById('itinerary-data');
const itineraryId = itineraryElement.dataset.itineraryId; // しおりのIDを取得 
window.selectRouteMarker = selectRouteMarker;

function selectRouteMarker(marker) {
  const clickedIndex = routeMarkers.indexOf(marker);

  if (clickedIndex > -1) {
    routeMarkers.splice(clickedIndex, 1); // マーカーをリストから削除
    marker.setLabel(null); // ラベルをクリア
    updateMarkerLabels(); // 順番を更新

    // 関連する経路を削除
    if (clickedIndex < routeRenderers.length) {
      console.log("Removing renderer at index:", clickedIndex);
      routeRenderers[clickedIndex].setMap(null);
      routeRenderers.splice(clickedIndex, 1);
    }

    if (clickedIndex > 0 && clickedIndex - 1 < routeRenderers.length) {
      console.log("Removing previous renderer at index:", clickedIndex - 1);
      routeRenderers[clickedIndex - 1].setMap(null);
      routeRenderers.splice(clickedIndex - 1, 1);
    }
  } else {
    routeMarkers.push(marker);
    updateMarkerLabels();
  }

  drawAllRoutes(); // 残りの経路を再描画
}

window.selectRouteMarker = selectRouteMarker;

// --- マーカーの再ラベル付け ---
function updateRoutes() {
  console.log("Updating routes...");
  
  // すべての既存経路をクリア
  routeRenderers.forEach(renderer => renderer.setMap(null));
  routeRenderers = []; // 配列をリセット

  // 出発地点から最初の目的地までの経路を描画
  if (routeMarkers.length > 0 && window.startPoint) {
    drawRoute(
      new google.maps.LatLng(window.startPoint.lat, window.startPoint.lng),
      routeMarkers[0].getPosition()
    );
  }

  // 目的地間の経路を順番に描画
  for (let i = 0; i < routeMarkers.length - 1; i++) {
    drawRoute(routeMarkers[i].getPosition(), routeMarkers[i + 1].getPosition());
  }
}

function clearRouteRenderer(index) {
  if (routeRenderers[index]) {
    routeRenderers[index].setMap(null); // 地図から経路を削除
    routeRenderers.splice(index, 1); // 配列から削除
  }
}

function handleMarkerClick(marker) {
  console.log(`Marker clicked: ${marker.getTitle()}`);
  // 必要に応じて追加処理を実装
}

window.handleMarkerClick = handleMarkerClick; // グローバルスコープに公開

// --- マーカーの再ラベル付け ---
function updateMarkerLabels() {
  routeMarkers.forEach((marker, index) => {
    marker.setLabel((index + 1).toString()); // 順番にラベルを付け直す
  });
}

// --- すべての経路を描画 ---
function drawAllRoutes() {
  console.log("Redrawing all routes...");

  // 既存の経路をすべて削除
  routeRenderers.forEach(renderer => renderer.setMap(null));
  routeRenderers = []; // 配列をリセット

  // 新しい経路を描画
  if (routeMarkers.length > 0 && window.startPoint) {
    drawRoute(
      new google.maps.LatLng(window.startPoint.lat, window.startPoint.lng),
      routeMarkers[0].getPosition()
    );
  }

  for (let i = 0; i < routeMarkers.length - 1; i++) {
    drawRoute(routeMarkers[i].getPosition(), routeMarkers[i + 1].getPosition());
  }

  console.log("Current routeRenderers after redraw:", routeRenderers);
}

// --- 経路を描画する関数 ---
function drawRoute(startPosition, endPosition) {
  console.log('Drawing route from', startPosition, 'to', endPosition);
  
  const request = {
    origin: startPosition,
    destination: endPosition,
    travelMode: 'DRIVING', // 車での移動
  };

  window.directionsService.route(request, (result, status) => {
    if (status === 'OK') {
      const renderer = new google.maps.DirectionsRenderer({
        map: directionsRenderer.getMap(),
        suppressMarkers: true, // デフォルトマーカーを非表示
        preserveViewport: true, // ビューポートを変更しない
      });
      renderer.setDirections(result); // 新しい経路を描画
      routeRenderers.push(renderer); // 経路を保存
      console.log("Added renderer to routeRenderers:", renderer);
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

function saveRoute() {
  const currentDay = 1; // 例: デフォルトで1日目を設定
  const routeData = [];
  for (let i = 0; i < routeMarkers.length - 1; i++) {
    const startMarker = routeMarkers[i];
    const endMarker = routeMarkers[i + 1];

    const startDate = new Date("2025-01-11"); // 旅程開始日
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + (currentDay - 1));
    const visitDate = currentDate.toISOString().split("T")[0]; // YYYY-MM-DD形式
    
    // Google Maps API から距離と移動時間を取得
    const request = {
      origin: startMarker.getPosition(),
      destination: endMarker.getPosition(),
      travelMode: 'DRIVING',
    };

    directionsService.route(request, (result, status) => {
      if (status === 'OK') {
        const leg = result.routes[0].legs[0];

        // データを整理して格納
        routeData.push({
          visit_date: visitDate, 
          arrival_order: i + 1,
          departure: startMarker.getTitle(),
          departure_latitude: startMarker.getPosition().lat(),
          departure_longitude: startMarker.getPosition().lng(),
          destination: endMarker.getTitle(),
          destination_latitude: endMarker.getPosition().lat(),
          destination_longitude: endMarker.getPosition().lng(),
          distance: leg.distance.value, // 距離（メートル単位）
          api_travel_time: leg.duration.value, // 移動時間（秒単位）
        });

         // 最後のマーカーに対するデータを追加
         if (i === routeMarkers.length - 2) {
          routeData.push({
            visit_date: visitDate,
            arrival_order: i + 2,
            departure: endMarker.getTitle(),
            departure_latitude: endMarker.getPosition().lat(),
            departure_longitude: endMarker.getPosition().lng(),
            destination: null,
            destination_latitude: null,
            destination_longitude: null,
            distance: null,
            api_travel_time: null,
          });
        }

        // 最後のマーカーまで処理したら保存を送信
        if (i === routeMarkers.length - 2) {
          console.log("送信データ:", routeData);
          postRouteData(routeData);
        }
      } else {
        console.error("Google Maps API から経路を取得できませんでした:", status);
      }
    });
  }
}

// サーバーにデータを送信
function postRouteData(data) {
  fetch(`/itineraries/${itineraryId}/destinations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content,
    },
    body: JSON.stringify({ destinations: data }),
  })
  .then(response => {
    if (response.ok) {
      return response.json();
    } else {
      throw new Error('保存に失敗しました');
    }
  })
  .then(data => {
    console.log('保存成功:', data);
    // 必要なら次のページにリダイレクト
  })
  .catch(error => {
    console.error('エラー:', error);
  });
}