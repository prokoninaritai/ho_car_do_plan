// ページの読み込み時に実行
document.addEventListener("turbo:load", () => {
  // 出発時間や到着時間を計算する関数を設定
  setupTimeCalculations();

  // しおりの登録ボタンを設定
  setupSaveButton();
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

      
      // 出発時間と移動時間を足して、到着予定時間を計算
      const arrivalTime = addTimes(currentDepartureTime, travelTime);
      if (arrivalTimeInputs[index]) {
        arrivalTimeInputs[index].value = formatTime(arrivalTime); // 表示
        arrivalTimeInputs[index].setAttribute("value", formatTime(arrivalTime)); // HTML反映
      }

      // 時間をHH:MM形式にフォーマット
      function formatTime(time) {
        const hours = time.hours.toString().padStart(2, "0");
        const minutes = time.minutes.toString().padStart(2, "0");
        return `${hours}:${minutes}`;
      }

      // 出発予定時間と滞在予定時間を足して出発予定時間を計算
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
function setupSaveButton() {
  const saveButton = document.querySelector("#register_time");
  if (!saveButton) {
    console.error("Save button not found");
    return;
  }

  saveButton.addEventListener("click", () => {
    console.log("Saving time managements...");

    const timeManagements = [];
    const destinationBlocks = document.querySelectorAll(".destination-details-block");
    // 移動時間ブロックは destination-details-block の外にあるので、全体から取得
    const travelTimeBlocks = document.querySelectorAll(".travel-time-block");

    destinationBlocks.forEach((block, index, array) => {
      const destinationId = block.dataset.destinationId;
      const arrivalTime = block.querySelector(".arrival-time")?.value;
      const isLast = index === array.length - 1;

      // 最後の目的地は次の出発がないので到着時間をセット
      const departureTime = isLast ? arrivalTime : block.querySelector(".next-departure-time")?.value;

      // 移動時間は対応する travel-time-block から取得（index番目のブロックが対応）
      const travelTimeInput = travelTimeBlocks[index]?.querySelector(".travel-time");
      const stayTimeInput = block.querySelector(".stay-time");

      const travelTime = travelTimeInput?.value || "00:00";
      const stayDuration = isLast ? "00:00" : (stayTimeInput?.value || "00:00");

      console.log(`Dest ${destinationId}: arrival=${arrivalTime} departure=${departureTime} travel=${travelTime} stay=${stayDuration}`);

      if (!destinationId || !arrivalTime || !departureTime) {
        console.error(`Missing data for destination ID: ${destinationId}`);
        return;
      }

      timeManagements.push({
        destination_id: parseInt(destinationId, 10),
        arrival_time: arrivalTime,
        departure_time: departureTime,
        custom_travel_time: travelTime,
        stay_duration: stayDuration,
      });
    });

    console.log("Collected time managements:", timeManagements);

    fetch("/time_managements", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]').content,
      },
      body: JSON.stringify({ timeManagements }),
    })
      .then(response => response.ok ? response.json() : Promise.reject("Failed to save"))
      .then(data => {
        console.log("Server response:", data.message);
        const scheduleData = document.getElementById("day-schedule-data");
        const itineraryId = scheduleData.dataset.itineraryId;

        // しおり確認画面へ戻る
        window.location.href = `/itineraries/${itineraryId}`;
      })
      .catch(error => console.error("Error:", error));
  });
}

// === 補助関数 ===
function parseTime(timeString) {
  const [hours, minutes] = timeString.split(":").map(Number);
  return { hours: hours || 0, minutes: minutes || 0 };
}

function addTimes(time1, time2) {
  const totalMinutes = time1.minutes + time2.minutes;
  const totalHours = time1.hours + time2.hours + Math.floor(totalMinutes / 60);
  return { hours: totalHours % 24, minutes: totalMinutes % 60 };
}

function formatTime(time) {
  return `${time.hours.toString().padStart(2, "0")}:${time.minutes.toString().padStart(2, "0")}`;
}