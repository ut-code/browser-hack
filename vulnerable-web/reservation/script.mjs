// --- 設定 ---
const ADMIN_PASSWORD = "GekiA2Rock"; // 管理者パスワード

// --- ページ判定 ---
const path = window.location.pathname;

if (path.includes("admin")) {
  initAdminPage();
} else{
  initUserPage();
}

// --- 管理者ページ処理 ---
function initAdminPage() {
  const loginBtn = document.getElementById("login-btn");
  const loginMsg = document.getElementById("login-msg");
  const adminPanel = document.getElementById("admin-panel");
  const loginSection = document.getElementById("admin-login");
  const toggleBtn = document.getElementById("toggle-ticket");
  const ticketState = document.getElementById("ticket-state");

  // ロード時にパネルは完全非表示
  adminPanel.style.display = "none";

  loginBtn?.addEventListener("click", () => {
    const input = document.getElementById("admin-pass").value.trim();
    if (input === ADMIN_PASSWORD) {
      loginMsg.textContent = "ログイン成功しました";
      loginMsg.style.color = "lightgreen";

      // ログインフォーム非表示、パネル表示
      loginSection.style.display = "none";
      adminPanel.style.display = "block";
      adminPanel.classList.remove("hidden");
      updateTicketStateText();
    } else {
      loginMsg.textContent = "パスワードが違います";
      loginMsg.style.color = "tomato";
    }
  });

  toggleBtn?.addEventListener("click", () => {
    const current = localStorage.getItem("ticketOpen") === "true";
    localStorage.setItem("ticketOpen", (!current).toString());
    updateTicketStateText();
  });

  function updateTicketStateText() {
    const open = localStorage.getItem("ticketOpen") === "true";
    ticketState.textContent = open
      ? "現在チケット予約は解禁中です。"
      : "現在チケット予約は停止中です。";
    toggleBtn.textContent = open
      ? "チケット予約を停止する"
      : "チケット予約を解禁する";
  }
}

// --- 一般ページ処理 ---
function initUserPage() {
  const open = localStorage.getItem("ticketOpen") === "true";
  const ticketStatus = document.getElementById("ticket-status");
  const ticketForm = document.getElementById("ticket-form");

  if (open) {
    ticketStatus.textContent = "チケット予約を受付中です！";
    ticketStatus.classList.remove("off");
    ticketStatus.classList.add("on");
    ticketForm.classList.remove("hidden");
  } else {
    ticketStatus.textContent = "現在チケット予約は受付を停止しています。";
    ticketStatus.classList.remove("on");
    ticketStatus.classList.add("off");
    ticketForm.classList.add("hidden");
  }

  ticketForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    alert("予約を受け付けました！");
    ticketForm.reset();
  });
}
