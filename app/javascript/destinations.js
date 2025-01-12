document.addEventListener('turbo:load', () => {
  const routeMarkers = [];
  const directionsService = new google.maps.DirectionsService();
  const directionsRenderer = new google.maps.DirectionsRenderer({
    map: window.map, // starting_points.js で初期化されたマップを使用
    preserveViewport: true,
    suppressMarkers: true,
  });

  // 経路選択のロジック
  window.markers.forEach((marker) => {
    marker.addListener("click", () => handleMarkerClick(marker));
  });

  function handleMarkerClick(marker) {
    if (routeMarkers.includes(marker)) {
      // マーカー削除
      routeMarkers.splice(routeMarkers.indexOf(marker), 1);
      marker.setLabel(null);
    } else {
      // 新しいマーカー追加
      routeMarkers.push(marker);
      marker.setLabel((routeMarkers.length).toString());
    }
    updateRoutes();
  }

  function updateRoutes() {
    directionsRenderer.setDirections({}); // 既存ルートをクリア
    for (let i = 0; i < routeMarkers.length - 1; i++) {
      drawRoute(routeMarkers[i].getPosition(), routeMarkers[i + 1].getPosition());
    }
  }

  function drawRoute(start, end) {
    directionsService.route(
      {
        origin: start,
        destination: end,
        travelMode: "DRIVING",
      },
      (result, status) => {
        if (status === "OK") {
          directionsRenderer.setDirections(result);
        } else {
          console.error("経路描画に失敗しました:", status);
        }
      }
    );
  }
});




  // DirectionsRendererを初期化し、preserveViewportを設定
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({
    map: map,
    preserveViewport: true, // ズームを変更しないようにする
    suppressMarkers: true, // デフォルトマーカーを非表示にする
  });

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
    const nextUrl = `/itineraries/${itineraryId}/day_schedule?current_day=1`;
    window.location.href = nextUrl;
  })
  
  .catch(error => {
    console.error('エラー:', error);
    alert('データの保存中にエラーが発生しました。もう一度お試しください。');
  });
}