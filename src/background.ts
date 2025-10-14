chrome.runtime.onInstalled.addListener(() => {
  console.log("拡張機能がインストールされました！");
  chrome.sidePanel.setOptions({
    path: "sidepanel/index.html",
    enabled: true,
  });
});

// ツールバーアイコンをクリックしたときにサイドパネルを開く
chrome.action.onClicked.addListener(async (tab) => {
  await chrome.sidePanel.open({ windowId: tab.windowId });
});
