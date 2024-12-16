
// マップを初期化する関数
function initMap() {
  const defaultLocation = { lat: 42.6345, lng: 141.6058 }; // 苫小牧フェリー乗り場（デフォルト）

  // 地図オプション（初期値）
  const mapOptions = {
    center: defaultLocation,
    zoom: 10,
  };

  // 地図を表示する要素を取得
  const mapElement = document.getElementById('map');
  const map = new google.maps.Map(mapElement, mapOptions);

  // 現在地を取得する
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const currentLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        // 現在地が道内（北海道）かどうかを判定する
        if (isWithinHokkaido(currentLocation)) {
          map.setCenter(currentLocation); // 現在地に地図を移動
          new google.maps.Marker({
            position: currentLocation,
            map: map,
            title: "現在地",
          });
        } else {
          // 現在地が道外の場合、苫小牧フェリー乗り場を表示
          map.setCenter(defaultLocation);
          new google.maps.Marker({
            position: defaultLocation,
            map: map,
            title: "苫小牧フェリー乗り場",
          });
        }
      },
      () => {
        // 現在地が取得できない場合もデフォルトの苫小牧を表示
        map.setCenter(defaultLocation);
        new google.maps.Marker({
          position: defaultLocation,
          map: map,
          title: "苫小牧フェリー乗り場",
        });
      }
    );
  } else {
    // Geolocationがサポートされていない場合
    alert("このブラウザでは位置情報がサポートされていません。");
    map.setCenter(defaultLocation);
    new google.maps.Marker({
      position: defaultLocation,
      map: map,
      title: "苫小牧フェリー乗り場",
    });
  }
}

// 北海道の座標範囲で判定する関数
function isWithinHokkaido(location) {
  // 北海道のおおよその緯度経度範囲
  const north = 45.5;
  const south = 41.2;
  const east = 148.0;
  const west = 139.5;

  return (
    location.lat >= south &&
    location.lat <= north &&
    location.lng >= west &&
    location.lng <= east
  );
}

// グローバルスコープで初期化関数を公開
window.initMap = initMap;