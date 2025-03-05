// ページの読み込み時に実行
document.addEventListener("turbo:load", () => {
  setupTimeCalculations();
  setupSaveButtons();
});

function setupTimeCalculations() {
  const departureTimeInput = document.querySelector(".departure-time");
  const travelTimeInputs = document.querySelectorAll(".travel-time");
  const arrivalTimeInputs = document.querySelectorAll(".arrival-time");
  const stayTimeInputs = document.querySelectorAll(".stay-time");
  const nextDepartureTimeInputs = document.querySelectorAll(".next-departure-time");

  departureTimeInput?.addEventListener("input", () => calculateTimes());
  travelTimeInputs.forEach((input) => input.addEventListener("input", () => calculateTimes()));
  stayTimeInputs.forEach((input) => input.addEventListener("input", () => calculateTimes()));

  function calculateTimes() {
    let currentDepartureTime = parseTime(departureTimeInput?.value || "00:00");

    travelTimeInputs.forEach((travelInput, index) => {
      const travelTime = parseTime(travelInput.value || "00:00");
      const stayTime = parseTime(stayTimeInputs[index]?.value || "00:00");

      const arrivalTime = addTimes(currentDepartureTime, travelTime);
      if (arrivalTimeInputs[index]) arrivalTimeInputs[index].value = formatTime(arrivalTime);

      if (nextDepartureTimeInputs[index]) {
        const nextDepartureTime = addTimes(arrivalTime, stayTime);
        nextDepartureTimeInputs[index].value = formatTime(nextDepartureTime);
      }

      currentDepartureTime = addTimes(arrivalTime, stayTime);
    });
  }
}

// === 保存ボタンのセットアップ ===
function setupSaveButtons() {
  const saveButton = document.querySelector("#register_time");
  if (!saveButton) {
    console.error("Save button not found");
    return;
  }

  function getItineraryId() {
    const pathParts = window.location.pathname.split("/");
    const itineraryIndex = pathParts.indexOf("itineraries") + 1;
    return itineraryIndex > 0 ? pathParts[itineraryIndex] : null;
  }
  
  const itineraryId = getItineraryId();
  console.log("Itinerary ID:", itineraryId);
  
  if (!itineraryId) {
    console.error("Itinerary ID not found");
    return;
  }

  saveButton.addEventListener("click", () => {
    console.log("Saving time managements...");
    let timeManagements = [];
    const travelTimeInputs = document.querySelectorAll(".travel-time");
    let currentDepartureTime = document.querySelector(".departure-time")?.value || "00:00";
    let lastDestinationId = null;
  
    // **🔹 まず destinationId を取得してソート**
    let blocks = Array.from(document.querySelectorAll(".destination-details-block"));
    blocks.sort((a, b) => parseInt(a.dataset.destinationId, 10) - parseInt(b.dataset.destinationId, 10));
  
    blocks.forEach((block, index, array) => {
      const destinationId = block.dataset.destinationId;
      if (!destinationId) {
        console.error("Error: destinationId is undefined");
        return;
      }
      lastDestinationId = destinationId;
  
      const arrivalTime = block.querySelector(".arrival-time")?.value || "00:00";
      const stayDuration = index !== array.length - 1 ? block.querySelector(".stay-time")?.value || "00:00" : "00:00";
      const travelTime = index < travelTimeInputs.length ? travelTimeInputs[index].value : "00:00";
  
      console.log(`Destination ID: ${destinationId}, Travel Time: ${travelTime}`);
  
      if (!destinationId || !arrivalTime) {
        console.error(`Missing data for destination ID: ${destinationId}`);
        return;
      }
  
      timeManagements.push({
        destination_id: parseInt(destinationId, 10),
        departure_time: currentDepartureTime,
        custom_travel_time: travelTime,
        arrival_time: arrivalTime,
        stay_duration: stayDuration,
      });
  
      currentDepartureTime = formatTime(
        addTimes(parseTime(arrivalTime), parseTime(stayDuration))
      );
    });
  
    console.table(timeManagements);
  
    if (timeManagements.length === 0 || !lastDestinationId) {
      console.error("No valid time managements to save.");
      return;
    }
  
    fetch(`/itineraries/${itineraryId}/destinations/${lastDestinationId}/time_managements`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]').content,
      },
      body: JSON.stringify({ timeManagements }),
    })
      .then(response => {
        if (!response.ok) throw new Error("Failed to save time managements");
        return response.json();
      })
      .then(data => console.log("Server response:", data.message))
      .catch(error => console.error("Error:", error));
  });
};

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