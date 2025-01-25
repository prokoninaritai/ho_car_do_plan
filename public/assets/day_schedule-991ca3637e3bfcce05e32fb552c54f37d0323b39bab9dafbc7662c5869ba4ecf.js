// ページの読み込み時に実行
document.addEventListener("turbo:load", () => {
  // 出発時間や到着時間を計算する関数を設定
  setupTimeCalculations();

  // しおりの登録ボタンを設定
  setupSaveButtons();
});

// === 時間計算関連 ===
function setupTimeCalculations() {
  const departureTimeInput = document.querySelector(".departure-time");
  const travelTimeInputs = document.querySelectorAll(".travel-time");
  const arrivalTimeInputs = document.querySelectorAll(".arrival-time");
  const stayTimeInputs = document.querySelectorAll(".stay-time");
  const nextDepartureTimeInputs = document.querySelectorAll(".next-departure-time");


  
  // 出発時間が変更されたときの処理
  departureTimeInput?.addEventListener("input", () => {
    calculateTimes();
  });

  // 移動時間が変更されたときの処理
  travelTimeInputs.forEach((input) => {
    input.addEventListener("input", () => {
      calculateTimes();
    });
  });

  // 滞在時間が変更されたときの処理
  stayTimeInputs.forEach((input) => {
    input.addEventListener("input", () => {
      calculateTimes();
    });
  });

  // 時間を計算する関数
  function calculateTimes() {
    let currentDepartureTime = parseTime(departureTimeInput?.value || "00:00");

    travelTimeInputs.forEach((travelInput, index) => {
      const travelTime = parseTime(travelInput.value || "00:00");
      const stayTime = parseTime(stayTimeInputs[index]?.value || "00:00");
      
      // 到着予定時間を計算して反映
      const arrivalTime = addTimes(currentDepartureTime, travelTime);
      if (arrivalTimeInputs[index]) {
        arrivalTimeInputs[index].value = formatTime(arrivalTime);
        arrivalTimeInputs[index].setAttribute("value", formatTime(arrivalTime));
        
      }
      

    // 出発予定時間の計算
    const nextDepartureTime = addTimes(arrivalTime, stayTime);
    if (nextDepartureTimeInputs[index]) {
      nextDepartureTimeInputs[index].value = formatTime(nextDepartureTime);
      nextDepartureTimeInputs[index].setAttribute("value", formatTime(nextDepartureTime));

    }

      currentDepartureTime = nextDepartureTime; // 次の出発時間を更新
    });
  }
}




// === 保存関連 ===
function setupSaveButtons() {
  const saveButton = document.querySelector("#register_time");
  if (!saveButton) {
    console.error("Save button not found");
    return;
  }


saveButton.addEventListener("click", () => {
  console.log("Saving time managements...");

  const timeManagements = [];

      // すべての目的地データを取得
      document.querySelectorAll(".destination-details-block").forEach((block) => {
        const destinationId = block.dataset.destinationId;
        const arrivalTime = block.querySelector(".arrival-time")?.value;
        const departureTime = block.querySelector(".next-departure-time")?.value;
        const travelTime = block.querySelector(".travel-time")?.value || "00:00";
        const stayDuration = block.querySelector(".stay-time")?.value || "00:00";
            
        // 必須データが欠けていないか確認
        if (!destinationId || !arrivalTime || !departureTime) {
          console.error(`Missing data for destination ID: ${destinationId}`);
          return;
        }
      
        // データを配列に追加
        timeManagements.push({
          destination_id: parseInt(destinationId, 10),
          arrival_time: arrivalTime, // HH:MM形式
          departure_time: departureTime, // HH:MM形式
          custom_travel_time: travelTime, // HH:MM形式
          stay_duration: stayDuration, // HH:MM形式
        });
      });
      
      // 配列の内容を確認
      console.log("Collected time managements:", timeManagements);

      // サーバーに送信
      fetch("/time_managements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]').content,
        },
        body: JSON.stringify({ time_managements }),
      })
        .then((response) => {
          if (!response.ok) throw new Error("Failed to save time managements");
          return response.json();
        })
        .then((data) => {
          console.log("Server response:", data.message);
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    });
  }

// === 補助関数 ===
// HH:MM形式を解析
function parseTime(timeString) {
  const [hours, minutes] = timeString.split(":").map(Number);
  return { hours: hours || 0, minutes: minutes || 0 };
}

// 時間を加算
function addTimes(time1, time2) {
  const totalMinutes = time1.minutes + time2.minutes;
  const totalHours = time1.hours + time2.hours + Math.floor(totalMinutes / 60);
  return { hours: totalHours % 24, minutes: totalMinutes % 60 };
}

// 時間をHH:MM形式にフォーマット
function formatTime(time) {
  const hours = time.hours.toString().padStart(2, "0");
  const minutes = time.minutes.toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};
