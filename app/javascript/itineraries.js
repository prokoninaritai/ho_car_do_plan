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