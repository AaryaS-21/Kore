// Listen for text selections
document.addEventListener("mouseup", () => {
  const selectedText = window.getSelection().toString().trim()
  if (selectedText.length > 10) {
    // Only consider selections with some meaningful length
    chrome.runtime.sendMessage({
      action: "textSelected",
      text: selectedText,
    })
  }
})

// Listen for messages from the background script to check facts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "checkFacts") {
    // In a real implementation, you might want to show an overlay
    // indicating that fact checking is in progress
    console.log("Fact checking:", request.text)

    // Send the selected text to the Python backend
    fetch('http://localhost:5000/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: request.text }),
    })
    .then(response => response.json())
    .then(data => {
      console.log("Received from Python backend:", data)
      // Send the results back to the background script
      chrome.runtime.sendMessage({
        action: "factCheckResults",
        results: data,
      })
    })
    .catch(error => {
      console.error('Error sending data to Python backend:', error)
      // Send error message back to the background script
      chrome.runtime.sendMessage({
        action: "factCheckError",
        error: error.message,
      })
    })

    sendResponse({ status: "processing" })
    return true // Keep the message channel open for async response
  }
})