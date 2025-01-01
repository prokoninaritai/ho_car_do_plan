document.addEventListener("turbo:load", () => {
  console.log("Initializing map...");
  function initMap() {
    const mapOptions = {
      center: { lat: 41.92591, lng: 140.65724 },
      zoom: 9,
    };

    const map = new google.maps.Map(document.getElementById("map"), mapOptions);

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
            title: station.name,
            map: map,
          });

          marker.addListener("click", () => {
            document.getElementById("stationName").innerText = station.name;

            // 休館日データを表示
            const closedDaysElement = document.getElementById("closedDays");
            closedDaysElement.innerHTML = ""; // 初期化

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
