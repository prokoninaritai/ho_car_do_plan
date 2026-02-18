document.addEventListener("turbo:load", () => {
  if (typeof initMap === "function") {
    initMap();
  }
  const itineraryElement = document.getElementById('itinerary-data');
  if (itineraryElement) {
    window.itineraryId = itineraryElement.dataset.itineraryId;

    // 既存の出発地がある場合はスキップ（経路選択画面に戻った場合）
    const hasExistingSp = itineraryElement.dataset.existingSpName;
    if (hasExistingSp) return;

    // 2日目以降の場合、前日の最後の目的地を自動でスタート地点にセット
    const prevName = itineraryElement.dataset.prevDestinationName;
    const prevLat = parseFloat(itineraryElement.dataset.prevDestinationLat);
    const prevLng = parseFloat(itineraryElement.dataset.prevDestinationLng);

    if (prevName && !isNaN(prevLat) && !isNaN(prevLng)) {
      const currentDay = parseInt(itineraryElement.dataset.currentDay);
      // マップの読み込みを待ってからセット
      const waitForMap = setInterval(() => {
        if (window.map) {
          clearInterval(waitForMap);
          setStartingPoint(prevLat, prevLng, prevName);
          const msg = `${currentDay - 1}日目の日程を登録しました。${currentDay}日目の経路を登録してください`;
          saveStartingPoint(prevLat, prevLng, prevName, msg);
        }
      }, 200);
    }
  }
});

// --- 変数の宣言 ---
window.startMarker = null;
window.markers = []; // グローバル変数として定義

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

  // 過去日の目的地を色分けピンで表示
  const itineraryEl = document.getElementById('itinerary-data');
  if (itineraryEl && itineraryEl.dataset.prevDestinations) {
    const dayColors = {
      1: 'red',
      2: 'orange',
      3: 'yellow',
      4: 'green',
      5: 'ltblue',
      6: 'blue',
      7: 'purple'
    };
    const prevDestinations = JSON.parse(itineraryEl.dataset.prevDestinations);
    prevDestinations.forEach((dest) => {
      const colorName = dayColors[dest.day] || 'red';
      const iconUrl = `http://maps.google.com/mapfiles/ms/icons/${colorName}-dot.png`;
      new google.maps.Marker({
        position: { lat: parseFloat(dest.lat), lng: parseFloat(dest.lng) },
        map: window.map,
        title: dest.name,
        label: {
          text: `${dest.day}-${dest.arrival_order}`,
          color: '#ffffff',
          fontWeight: 'bold',
          fontSize: '10px'
        },
        icon: {
          url: iconUrl,
          scaledSize: new google.maps.Size(32, 32),
        },
        opacity: 0.7,
      });
    });
  }

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

  // 既存の出発地がある場合、経路選択モードを復元
  restoreExistingState();

  // Places Autocomplete の初期化
  initPlacesAutocomplete();
}

window.initMap = initMap;

// 既存の出発地・目的地がある場合に経路選択モードを復元
function restoreExistingState() {
  const itineraryEl = document.getElementById('itinerary-data');
  if (!itineraryEl) return;

  const currentDay = parseInt(itineraryEl.dataset.currentDay) || 1;
  const spName = itineraryEl.dataset.existingSpName;
  const spLat = parseFloat(itineraryEl.dataset.existingSpLat);
  const spLng = parseFloat(itineraryEl.dataset.existingSpLng);

  if (!spName || isNaN(spLat) || isNaN(spLng)) return;

  // 2日目以降: 前日ゴールを青Sピンに、1日目のスタートは過去ピンスタイルに
  const prevName = itineraryEl.dataset.prevDestinationName;
  const prevLat = parseFloat(itineraryEl.dataset.prevDestinationLat);
  const prevLng = parseFloat(itineraryEl.dataset.prevDestinationLng);

  if (currentDay >= 2 && prevName && !isNaN(prevLat) && !isNaN(prevLng)) {
    // 1日目のスタートピンを過去日スタイルで表示
    new google.maps.Marker({
      position: { lat: spLat, lng: spLng },
      map: window.map,
      title: spName,
      label: {
        text: 'S',
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: '10px'
      },
      icon: {
        url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
        scaledSize: new google.maps.Size(32, 32),
      },
      opacity: 0.7,
    });

    // 前日ゴール = 今日のスタートを青Sピンに
    setStartingPoint(prevLat, prevLng, prevName);
    // 2日目のスタート地点を中心にズーム
    window.map.setCenter({ lat: prevLat, lng: prevLng });
    window.map.setZoom(9);
  } else {
    // 1日目: 通常通り
    setStartingPoint(spLat, spLng, spName);
    window.map.setCenter({ lat: spLat, lng: spLng });
    window.map.setZoom(9);
  }

  // UIを経路選択モードに切り替え
  const heading = document.querySelector('.starting-point-heading');
  if (heading) heading.textContent = '経路を選択する:';
  const searchBtn = document.getElementById('search-location');
  if (searchBtn) searchBtn.style.display = 'none';
  const registerBtn = document.getElementById('register-starting-point');
  if (registerBtn) registerBtn.style.display = 'none';

  enableRouteSelection();

  // 既存の目的地があればマーカーを選択状態にする
  const existingDestsJson = itineraryEl.dataset.existingDestinations;
  if (existingDestsJson) {
    const existingDests = JSON.parse(existingDestsJson);
    existingDests.forEach((dest) => {
      const marker = window.markers.find(m => m.getTitle() === dest.name);
      if (marker) {
        selectRouteMarker(marker);
      }
    });
  }
}

// 現在地を選ぶ
const searchLocationButton = document.getElementById('search-location');
if (searchLocationButton) {
  searchLocationButton.addEventListener('click', () => {
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
}

// 自宅を選ぶ
const selectHomeButton = document.getElementById('select-home');
if (selectHomeButton) {
  selectHomeButton.addEventListener('click', () => {
    const formEl = document.querySelector('.starting-point-form');
    const homeLat = parseFloat(formEl.dataset.homeLat);
    const homeLng = parseFloat(formEl.dataset.homeLng);
    const homeAddress = formEl.dataset.homeAddress;

    if (isNaN(homeLat) || isNaN(homeLng)) {
      alert("自宅の位置情報が登録されていません。");
      return;
    }

    if (window.routeSelectionEnabled) {
      // 経路選択モード: マーカーを作成して経路に追加
      var marker = new google.maps.Marker({
        position: { lat: homeLat, lng: homeLng },
        map: window.map,
        title: homeAddress,
        icon: {
          url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
          scaledSize: new google.maps.Size(50, 40),
        },
      });
      window.markers.push(marker);
      marker.addListener("click", function() {
        if (window.routeSelectionEnabled) {
          selectRouteMarker(marker);
        }
      });
      selectRouteMarker(marker);
    } else {
      // 出発地モード
      setStartingPoint(homeLat, homeLng, homeAddress);
    }

    window.map.setCenter({ lat: homeLat, lng: homeLng });
    window.map.setZoom(10);
  });
}

// Google Places Autocomplete の初期化
function initPlacesAutocomplete() {
  var input = document.getElementById('place-search-input');
  if (!input) return;

  // 北海道の範囲に制限
  var hokkaidoBounds = new google.maps.LatLngBounds(
    new google.maps.LatLng(41.3, 139.3),  // 南西
    new google.maps.LatLng(45.6, 145.8)   // 北東
  );

  var autocomplete = new google.maps.places.Autocomplete(input, {
    bounds: hokkaidoBounds,
    strictBounds: true,
    componentRestrictions: { country: 'jp' },
    fields: ['geometry', 'name', 'formatted_address'],
  });

  autocomplete.addListener('place_changed', function() {
    var place = autocomplete.getPlace();
    if (!place.geometry) {
      alert("場所が見つかりませんでした。");
      return;
    }

    var lat = place.geometry.location.lat();
    var lng = place.geometry.location.lng();
    var name = place.name || place.formatted_address;

    if (window.routeSelectionEnabled) {
      // 経路選択モード: マーカーを作成して経路に追加
      var marker = new google.maps.Marker({
        position: { lat: lat, lng: lng },
        map: window.map,
        title: name,
        icon: {
          url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
          scaledSize: new google.maps.Size(50, 40),
        },
      });
      window.markers.push(marker);
      marker.addListener("click", function() {
        if (window.routeSelectionEnabled) {
          selectRouteMarker(marker);
        }
      });
      selectRouteMarker(marker);
    } else {
      // 出発地モード
      setStartingPoint(lat, lng, name);
    }

    window.map.setCenter({ lat: lat, lng: lng });
    window.map.setZoom(12);
    input.value = '';
  });
}


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
const registerButton = document.getElementById('register-starting-point');
if (registerButton) {
  registerButton.addEventListener('click', () => {
    if (startMarker) {
      const position = startMarker.getPosition();
      const title = startMarker.getTitle(); // マーカーのタイトル（出発地名）
      saveStartingPoint(position.lat(), position.lng(), title);
    } else {
      alert("出発地点を選択してください。");
    }
  });
}

// サーバーに送信する関数
function saveStartingPoint(lat, lng, title, customMessage) {
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
    alert(customMessage || "出発地が登録されました！");
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
