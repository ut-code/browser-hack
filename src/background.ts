chrome.runtime.onInstalled.addListener(() => {
  console.log("拡張機能がインストールされました！");
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "OPEN_BOOKING") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.update(tabs[0].id, { url: msg.url });
    });
  }
});


const targetURL = 'https://browser-hack.utcode.net/'
function isTargetPage(url?: string): boolean {
  if (!url) return false
  return url.startsWith(targetURL)
}

async function updatePanelAvailability(tabId: number) {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (isTargetPage(tab.url)) {
      await chrome.sidePanel.setOptions({
        tabId,
        path: 'src/sidepanel/index.html',
        enabled: true
      });
    } else {
      await chrome.sidePanel.setOptions({
        tabId,
        enabled: false
      });
    }
  } catch (e) {
    console.log('Failed to update side panel for tab:', tabId, e);
  }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    updatePanelAvailability(tabId);
  }
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  updatePanelAvailability(tabId);
});

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));