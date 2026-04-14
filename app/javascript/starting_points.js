// Turboナビゲーション前にinitMap済みフラグをリセット
document.addEventListener("turbo:before-visit", function() {
  window._mapInitDone = false;
});

document.addEventListener("turbo:load", () => {
  // google.mapsが未ロードの場合はGoogle MapsのcallbackでinitMapが呼ばれるためスキップ
  // （両方から呼ばれると二重初期化になり目的地が消える）
  if (typeof google !== 'undefined' && typeof google.maps !== 'undefined') {
    if (typeof initMap === "function") {
      initMap();
    }
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
          setStartingPoint(prevLat, prevLng, prevName, false);
          const msg = `${currentDay - 1}日目の日程を登録しました。${currentDay}日目の経路を登録してください`;
          saveStartingPoint(prevLat, prevLng, prevName, msg);
        }
      }, 200);
    }
  }
});

// --- 変数の宣言 ---
window.startMarker = null;
window.placeHoursMap = {}; // Places API の営業時間を名前をキーに保存

// 営業時間を保存するヘルパー
function savePlaceHours(name, openingHours) {
  if (openingHours && openingHours.weekday_text && openingHours.weekday_text.length > 0) {
    window.placeHoursMap[name] = openingHours.weekday_text;
  }
}
window.markers = []; // グローバル変数として定義
window.startInfoWindow = null; // 出発地の吹き出し

// マップを初期化
function initMap() {
  // 同一ページ内での二重初期化を防ぐ（turbo:loadとGoogle Maps callbackの両方が発火するケース対策）
  if (window._mapInitDone) return;
  window._mapInitDone = true;

  // 前回のマーカーを地図から除去してリセット（Turboナビゲーション後の古い参照を除去）
  if (window.markers && window.markers.length > 0) {
    window.markers.forEach(function(m) { try { m.setMap(null); } catch(e) {} });
  }
  window.markers = [];

  const isMobile = window.innerWidth <= 600;
  window.map = new google.maps.Map(document.getElementById('map2'), {
    center: { lat: 41.92591, lng: 140.65724 },
    zoom: 7,
    mapTypeControlOptions: isMobile ? {
      position: google.maps.ControlPosition.BOTTOM_RIGHT,
    } : {},
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
    const prevDestinations = JSON.parse(itineraryEl.dataset.prevDestinations);
    prevDestinations.forEach((dest) => {
      new google.maps.Marker({
        position: { lat: parseFloat(dest.lat), lng: parseFloat(dest.lng) },
        map: window.map,
        title: dest.name,
        icon: window.mapPins.destinationPin(dest.day, dest.arrival_order),
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
      icon: window.mapPins.stationPin(false),
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
        setStartingPoint(marker.getPosition().lat(), marker.getPosition().lng(), marker.getTitle(), false);
      }
    });
  });

  // 既存の出発地がある場合、経路選択モードを復元
  restoreExistingState();

  // Places Autocomplete の初期化
  initPlacesAutocomplete();

  // 地図上のPOI（施設ピン）クリック時の処理
  var poiPlacesService = new google.maps.places.PlacesService(window.map);
  window.map.addListener('click', function(event) {
    if (!event.placeId) return; // 施設ピン以外のクリックは無視
    event.stop(); // デフォルトのInfoWindowを抑制

    poiPlacesService.getDetails(
      { placeId: event.placeId, fields: ['geometry', 'name', 'opening_hours'] },
      function(place, status) {
        if (status !== 'OK' || !place.geometry) return;
        var lat = place.geometry.location.lat();
        var lng = place.geometry.location.lng();
        var name = place.name;
        savePlaceHours(name, place.opening_hours);
        handlePlaceSelection(lat, lng, name);
      }
    );
  });
}

window.initMap = initMap;

// 経路選択モード用の見出し行（自宅ボタン + 逆順ボタン）をセットアップ
function setupHeadingRow() {
  var heading = document.querySelector('.starting-point-heading');
  var homeBtn = document.getElementById('select-home');
  if (!heading) return;
  if (heading.closest('.heading-row')) return; // 既にセットアップ済み

  var headingRow = document.createElement('div');
  headingRow.className = 'heading-row';
  heading.parentNode.insertBefore(headingRow, heading);
  headingRow.appendChild(heading);

  var btnGroup = document.createElement('div');
  btnGroup.className = 'heading-btn-group';
  headingRow.appendChild(btnGroup);

  if (homeBtn) {
    homeBtn.classList.add('select-home-small');
    btnGroup.appendChild(homeBtn);
    homeBtn.style.display = '';
  }

  var revBtn = document.createElement('button');
  revBtn.type = 'button';
  revBtn.textContent = '逆順';
  revBtn.className = 'reverse-route-heading-btn';
  revBtn.addEventListener('click', function() {
    if (window.reverseRoute) window.reverseRoute();
  });
  btnGroup.appendChild(revBtn);

  var itEl = document.getElementById('itinerary-data');
  var currentDay = itEl ? parseInt(itEl.dataset.currentDay) || 1 : 1;
  if (currentDay === 1) {
    var changeBtn = document.createElement('button');
    changeBtn.type = 'button';
    changeBtn.textContent = '出発地変更';
    changeBtn.className = 'change-sp-btn';
    changeBtn.addEventListener('click', function() {
      resetToStartingPointMode();
    });
    btnGroup.appendChild(changeBtn);
  }
}

function resetToStartingPointMode() {
  window.routeSelectionEnabled = false;

  var form = document.querySelector('.starting-point-form');
  var headingRow = form ? form.querySelector('.heading-row') : null;
  var heading = document.querySelector('.starting-point-heading');
  var homeBtn = document.getElementById('select-home');
  var searchBtn = document.getElementById('search-location');
  var registerBtn = document.getElementById('register-starting-point');
  var dtSection = document.getElementById('departure-time-section');

  // heading-row を解体して label を元の位置に戻す
  if (headingRow && heading) {
    headingRow.parentNode.insertBefore(heading, headingRow);
    headingRow.remove();
  }
  if (heading) heading.textContent = '出発地点を選ぶ:';

  // ホームボタンを search-location の直後に戻す
  if (homeBtn && searchBtn && searchBtn.parentNode) {
    searchBtn.parentNode.insertBefore(homeBtn, searchBtn.nextSibling);
    homeBtn.classList.remove('select-home-small');
    homeBtn.style.display = '';
  }

  if (searchBtn) searchBtn.style.display = '';
  if (registerBtn) registerBtn.style.display = '';
  if (dtSection) dtSection.style.display = 'none';

  // 出発地マーカーを削除
  if (window.startMarker) {
    window.startMarker.setMap(null);
    window.startMarker = null;
  }
  window.startPoint = null;

  // 描画済みの経路線だけ消す（目的地マーカーは残す）
  if (window.clearRouteLines) window.clearRouteLines();
}

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
      icon: window.mapPins.startPin(),
      opacity: 0.7,
    });

    // 前日ゴール = 今日のスタートを青Sピンに
    setStartingPoint(prevLat, prevLng, prevName, false);
    // 2日目のスタート地点を中心にズーム
    window.map.setCenter({ lat: prevLat, lng: prevLng });
    window.map.setZoom(9);
  } else {
    // 1日目: 通常通り
    setStartingPoint(spLat, spLng, spName, false);
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
  setupHeadingRow();
  enableRouteSelection();

  // 既存の目的地があればマーカーを選択状態にする
  const existingDestsJson = itineraryEl.dataset.existingDestinations;
  if (existingDestsJson) {
    const existingDests = JSON.parse(existingDestsJson);
    // place_hours を placeHoursMap に復元
    existingDests.forEach((dest) => {
      if (dest.place_hours) {
        try { window.placeHoursMap[dest.name] = JSON.parse(dest.place_hours); } catch(e) {}
      }
    });
    existingDests.forEach((dest) => {
      let marker = window.markers.find(m => m.getTitle() === dest.name);
      // 道の駅以外の目的地（Places APIで追加した場所など）はmarkers配列にないので動的に作成
      if (!marker && dest.lat && dest.lng) {
        marker = new google.maps.Marker({
          position: { lat: parseFloat(dest.lat), lng: parseFloat(dest.lng) },
          map: window.map,
          title: dest.name,
          icon: window.mapPins.stationPin(false),
        });
        window.markers.push(marker);
        marker.addListener('click', function() {
          if (window.routeSelectionEnabled) selectRouteMarker(marker);
        });
      }
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
          window.map.setCenter({ lat: latitude, lng: longitude });
          window.map.setZoom(14);
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
      showInfoWindow(marker, homeAddress);
    } else {
      // 出発地モード
      setStartingPoint(homeLat, homeLng, homeAddress);
    }

    window.map.setCenter({ lat: homeLat, lng: homeLng });
    window.map.setZoom(10);
  });
}

// 場所を選択した時の共通処理
function handlePlaceSelection(lat, lng, name) {
  if (window.routeSelectionEnabled) {
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
    showInfoWindow(marker, name);
  } else {
    setStartingPoint(lat, lng, name);
  }
  window.map.setCenter({ lat: lat, lng: lng });
  window.map.setZoom(12);
}

// カスタム検索ドロップダウンの初期化（道の駅優先 + Places API）
function initPlacesAutocomplete() {
  var input = document.getElementById('place-search-input');
  if (!input) return;

  // カスタムドロップダウン要素をbodyに追加（overflow clippingを回避）
  var dropdown = document.createElement('div');
  dropdown.id = 'place-search-dropdown';
  document.body.appendChild(dropdown);

  // 入力欄の右側に位置を合わせる
  function positionDropdown() {
    var rect = input.getBoundingClientRect();
    dropdown.style.top = (rect.top + window.scrollY) + 'px';
    dropdown.style.left = (rect.right + window.scrollX + 8) + 'px';
  }

  // 道の駅データを取得
  var stationsEl = document.getElementById('stations-data');
  var stations = stationsEl ? JSON.parse(stationsEl.dataset.stations) : [];

  var hokkaidoBounds = new google.maps.LatLngBounds(
    new google.maps.LatLng(41.3, 139.3),
    new google.maps.LatLng(45.6, 145.8)
  );
  var autocompleteService = new google.maps.places.AutocompleteService();
  var placesService = new google.maps.places.PlacesService(window.map);

  // 履歴の管理（localStorage）
  var HISTORY_KEY = 'place_search_history';
  var MAX_HISTORY = 5;

  function loadHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; }
    catch(e) { return []; }
  }

  function saveToHistory(item) {
    var history = loadHistory().filter(function(h) { return h.name !== item.name; });
    history.unshift(item);
    if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }

  var debounceTimer = null;
  var isComposing = false;
  input.addEventListener('compositionstart', function() { isComposing = true; });
  input.addEventListener('compositionend', function() {
    isComposing = false;
    input.dispatchEvent(new Event('input'));
  });

  // フォーカス時に履歴を表示
  input.addEventListener('focus', function() {
    if (input.value.trim()) return;
    var history = loadHistory();
    if (history.length > 0) renderDropdown([], [], history);
  });

  input.addEventListener('input', function() {
    if (isComposing) return;
    var query = input.value.trim();
    if (!query) {
      var history = loadHistory();
      if (history.length > 0) renderDropdown([], [], history);
      else dropdown.style.display = 'none';
      return;
    }

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function() {
      // 道の駅をまず検索（名前・読み仮名の部分一致）
      var stationMatches = stations.filter(function(s) {
        return s.name.includes(query) || (s.kana && s.kana.includes(query));
      });

      // Places API：現在のマップビューポートを優先、なければ北海道全体
      var searchBounds = (window.map && window.map.getBounds()) ? window.map.getBounds() : hokkaidoBounds;
      autocompleteService.getPlacePredictions({
        input: query,
        bounds: searchBounds,
        strictBounds: false,
        componentRestrictions: { country: 'jp' },
        types: ['establishment'],
      }, function(predictions, status) {
        renderDropdown(stationMatches, status === 'OK' ? predictions : [], []);
      });
    }, 300);
  });

  function renderDropdown(stationMatches, predictions, history) {
    var html = '';

    // 履歴（未入力時のみ）
    if (history && history.length > 0 && input.value.trim() === '') {
      html += '<div class="place-search-section-label">最近使った場所</div>';
      history.forEach(function(h) {
        html += '<div class="place-search-item place-search-history"' +
          ' data-type="history"' +
          ' data-name="' + h.name + '"' +
          ' data-lat="' + h.lat + '"' +
          ' data-lng="' + h.lng + '">' +
          '🕐 ' + h.name +
          '</div>';
      });
    }

    // 道の駅を先頭に表示
    stationMatches.forEach(function(s) {
      html += '<div class="place-search-item place-search-station"' +
        ' data-type="station"' +
        ' data-name="' + s.name + '"' +
        ' data-lat="' + s.latitude + '"' +
        ' data-lng="' + s.longitude + '">' +
        '🚏 ' + s.name +
        '</div>';
    });

    // 道の駅と重複しないPlaces候補を追加
    var stationNames = stationMatches.map(function(s) { return s.name; });
    predictions.forEach(function(p) {
      if (stationNames.some(function(n) { return p.description.includes(n); })) return;
      // 都道府県名だけの結果は除外
      var mainText = p.structured_formatting ? p.structured_formatting.main_text : p.description;
      html += '<div class="place-search-item"' +
        ' data-type="place"' +
        ' data-place-id="' + p.place_id + '">' +
        '📍 ' + mainText +
        '</div>';
    });

    dropdown.innerHTML = html;
    if (html) {
      positionDropdown();
      dropdown.style.display = 'block';
    } else {
      dropdown.style.display = 'none';
    }

    dropdown.querySelectorAll('.place-search-item').forEach(function(item) {
      item.addEventListener('click', function() {
        dropdown.style.display = 'none';
        input.value = '';
        if (item.dataset.type === 'station' || item.dataset.type === 'history') {
          var lat = parseFloat(item.dataset.lat);
          var lng = parseFloat(item.dataset.lng);
          var name = item.dataset.name;
          saveToHistory({ name: name, lat: lat, lng: lng });
          handlePlaceSelection(lat, lng, name);
        } else {
          placesService.getDetails(
            { placeId: item.dataset.placeId, fields: ['geometry', 'name', 'formatted_address', 'opening_hours'] },
            function(place, status) {
              if (status === 'OK') {
                var lat = place.geometry.location.lat();
                var lng = place.geometry.location.lng();
                var name = place.name || place.formatted_address;
                saveToHistory({ name: name, lat: lat, lng: lng });
                savePlaceHours(name, place.opening_hours);
                handlePlaceSelection(lat, lng, name);
              }
            }
          );
        }
      });
    });
  }

  // 外側クリックでドロップダウンを閉じる
  document.addEventListener('click', function(e) {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  });
}


// 吹き出しを表示（共通）
window.currentInfoWindow = null;
function showInfoWindow(marker, title) {
  if (window.currentInfoWindow) window.currentInfoWindow.close();
  window.currentInfoWindow = new google.maps.InfoWindow({ content: title });
  window.currentInfoWindow.open(window.map, marker);
}

// 出発地の吹き出しを表示
function showStartInfoWindow(marker, title) {
  showInfoWindow(marker, title);
}

// 出発地を設定する
function setStartingPoint(lat, lng, title, showWindow = true) {
  if (window.startMarker) window.startMarker.setMap(null);
  window.startMarker = new google.maps.Marker({
    position: { lat: lat, lng: lng },
    map: window.map,
    title: title,
    icon: window.mapPins.startPin(),
  });

  if (showWindow) showStartInfoWindow(window.startMarker, title);

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
    setupHeadingRow();
    enableRouteSelection(); // 経路選択を有効化
    // 既存の目的地がある場合は新しい出発地から経路を再描画
    if (window.redrawRoutes) window.redrawRoutes();
  })
  .catch(error => {
    console.error("エラー:", error);
    alert("出発地の登録に失敗しました。");
  });
}


// 経路選択を有効化
function enableRouteSelection() {
  window.routeSelectionEnabled = true;

  const dtSection = document.getElementById('departure-time-section');
  if (dtSection) dtSection.style.display = '';

  // 出発地マーカー（startMarker）を固定
  if (startMarker) {
    startMarker.setDraggable(false); // マーカーをドラッグ不可にする
    startMarker.setLabel(null);
    startMarker.setIcon(window.mapPins.startPin());
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
