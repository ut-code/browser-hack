chrome.runtime.onInstalled.addListener(() => {
  console.log("拡張機能がインストールされました！");
});

// ツールバーアイコンをクリックしたときにサイドパネルを開く
chrome.action.onClicked.addListener(async (tab) => {
  await chrome.sidePanel.open({ windowId: tab.windowId, tabId: tab.id });
});
