document.addEventListener('DOMContentLoaded', () => {
  const saveButton = document.getElementById('save-route-btn');
  if (saveButton) {
    saveButton.addEventListener('click', function(e) {
      e.preventDefault();
      saveRoute();
    });
  }
});

// 逆順をグローバルに公開（starting_points.js から呼ぶ）
window.reverseRoute = function() {
  routeMarkers.reverse();
  updateMarkerLabels();
  drawAllRoutes();
  routeInfoCache = {};
  updateRouteList();
};

// --- 変数の宣言 ---
let currentOrder = 1; // 現在の順番をトラッキング
let routeMarkers = []; // 経路に含まれるマーカー
let routeRenderers = []; // 各経路を描画する DirectionsRenderer を保存
const markers = []; // すべてのマーカーを格納
const labeledMarkers = new Map(); // ラベルを設定したマーカーを追跡
const itineraryElement = document.getElementById('itinerary-data');
if (itineraryElement) {
  const itineraryId = itineraryElement.dataset.itineraryId;
}
window.selectRouteMarker = selectRouteMarker;


function selectRouteMarker(marker) {
  console.log("Route renderers after redraw:", routeRenderers);
  const clickedIndex = routeMarkers.indexOf(marker);

  if (clickedIndex > -1) {
    routeMarkers.splice(clickedIndex, 1); // マーカーをリストから削除
    marker.setLabel(null); // ラベルをクリア
    updateMarkerLabels(); // 順番を更新

    console.log("Before deletion:", routeRenderers);

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

    console.log("After deletion:", routeRenderers);
  } else {
    routeMarkers.push(marker);
    updateMarkerLabels();
  }

  drawAllRoutes(); // 残りの経路を再描画
  updateRouteList(); // 行先一覧を更新

  console.log("Route renderers after redraw:", routeRenderers);
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
    console.log(`Removing renderer at index: ${index}`);
    routeRenderers[index].setMap(null);
    routeRenderers.splice(index, 1);
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

function drawAllRoutes() {
  console.log("Redrawing all routes...");

  // 既存の経路を削除
  routeRenderers.forEach(renderer => renderer.setMap(null));
  routeRenderers = []; // 配列をリセット

  // 出発地から最初の目的地までの経路を描画
  if (routeMarkers.length > 0 && window.startPoint) {
    drawRoute(
      new google.maps.LatLng(window.startPoint.lat, window.startPoint.lng),
      routeMarkers[0].getPosition()
    );
  }

  // 目的地間の経路を描画
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

// --- 行先一覧の表示 ---
let routeInfoCache = {}; // 区間ごとの距離・時間キャッシュ

function updateRouteList() {
  const listContainer = document.getElementById('route-list');
  if (!listContainer) return;

  if (routeMarkers.length === 0) {
    listContainer.innerHTML = '';
    routeInfoCache = {};
    return;
  }

  let html = '';
  routeMarkers.forEach(function(marker, index) {
    html += '<div class="route-item" draggable="true" data-index="' + index + '">';
    html += '  <span class="drag-handle">≡</span>';
    html += '  <div class="route-item-content">';
    html += '    <span class="route-item-number">' + (index + 1) + '</span>';
    html += '    <span class="route-item-name">' + marker.getTitle() + '</span>';
    html += '    <span class="route-item-info" id="route-info-' + index + '"></span>';
    html += '  </div>';
    html += '  <button type="button" class="route-item-delete" data-index="' + index + '">×</button>';
    html += '</div>';
  });

  listContainer.innerHTML = html;

  // 削除ボタンのイベント
  listContainer.querySelectorAll('.route-item-delete').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var idx = parseInt(this.dataset.index);
      var marker = routeMarkers[idx];
      if (marker) {
        selectRouteMarker(marker); // 既存の削除ロジックを再利用
      }
    });
  });

  // ドラッグ&ドロップのイベント
  setupDragAndDrop(listContainer);

  // 距離・時間情報を取得
  fetchRouteInfo();
}

function fetchRouteInfo() {
  if (!window.directionsService || routeMarkers.length === 0) return;

  var directionsService = window.directionsService;

  // 出発地 → 1番目
  if (window.startPoint && routeMarkers.length > 0) {
    fetchSegmentInfo(
      directionsService,
      new google.maps.LatLng(window.startPoint.lat, window.startPoint.lng),
      routeMarkers[0].getPosition(),
      0
    );
  }

  // i番目 → i+1番目
  for (var i = 0; i < routeMarkers.length - 1; i++) {
    fetchSegmentInfo(
      directionsService,
      routeMarkers[i].getPosition(),
      routeMarkers[i + 1].getPosition(),
      i + 1
    );
  }
}

function fetchSegmentInfo(directionsService, origin, destination, displayIndex) {
  var cacheKey = origin.lat().toFixed(5) + ',' + origin.lng().toFixed(5) + '->' +
                 destination.lat().toFixed(5) + ',' + destination.lng().toFixed(5);

  if (routeInfoCache[cacheKey]) {
    showRouteInfo(displayIndex, routeInfoCache[cacheKey]);
    return;
  }

  var request = {
    origin: origin,
    destination: destination,
    travelMode: 'DRIVING'
  };

  directionsService.route(request, function(result, status) {
    if (status === 'OK') {
      var leg = result.routes[0].legs[0];
      var info = {
        distance: leg.distance.text,
        duration: leg.duration.text
      };
      routeInfoCache[cacheKey] = info;
      showRouteInfo(displayIndex, info);
    }
  });
}

function showRouteInfo(index, info) {
  var el = document.getElementById('route-info-' + index);
  if (el) {
    el.textContent = info.distance + ' / ' + info.duration;
  }
}

// --- ドラッグ&ドロップ ---
var dragSrcIndex = null;

function setupDragAndDrop(container) {
  var items = container.querySelectorAll('.route-item');

  items.forEach(function(item) {
    item.addEventListener('dragstart', function(e) {
      dragSrcIndex = parseInt(this.dataset.index);
      this.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', dragSrcIndex);
    });

    item.addEventListener('dragend', function() {
      this.classList.remove('dragging');
      container.querySelectorAll('.route-item').forEach(function(el) {
        el.classList.remove('drag-over');
      });
    });

    item.addEventListener('dragover', function(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      this.classList.add('drag-over');
    });

    item.addEventListener('dragleave', function() {
      this.classList.remove('drag-over');
    });

    item.addEventListener('drop', function(e) {
      e.preventDefault();
      this.classList.remove('drag-over');
      var dropIndex = parseInt(this.dataset.index);

      if (dragSrcIndex === null || dragSrcIndex === dropIndex) return;

      // routeMarkers 配列を並べ替え
      var moved = routeMarkers.splice(dragSrcIndex, 1)[0];
      routeMarkers.splice(dropIndex, 0, moved);

      // ラベル・経路・リストを更新
      updateMarkerLabels();
      drawAllRoutes();
      routeInfoCache = {}; // キャッシュクリア（順番が変わったので）
      updateRouteList();

      dragSrcIndex = null;
    });
  });
}

// 経路を保存
function saveRoute() {
  if (!window.startPoint) {
    alert('出発地点が設定されていません。');
    return;
  }
  if (routeMarkers.length === 0) {
    alert('目的地を選択してください。');
    return;
  }

  const itineraryElement = document.getElementById('itinerary-data');
  const startDateString = itineraryElement.dataset.startDate; // データ属性から取得
  const startDate = new Date(startDateString); // 開始日を Date オブジェクトに変換
  const currentDay = parseInt(itineraryElement.dataset.currentDay) || 1;
  const currentDate = new Date(startDate);
  currentDate.setDate(startDate.getDate() + (currentDay - 1)); // 現在の日を計算
  const visitDate = currentDate.toISOString().split("T")[0]; // YYYY-MM-DD形式
  const routeData = [];

  // Google Maps Directions Service
  const directionsService = new google.maps.DirectionsService();

  // 移動時間のフォーマット変更
  function formatTravelTime(seconds) {
    const hours = Math.floor(seconds / 3600); // 秒を3600で割って時間を計算
    const minutes = Math.floor((seconds % 3600) / 60); // 残りの秒を60で割って分を計算
    return `${hours}:${minutes.toString().padStart(2, '0')}`; // 時間:分形式で返す
  }

  // 出発地から最初の目的地までの経路
  const promises = [];

  if (routeMarkers.length > 0) {
    const firstMarker = routeMarkers[0];
    const firstRequest = {
      origin: { lat: window.startPoint.lat, lng: window.startPoint.lng },
      destination: firstMarker.getPosition(),
      travelMode: 'DRIVING',
    };

    promises.push(new Promise((resolve, reject) => {
      directionsService.route(firstRequest, (result, status) => {
        if (status === 'OK') {
          const leg = result.routes[0].legs[0];
          routeData.push({
            visit_date: visitDate,
            arrival_order: 1,
            departure: window.startPoint.title,
            departure_latitude: window.startPoint.lat,
            departure_longitude: window.startPoint.lng,
            destination: firstMarker.getTitle(),
            destination_latitude: firstMarker.getPosition().lat(),
            destination_longitude: firstMarker.getPosition().lng(),
            distance: leg.distance.value,
            api_travel_time: formatTravelTime(leg.duration.value), // 秒数を「時間:分」に変換
          });
          resolve();
        } else {
          reject(`Failed to fetch route for first marker: ${status}`);
        }
      });
    }));
  }

  // 残りの経路を順番に追加
  routeMarkers.forEach((marker, index) => {
    if (index < routeMarkers.length - 1) {
      const nextMarker = routeMarkers[index + 1];
      const request = {
        origin: marker.getPosition(),
        destination: nextMarker.getPosition(),
        travelMode: 'DRIVING',
      };

      promises.push(new Promise((resolve, reject) => {
        directionsService.route(request, (result, status) => {
          if (status === 'OK') {
            const leg = result.routes[0].legs[0];
            routeData.push({
              visit_date: visitDate,
              arrival_order: index + 2,
              departure: marker.getTitle(),
              departure_latitude: marker.getPosition().lat(),
              departure_longitude: marker.getPosition().lng(),
              destination: nextMarker.getTitle(),
              destination_latitude: nextMarker.getPosition().lat(),
              destination_longitude: nextMarker.getPosition().lng(),
              distance: leg.distance.value,
              api_travel_time: formatTravelTime(leg.duration.value), // 秒数を「時間:分」に変換
            });
            resolve();
          } else {
            reject(`Failed to fetch route for marker ${index + 1}: ${status}`);
          }
        });
      }));
    }
  });

  // 全てのPromiseが完了したらデータを送信
  Promise.all(promises)
    .then(() => {
      routeData.sort((a, b) => a.arrival_order - b.arrival_order);
      console.log("送信データ:", routeData);
      postRouteData(routeData);
    })
    .catch(error => {
      console.error(error);
    });
}


function addRemainingRoutes(routeData, visitDate, directionsService) {
  routeMarkers.forEach((marker, index) => {
    if (index < routeMarkers.length - 1) {
      const nextMarker = routeMarkers[index + 1];
      const request = {
        origin: marker.getPosition(),
        destination: nextMarker.getPosition(),
        travelMode: 'DRIVING',
      };

      directionsService.route(request, (result, status) => {
        if (status === 'OK') {
          const leg = result.routes[0].legs[0];
          routeData.push({
            visit_date: visitDate,
            arrival_order: index + 2,
            departure: marker.getTitle(),
            departure_latitude: marker.getPosition().lat(),
            departure_longitude: marker.getPosition().lng(),
            destination: nextMarker.getTitle(),
            destination_latitude: nextMarker.getPosition().lat(),
            destination_longitude: nextMarker.getPosition().lng(),
            distance: leg.distance.value,
            api_travel_time: formatTravelTime(leg.duration.value), // 秒数を「時間:分」に変換
          });

          // 全てのルートデータを追加した後に送信
          if (routeData.length === routeMarkers.length) {
            console.log('送信データ:', routeData);
            postRouteData(routeData);
          }
        } else {
          console.error('Google Maps APIから経路を取得できませんでした:', status);
        }
      });
    }
  });
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
    const currentDay = parseInt(document.getElementById('itinerary-data').dataset.currentDay) || 1;
    const nextUrl = `/itineraries/${itineraryId}/day_schedule?current_day=${currentDay}`;
    window.location.href = nextUrl;
  })
  .catch(error => {
    console.error('エラー:', error);
  });
}