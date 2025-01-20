departureInputs.forEach((input, index) => {
  input.addEventListener('input', () => {
    console.log(`Departure time changed for index ${index}`);
    calculateTimes(index);
  });
});

travelInputs.forEach((input, index) => {
  input.addEventListener('input', () => {
    console.log(`Travel time changed for index ${index}`);
    calculateTimes(index);
  });
});


document.addEventListener("DOMContentLoaded", () => {
  // 出発時間と移動時間の入力フォームを取得
  const departureInput = document.querySelector('.departure-time');
  const travelTimeInput = document.querySelector('.travel-time');
  const arrivalInput = document.querySelector('.arrival-time');

  // 到着予定時間を計算する関数
  function calculateArrivalTime() {
    const departureTime = departureInput.value;
    const travelTime = travelTimeInput.value;

    if (departureTime && travelTime) {
      // 出発時間を解析
      const [depHours, depMinutes] = departureTime.split(':').map(Number);
      // 移動時間を解析
      const [travelHours, travelMinutes] = travelTime.split(':').map(Number);

      // 現在の日時に出発時間を設定
      const arrivalDate = new Date();
      arrivalDate.setHours(depHours, depMinutes, 0);
      
      // 移動時間を追加
      arrivalDate.setMinutes(arrivalDate.getMinutes() + (travelHours * 60) + travelMinutes);

      // 到着予定時間をフォーマットして表示
      const formattedTime = arrivalDate.toTimeString().slice(0, 5); // HH:MM形式
      arrivalInput.value = formattedTime;
    }
  }

  // 入力変更時に計算をトリガー
  departureInput.addEventListener('input', calculateArrivalTime);
  travelTimeInput.addEventListener('input', calculateArrivalTime);
});
