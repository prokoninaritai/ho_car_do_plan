document.addEventListener("turbo:load", () => {
  // 日程作成モーダルを開くボタンをクリックした際の処理
  const openModalButton = document.querySelector(".open-itinerary-modal");
  const modalElement = document.getElementById("itineraryModal");

  if (openModalButton && modalElement) {
    const modal = new bootstrap.Modal(modalElement);
    openModalButton.addEventListener("click", (event) => {
      event.preventDefault();
      modal.show();
    });
  } else {
    console.error("モーダルまたはボタンが見つかりません");
  }

  // フォーム送信処理
  const formElement = document.querySelector("#itinerary-form");
  if (formElement) {
    formElement.addEventListener("submit", (e) => {
      e.preventDefault();

      fetch("/itineraries", {
        method: "POST",
        body: new FormData(e.target),
      })
        .then((response) => {
          if (response.ok) {
            alert("旅程が登録されました！");
            bootstrap.Modal.getInstance(modalElement).hide();
          } else {
            response.json().then((data) => {
              alert("エラー: " + data.errors.join(", "));
            });
          }
        })
        .catch((error) => console.error("Error:", error));
    });
  } else {
    console.error("フォームが見つかりません");
  }
});