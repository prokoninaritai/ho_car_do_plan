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

    destinationBlocks.forEach((block, index, array) => {
      const destinationId = block.dataset.destinationId;
      const arrivalTime = block.querySelector(".arrival-time")?.value;
      const departureTime = index !== array.length - 1 ? block.querySelector(".next-departure-time")?.value : null;
      
      // `travel-time` が正しく取得できるか確認
      const travelTimeInput = block.querySelector(".travel-time");
      const stayTimeInput = block.querySelector(".stay-time");

      console.log(`Travel Time Input (${destinationId}):`, travelTimeInput?.value);
      console.log(`Stay Duration Input (${destinationId}):`, stayTimeInput?.value);

      const travelTime = travelTimeInput?.value || "00:00";
      const stayDuration = index !== array.length - 1 ? stayTimeInput?.value || "00:00" : "00:00";

      console.log(`Destination ID: ${destinationId}, Arrival Time: ${arrivalTime}, Departure Time:${departureTime}, Travel Time: ${travelTime}, Stay Duration: ${stayDuration}`);

      if (!destinationId || !arrivalTime || (index !== array.length - 1 && !departureTime)) {
        console.error(`Missing data for destination ID: ${destinationId}`);
        return;
      }

      timeManagements.push({
        destination_id: parseInt(destinationId, 10),
        arrival_time: arrivalTime,
        departure_time: departureTime,
        custom_travel_time: travelTime,  // 修正: そのまま HH:MM 形式で保存
        stay_duration: stayDuration,  // 修正: そのまま HH:MM 形式で保存
      });
    });

    console.log("Collected time managements:", timeManagements);

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