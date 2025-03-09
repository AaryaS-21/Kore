chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "koreFactCheck",
    title: "Check with Kore",
    contexts: ["selection"],
  })
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "koreFactCheck" && info.selectionText) {
    // Store the selected text
    chrome.storage.local.set({
      selectedText: info.selectionText,
      sourceUrl: tab.url,
      timestamp: Date.now(),
    })

    chrome.action.openPopup()
    
    chrome.tabs.sendMessage(tab.id, {
      action: "checkFacts",
      text: info.selectionText
    }).catch(error => {
      console.log("Error sending message to content script:", error)
    })
  }
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getSelectedText") {
    chrome.storage.local.get(["selectedText", "sourceUrl", "timestamp"], (data) => {
      sendResponse({
        text: data.selectedText || "",
        sourceUrl: data.sourceUrl || "",
        timestamp: data.timestamp || 0,
      })
    })
    return true
  }

  if (request.action === "clearSelectedText") {
    chrome.storage.local.remove(["selectedText", "sourceUrl", "timestamp"], () => {
      sendResponse({ success: true })
    })
    return true
  }
  
  if (request.action === "factCheckResults") {
    console.log("Received fact check results:", request.results)
    chrome.storage.local.set({
      factCheckResults: request.results
    })
  }
  
  if (request.action === "factCheckError") {
    console.error("Fact check error:", request.error)
  }
})