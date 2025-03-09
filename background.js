// Create context menu item when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "koreFactCheck",
    title: "Check with Kore",
    contexts: ["selection"],
  })
})

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "koreFactCheck" && info.selectionText) {
    // Store the selected text
    chrome.storage.local.set({
      selectedText: info.selectionText,
      sourceUrl: tab.url,
      timestamp: Date.now(),
    })

    // Open the popup under the extension icon
    chrome.action.openPopup()
    
    // Also send a message to the active tab to trigger fact checking
    chrome.tabs.sendMessage(tab.id, {
      action: "checkFacts",
      text: info.selectionText
    }).catch(error => {
      console.log("Error sending message to content script:", error)
    })
  }
})

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getSelectedText") {
    chrome.storage.local.get(["selectedText", "sourceUrl", "timestamp"], (data) => {
      sendResponse({
        text: data.selectedText || "",
        sourceUrl: data.sourceUrl || "",
        timestamp: data.timestamp || 0,
      })
    })
    return true // Required for async sendResponse
  }

  if (request.action === "clearSelectedText") {
    chrome.storage.local.remove(["selectedText", "sourceUrl", "timestamp"], () => {
      sendResponse({ success: true })
    })
    return true
  }
  
  // Handle results from fact checking
  if (request.action === "factCheckResults") {
    console.log("Received fact check results:", request.results)
    // You could store these results for use in the popup
    chrome.storage.local.set({
      factCheckResults: request.results
    })
  }
  
  // Handle errors from fact checking
  if (request.action === "factCheckError") {
    console.error("Fact check error:", request.error)
  }
})