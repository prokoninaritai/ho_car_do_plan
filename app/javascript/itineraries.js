document.addEventListener("turbo:load", () => {
  const modal = document.getElementById("itinerary-modal");
  const openModalButton = document.getElementById("open-itinerary-modal");
  const closeModalButton = document.getElementById("close-itinerary-modal");
  const form = document.getElementById("itinerary-form");

  // モーダルを開く
  openModalButton.addEventListener("click", () => {
    modal.style.display = "block";
  });

  // モーダルを閉じる
  closeModalButton.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // モーダルの外側をクリックした場合に閉じる
  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });

  // フォーム送信時の処理
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const formData = new FormData(form);

    fetch("/itineraries", {
      method: "POST",
      headers: {
        "X-CSRF-Token": document.querySelector("meta[name='csrf-token']").content,
      },
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          alert("日程が登録されました！");
          modal.style.display = "none";
        } else {
          alert(data.errors.join(", "));
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  });
});