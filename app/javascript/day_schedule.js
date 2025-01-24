document.addEventListener("turbo:load", () => {
  const departureTimeInput = document.querySelector('.departure-time');
  const travelTimeInputs = document.querySelectorAll('.travel-time');
  const arrivalTimeInputs = document.querySelectorAll('.arrival-time');
  const stayTimeInputs = document.querySelectorAll('.stay-time');
  const nextDepartureTimeInputs = document.querySelectorAll('.next-departure-time');

  // 出発時間変更時の処理
  departureTimeInput.addEventListener('input', () => {
    calculateTimes();
  });

  travelTimeInputs.forEach((input) => {
    input.addEventListener('input', () => {
      calculateTimes();
    });
  });

  stayTimeInputs.forEach((input) => {
    input.addEventListener('input', () => {
      calculateTimes();
    });
  });

  function calculateTimes() {
    let currentDepartureTime = parseTime(departureTimeInput.value); // 出発時間を基準に計算

    travelTimeInputs.forEach((travelInput, index) => {
      const travelTime = parseTime(travelInput.value || "00:00");
      const stayTime = parseTime(stayTimeInputs[index]?.value || "00:00");

      // 到着予定時間の計算
      const arrivalTime = addTimes(currentDepartureTime, travelTime);
      if (arrivalTimeInputs[index]) {
        arrivalTimeInputs[index].value = formatTime(arrivalTime);
      }

      // 出発予定時間の計算
      const nextDepartureTime = addTimes(arrivalTime, stayTime);
      if (nextDepartureTimeInputs[index]) {
        nextDepartureTimeInputs[index].value = formatTime(nextDepartureTime);
      }

      // 次の目的地の出発時間に更新
      currentDepartureTime = nextDepartureTime;
    });
  }

  // 時間を "HH:MM" 形式から [hours, minutes] のオブジェクトに変換
  function parseTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return { hours: hours || 0, minutes: minutes || 0 };
  }

  // 時間を加算
  function addTimes(time1, time2) {
    const totalMinutes = time1.minutes + time2.minutes;
    const totalHours = time1.hours + time2.hours + Math.floor(totalMinutes / 60);
    return { hours: totalHours % 24, minutes: totalMinutes % 60 };
  }

  // 時間を "HH:MM" 形式にフォーマット
  function formatTime(time) {
    const hours = time.hours.toString().padStart(2, '0');
    const minutes = time.minutes.toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
});