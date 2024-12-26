function initMap() {
  const mapOptions = {
    center: { lat: 41.92591, lng: 140.65724 },
    zoom: 9,
  };

  const map = new google.maps.Map(document.getElementById("map"), mapOptions);

  fetch("/maps/stations_data")
    .then((response) => response.json())
    .then((stations) => {
      stations.forEach((station) => {
        const marker = new google.maps.Marker({
          position: { lat: parseFloat(station.latitude), lng: parseFloat(station.longitude) },
          map: map,
          title: station.name,
        });

        // マーカークリック時にモーダルを表示
        marker.addListener("click", () => {
          const modal = document.getElementById("stationModal");
          document.getElementById("stationName").innerText = `道の駅: ${station.name}`;

          // 休館日を表示
          const closedDaysElement = document.getElementById("closedDays");
          closedDaysElement.innerHTML = ""; // 初期化

          station.closed_days.forEach((day) => {
            // start_date と end_date を「〇月〇日」にフォーマット
            let formattedStartDate = day.start_date.replace("-", "月") + "日";
            let formattedEndDate = day.end_date.replace("-", "月") + "日";
          
            // 「毎週」を付ける条件
            const closedInfo = day.closed_info.includes("曜日") ? `毎週${day.closed_info}` : day.closed_info;
          
            // 表示内容を作成
            let text = `${closedInfo}`;
            if (formattedStartDate && formattedEndDate) {
              text += ` (${formattedStartDate}〜${formattedEndDate})`;
            }
          
            // remarks があれば追加
            if (day.remarks) {
              text += ` - ${day.remarks}`;
            }
          
            // `<div>`を作成して追加
            const divItem = document.createElement("div");
            divItem.innerText = text;
            closedDaysElement.appendChild(divItem);
          });

          // 営業時間をリスト形式で表示
          const businessHoursList = document.getElementById("businessHours");
          businessHoursList.innerHTML = ""; // 初期化

          station.business_hours.forEach((hour) => {
            // 開館時間と閉館時間をフォーマット
            const formattedOpeningTime = formatTimeString(hour.opening_time);
            const formattedClosingTime = formatTimeString(hour.closing_time);
          
            // start_date と end_date を「〇月〇日」にフォーマット
            const formattedStartDate = hour.start_date ? hour.start_date.replace("-", "月") + "日" : "通年";
            const formattedEndDate = hour.end_date ? hour.end_date.replace("-", "月") + "日" : "通年";
          
            // 曜日情報を追加（nullの場合は空にする）
            let days = "";
            if (hour.start_day && hour.end_day) {
              const weekdays = ["月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日", "日曜日"];
              days = `${weekdays[hour.start_day - 1]}〜${weekdays[hour.end_day - 1]}`;
            }

            // 表示内容を作成
            const listItem = document.createElement("li");
            // 期間が「1月1日〜12月31日」の場合は期間を非表示にする
            if (hour.start_date === "1-1" && hour.end_date === "12-31") {
              listItem.innerText = `${days} ${formattedOpeningTime}〜${formattedClosingTime}`;
            } else {
              listItem.innerText = `${days} ${formattedOpeningTime}〜${formattedClosingTime} (${formattedStartDate}〜${formattedEndDate})`;
            }

            // リストに追加
            businessHoursList.appendChild(listItem);
          });

          modal.style.display = "flex";
        });
      });

      // モーダルを閉じるイベント
      document.getElementById("closeModal").addEventListener("click", () => {
        document.getElementById("stationModal").style.display = "none";
      });
    })
    .catch((error) => console.error("Error fetching stations data:", error));
}

window.initMap = initMap;

// 時間のフォーマット関数（ISO 8601対応）
function formatTimeString(isoTime) {
  if (!isoTime) return "不明"; // isoTimeがnullまたはundefinedの場合の処理

  // Dateオブジェクトを生成
  const date = new Date(isoTime);

  // JSTに変換（UTCから9時間加算）
  const hours = (date.getUTCHours() + 9) % 24; // 時間を9時間加算して24で割る
  const minutes = date.getUTCMinutes().toString().padStart(2, "0"); // 分を取得し、2桁で表示

  return `${hours}:${minutes}`; // フォーマットされた時間を返す
}