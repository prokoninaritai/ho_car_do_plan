document.addEventListener("turbo:load", () => {
  const departureInput = document.querySelector('.departure-time');
  const travelTimeInput = document.querySelector('.travel-time');
  const arrivalTimeInput = document.querySelector('.arrival-time');

  function calculateArrivalTime() {
    const departureTime = departureInput.value; // 出発時間の取得
    const travelTime = travelTimeInput.value;   // 移動時間の取得

    if (departureTime && travelTime) {
      const [depHours, depMinutes] = departureTime.split(':').map(Number);
      const [travelHours, travelMinutes] = travelTime.split(':').map(Number);

      // 現在の日時に基づいて時間を計算
      const arrivalDate = new Date();
      arrivalDate.setHours(depHours, depMinutes, 0);
      arrivalDate.setMinutes(arrivalDate.getMinutes() + travelHours * 60 + travelMinutes);

      // HH:MM形式で到着時間を表示
      arrivalTimeInput.value = arrivalDate.toTimeString().slice(0, 5);
    }
  }

  if (departureInput && travelTimeInput && arrivalTimeInput) {
    // 入力が変更されたら計算をトリガー
    departureInput.addEventListener('input', calculateArrivalTime);
    travelTimeInput.addEventListener('input', calculateArrivalTime);
  }
});