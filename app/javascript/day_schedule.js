// ページの読み込み時に実行
document.addEventListener("turbo:load", () => {
  // 出発時間や到着時間を計算する関数を設定
  setupTimeCalculations();

  // しおりの登録ボタンを設定
  setupSaveButtons();
});

function setupTimeCalculations() {
  const departureTimeInput = document.querySelector(".departure-time"); // 出発時間
  const travelTimeInputs = document.querySelectorAll(".travel-time"); // 移動時間
  const arrivalTimeInputs = document.querySelectorAll(".arrival-time"); // 到着時間
  const stayTimeInputs = document.querySelectorAll(".stay-time"); // 滞在時間
  const nextDepartureTimeInputs = document.querySelectorAll(".next-departure-time"); // 出発予定時間


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

      // 到着予定時間の計算
      const arrivalTime = addTimes(currentDepartureTime, travelTime);
      if (arrivalTimeInputs[index]) {
        arrivalTimeInputs[index].value = formatTime(arrivalTime);
      }

      // 次の目的地の出発時間 = 現在の目的地の到着時間 + 滞在時間
      if (nextDepartureTimeInputs[index]) {
        const nextDepartureTime = addTimes(arrivalTime, stayTime);
        nextDepartureTimeInputs[index].value = formatTime(nextDepartureTime);
      }

      // 次の目的地の出発時間を次のループの出発時間として更新
      currentDepartureTime = addTimes(arrivalTime, stayTime);
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

    const travelTimeInputs = document.querySelectorAll(".travel-time"); // 移動時間のリストを取得

    let currentDepartureTime = document.querySelector(".departure-time")?.value || "00:00";

    document.querySelectorAll(".destination-details-block").forEach((block, index, array) => {
      const destinationId = block.dataset.destinationId;
      const arrivalTime = block.querySelector(".arrival-time")?.value;
      const stayDuration = index !== array.length - 1 ? block.querySelector(".stay-time")?.value || "00:00" : "00:00";
     
      const travelTime = index < travelTimeInputs.length ? travelTimeInputs[index].value : "00:00";
      
      console.log(`Destination ID: ${destinationId}, Travel Time: ${travelTime}`);

      if (!destinationId || !arrivalTime) {
        console.error(`Missing data for destination ID: ${destinationId}`);
        return;
      }

      timeManagements.push({
        destination_id: parseInt(destinationId, 10),
        departure_time: currentDepartureTime, // 修正：出発時間を「その目的地に行くための出発時間」にする
        custom_travel_time: travelTime,
        arrival_time: arrivalTime,
        stay_duration: stayDuration,
      });

      // 次の目的地の出発時間を更新（到着時間 + 滞在時間）
      currentDepartureTime = index !== array.length - 1 ? formatTime(addTimes(parseTime(arrivalTime), parseTime(stayDuration))) : null;
    });

    console.table(timeManagements);

    fetch("/time_managements", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]').content,
      },
      body: JSON.stringify({ time_managements }),
    })
      .then(response => response.ok ? response.json() : Promise.reject("Failed to save"))
      .then(data => console.log("Server response:", data.message))
      .catch(error => console.error("Error:", error));
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
}