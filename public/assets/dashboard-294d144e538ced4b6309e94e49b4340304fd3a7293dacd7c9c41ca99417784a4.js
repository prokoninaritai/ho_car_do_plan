document.addEventListener("turbo:load", () => {
  if (typeof google !== "undefined" && typeof google.maps !== "undefined") {
    if (typeof window.initMap === "function") {
      window.initMap();
    }
  }
});

console.log("Initializing map...");
window.initMap = function initMap() {
  const mapOptions = {
    center: { lat: 41.92591, lng: 140.65724 },
    zoom: 9,
  };

  const map = new google.maps.Map(document.getElementById("map"), mapOptions);

  fetch("/maps/stations_data")
    .then((response) => response.json())
    .then((stations) => {
      // Bootstrapモーダルインスタンスを取得
      const modalElement = document.getElementById("stationModal");
      const stationModal = new bootstrap.Modal(modalElement, {
        backdrop: true, // 背景を有効にする
        keyboard: true, // エスケープキーで閉じる
      });

      stations.forEach((station) => {
        // マーカー要素を作成
        const marker = new google.maps.Marker({
          position: { lat: parseFloat(station.latitude), lng: parseFloat(station.longitude) },
          title: station.name, // ツールチップ用タイトル
          map: map,
        });

        // マーカークリック時にモーダルを表示
        marker.addListener("click", () => {
          // モーダルをリセットしてから表示
          if (stationModal._isShown) {
            stationModal.hide();
          }

          document.getElementById("stationName").innerText = ` ${station.name}`;

          // 休館日を表示する要素を取得
          const closedDaysElement = document.getElementById("closedDays");
          closedDaysElement.innerHTML = ""; // 初期化

          // 休館日データを処理
          station.closed_days.forEach((day) => {
            const divItem = document.createElement("div");

            // 表示用テキストの作成
            let formattedStartDate = day.start_date.replace("-", "月") + "日";
            let formattedEndDate = day.end_date.replace("-", "月") + "日";
            const closedInfo = day.closed_info.includes("曜日") ? `毎週${day.closed_info}` : day.closed_info;
            let text = `${closedInfo}`;
            if (formattedStartDate && formattedEndDate) {
              text += ` (${formattedStartDate}〜${formattedEndDate})`;
            }

            // メインテキスト部分
            const mainText = document.createElement("span");
            mainText.innerText = text;
            divItem.appendChild(mainText);

            // 備考部分（remarks）
            if (day.remarks) {
              const remarksText = document.createElement("div");
              remarksText.innerText = day.remarks;
              remarksText.style.marginTop = "4px"; // 上部のマージンで余白を調整
              remarksText.style.color = "#555"; // 備考の文字色を変更（必要なら）
              remarksText.style.fontSize = "14px"; // 小さめのフォントサイズに調整
              divItem.appendChild(remarksText);
            }

            closedDaysElement.appendChild(divItem);
          });

          // 営業時間リスト
          const businessHoursList = document.getElementById("businessHours");
          businessHoursList.innerHTML = "";
          station.business_hours.forEach((hour) => {
            const listItem = document.createElement("li");
            const formattedOpeningTime = formatTimeString(hour.opening_time);
            const formattedClosingTime = formatTimeString(hour.closing_time);
            const formattedStartDate = hour.start_date ? hour.start_date.replace("-", "月") + "日" : "通年";
            const formattedEndDate = hour.end_date ? hour.end_date.replace("-", "月") + "日" : "通年";
            listItem.innerText = `${formattedOpeningTime}〜${formattedClosingTime} (${formattedStartDate}〜${formattedEndDate})`;
            businessHoursList.appendChild(listItem);
          });

          // スタンプ押印時間を表示
          const stampHoursElement = document.getElementById("stampHours");
          stampHoursElement.innerHTML = station.stamp_available_hours
            .map((hour) => `
              <div>
                <span class="stamp-availability">${hour.available_hour}</span>
                ${hour.remarks ? `<span class="stamp-notice">※${hour.remarks}</span>` : ""}
              </div>
            `)
            .join("");

          // モーダルを表示
          stationModal.show();
        });
      });
    })
    .catch((error) => console.error("Error fetching stations data:", error));
};

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
};
