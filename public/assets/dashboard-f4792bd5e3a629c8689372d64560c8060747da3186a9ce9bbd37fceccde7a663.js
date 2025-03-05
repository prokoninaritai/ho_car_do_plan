//休館日の表示
function formatClosedPeriod(day) {
  const isFreeTextDate = (date) => {
    return date && !date.includes("-");
  };

  // 日付が両方空なら何も表示しない
  if (!day.start_date && !day.end_date) {
    return "";
  }

  // 【1】start_dateが文字列でend_dateが文字列 → そのまま表示（4月中旬～11月上旬）
  if (isFreeTextDate(day.start_date) && isFreeTextDate(day.end_date)) {
    return `${day.start_date}〜${day.end_date}`;
  }

  // 【2】start_dateが文字列でend_dateが無い → 単発の特別日表示（GWなど）
  if (isFreeTextDate(day.start_date) && !day.end_date) {
    return day.start_date;
  }

  // ここからは普通の「月-日」形式の処理

  const parseDate = (dateString) => {
    const parts = dateString.split("-");
    return {
      month: parseInt(parts[0], 10),
      day: parseInt(parts[1], 10),
    };
  };

  const start = parseDate(day.start_date);
  const end = parseDate(day.end_date);

  // 【3】年末年始は月日表示
  if (day.closed_info.includes("年末年始")) {
    return `${start.month}月${start.day}日〜${end.month}月${end.day}日`;
  }

  // 【4】1月1日～12月31日の場合（通年）、期間表示なし
  if (start.month === 1 && start.day === 1 && end.month === 12 && end.day === 31) {
    return "";  // 通年は期間表示なし
  }

  // 【5】月初～月末なら「○月」
  const isFullMonth = (
    start.day === 1 &&
    (
      (end.day === 31 && [1, 3, 5, 7, 8, 10, 12].includes(end.month)) ||  // 31日の月
      (end.day === 30 && [4, 6, 9, 11].includes(end.month)) ||            // 30日の月
      (end.day === 28 && end.month === 2)                                 // 平年2月
    ) &&
    start.month === end.month
  );

  if (isFullMonth) {
    return `${start.month}月`;
  }

  // 【6】普通の「○月～○月」
  if (start.month !== end.month) {
    return `${start.month}月〜${end.month}月`;
  }

  // 【7】同じ月なら「○月○日～○日」
  return `${start.month}月${start.day}日〜${end.month}月${end.day}日`;
}

//開館時間の表示
function formatBusinessPeriod(hour) {
  if (!hour.start_date && !hour.end_date && !hour.start_day && !hour.end_day) {
    return "";  // 日付も曜日も無いなら期間表示しない
  }

  const isFullYear = hour.start_date === "1-1" && hour.end_date === "12-31";

  // 通年の場合は期間表示しない
  if (isFullYear) return "";

  // 文字列期間対応（GW・夏休みなど）
  if (hour.start_date && isNaN(hour.start_date[0])) {
    return hour.start_date;
  }

  // 日付フォーマット処理
  const formatDate = (dateStr) => {
    if (!dateStr) return "";  // end_dateがnullの場合などを考慮

    if (dateStr.includes("上旬") || dateStr.includes("中旬") || dateStr.includes("下旬")) {
      return dateStr;  // 「4月上旬」などはそのまま
    }

    const [month, day] = dateStr.split("-").map(Number);
    return `${month}月${day}日`;
  };

  const startDate = formatDate(hour.start_date);
  const endDate = formatDate(hour.end_date);

  // 曜日指定処理
  const daysOfWeek = ["月", "火", "水", "木", "金", "土", "日"];
  const startDay = hour.start_day ? daysOfWeek[hour.start_day - 1] + "曜日" : "";
  const endDay = hour.end_day ? daysOfWeek[hour.end_day - 1] + "曜日" : "";

  let periodText = "";

  if (startDate && endDate) {
    periodText = `${startDate}〜${endDate}`;
  } else if (startDate && !endDate) {
    periodText = startDate;
  }

  if (startDay && endDay) {
    if (periodText) {
      periodText += `（${startDay}〜${endDay}）`;
    } else {
      periodText = `${startDay}〜${endDay}`;
    }
  }

  return periodText;
}

document.addEventListener("turbo:load", () => {
  function initMap() {
    const mapOptions = {
      center: { lat: 41.92591, lng: 140.65724 },
      zoom: 7,
    };

    const map = new google.maps.Map(document.getElementById("map1"), mapOptions);

    fetch("/maps/stations_data")
      .then((response) => response.json())
      .then((stations) => {
        const modal = document.getElementById("station-modal");
        const closeModalButton = document.getElementById("close-modal");

        // 閉じるボタンのイベントリスナー
        closeModalButton.addEventListener("click", () => {
          modal.style.display = "none";
        });

        // モーダルの外側クリック時に閉じる
        window.addEventListener("click", (event) => {
          if (event.target === modal) {
            modal.style.display = "none";
          }
        });

        stations.forEach((station) => {
          const marker = new google.maps.Marker({
            position: { lat: parseFloat(station.latitude), lng: parseFloat(station.longitude) },
            map: map,
            
          });
        
          const labelDiv = document.createElement("div");
          labelDiv.style.backgroundColor = "rgba(255, 255, 255, 0.8)"; // 背景を白く半透明に設定
          labelDiv.style.border = "1px solid #ccc"; // 枠線を追加
          labelDiv.style.borderRadius = "4px"; // 角を丸める
          labelDiv.style.padding = "5px"; // 内側の余白
          labelDiv.style.fontSize = "12px"; // 文字サイズ
          labelDiv.style.textAlign = "center"; // 中央揃え
          labelDiv.innerText = station.name;
        
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
            labelDiv.style.top = position.y + 10 + "px"; // マーカーの下に配置
          };
        
          overlay.setMap(map);

          marker.addListener("click", () => {
            document.getElementById("stationName").innerText = station.name;

            // 休館日データを表示
            const closedDaysElement = document.getElementById("closedDays");
            closedDaysElement.innerHTML = ""; // 初期化

            station.closed_days.forEach((day) => {
              const divItem = document.createElement("div");

              // 表示用テキストの作成
              const closedInfo = day.closed_info.includes("曜日") ? `毎週${day.closed_info}` : day.closed_info;
              let periodText = formatClosedPeriod(day);
              let text = `${closedInfo}`;
              if (periodText) {
                text += ` (${periodText})`;
              }

              // メインテキスト部分
              const mainText = document.createElement("span");
              mainText.innerText = text;
              divItem.appendChild(mainText);

              // 備考部分（remarks）
              if (day.remarks) {
                const remarksText = document.createElement("div");
                remarksText.innerText = `備考: ${day.remarks}`; // "備考"を追加
                remarksText.style.marginTop = "4px"; // 上部のマージンで余白を調整
                remarksText.style.color = "#555"; // 備考の文字色を変更（必要なら）
                remarksText.style.fontSize = "14px"; // 小さめのフォントサイズに調整
                divItem.appendChild(remarksText);
              }

              closedDaysElement.appendChild(divItem);
            });

            // 営業時間を表示
            const businessHoursList = document.getElementById("businessHours");
            businessHoursList.innerHTML = station.business_hours
              .map((hour) => {
                const formattedOpeningTime = formatTimeString(hour.opening_time);
                const formattedClosingTime = formatTimeString(hour.closing_time);
                const formattedStartDate = hour.start_date ? hour.start_date.replace("-", "月") + "日" : "通年";
                const formattedEndDate = hour.end_date ? hour.end_date.replace("-", "月") + "日" : "通年";
                return `<li>${formattedOpeningTime}〜${formattedClosingTime} (${formattedStartDate}〜${formattedEndDate})</li>`;
              })
              .join("");

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
            modal.style.display = "block";
          });
        });
      })
      .catch((error) => console.error("Error fetching stations data:", error));
  }

  window.initMap = initMap;

  function formatTimeString(isoTime) {
    if (!isoTime) return "不明";

    const date = new Date(isoTime);
    const hours = (date.getUTCHours() + 9) % 24;
    const minutes = date.getUTCMinutes().toString().padStart(2, "0");

    return `${hours}:${minutes}`;
  }

  if (typeof google !== "undefined" && typeof google.maps !== "undefined") {
    if (typeof window.initMap === "function") {
      window.initMap();
    }
  }
});

