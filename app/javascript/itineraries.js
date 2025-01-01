document.addEventListener("turbo:load", () => {
  // 日程作成モーダルを開くボタンをクリックした際の処理
  const openModalButton = document.querySelector(".open-itinerary-modal");
  const modalElement = document.getElementById("itineraryModal"); // モーダルのIDが正しいか確認
  const modal = new bootstrap.Modal(modalElement);

  if (openModalButton) {
    openModalButton.addEventListener("click", (event) => {
      event.preventDefault(); // デフォルトのリンク動作を無効化
      modal.show(); // モーダルを表示
    });
  }
});

document.querySelector("#itinerary-form").addEventListener("submit", (e) => {
  e.preventDefault(); // デフォルト動作をキャンセル

  fetch("/itineraries", {
    method: "POST",
    body: new FormData(e.target),
  })
    .then((response) => {
      if (response.ok) {
        alert("旅程が登録されました！");
        // モーダルを閉じる処理
        bootstrap.Modal.getInstance(document.getElementById("itineraryModal")).hide();
      } else {
        response.json().then((data) => {
          alert("エラー: " + data.errors.join(", "));
        });
      }
    })
    .catch((error) => console.error("Error:", error));
});