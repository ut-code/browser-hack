// ===== 割引コード設定 =====
const validCode = "f3s8ijm1e";
const discountRate = 0.3;

const popup = document.getElementById("popup");
const discountBtn = document.getElementById("Discount");
const applyBtn = document.getElementById("applyDiscount");
const closeBtn = document.getElementById("closePopup");
const message = document.getElementById("discountMessage");
const input = document.getElementById("discountInput");
const priceTag = document.querySelector(".price");

let originalPrice = 19000;

// ===== ポップアップ表示 =====
discountBtn.addEventListener("click", () => {
  popup.style.display = "flex";
  message.textContent = "";
  input.value = "";
});

// ===== ポップアップを閉じる =====
closeBtn.addEventListener("click", () => {
  popup.style.display = "none";
});

// ===== 割引適用処理 =====
applyBtn.addEventListener("click", () => {
  const code = input.value.trim();
  if (code === validCode) {
    const discounted = Math.floor(originalPrice * (1 - discountRate));
    priceTag.textContent = `￥${discounted.toLocaleString()}-(税込)`;
    message.style.color = "green";
    message.textContent = "30%割引が適用されました！";
  } else {
    message.style.color = "red";
    message.textContent = "無効なコードです。";
  }
});
