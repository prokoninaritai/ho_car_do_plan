document.addEventListener("turbo:load", () => {
  const modal = document.getElementById("itinerary-modal");
  const openModalButton = document.getElementById("open-itinerary-modal");
  const closeModalButton = document.getElementById("close-itinerary-modal");
  const form = document.getElementById("itinerary-form");
  const errorContainer = document.getElementById("error-messages");

  // モーダルを開く
  openModalButton.addEventListener("click", () => {
    modal.classList.add("show");
    modal.style.display = "block";
  });

  // モーダルを閉じる
  closeModalButton.addEventListener("click", () => {
    closeModal();
  });

  // モーダルの外側をクリックした場合に閉じる
  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  // モーダルを閉じる関数
  function closeModal() {
    modal.classList.remove("show");
    modal.style.display = "none";
  }

  // フォーム送信時の処理
  form.addEventListener("submit", (e) => {
    e.preventDefault();
  
    const formData = new FormData(form);

    // フォーム送信
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
        // 正しいURLにリダイレクト
        window.location.href = `/itineraries/${data.itinerary_id}/destinations/new`
      } else {
        // エラー表示
        document.getElementById("error-messages").innerText = data.errors.join(", ");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
});

  // エラーメッセージを表示する関数
  function displayErrors(errors) {
    errorContainer.innerHTML = ""; // 既存のエラーメッセージをクリア
    errors.forEach((error) => {
      const errorItem = document.createElement("div");
      errorItem.textContent = error;
      errorItem.classList.add("error-message");
      errorContainer.appendChild(errorItem);
    });
  }
});
