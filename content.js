// Listen for text selections
document.addEventListener("mouseup", () => {
  const selectedText = window.getSelection().toString().trim()
  if (selectedText.length > 10) {
    chrome.runtime.sendMessage({
      action: "textSelected",
      text: selectedText,
    })
  }
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "checkFacts") {
    console.log("Fact checking:", request.text)

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
      chrome.runtime.sendMessage({
        action: "factCheckResults",
        results: data,
      })
    })
    .catch(error => {
      console.error('Error sending data to Python backend:', error)
      chrome.runtime.sendMessage({
        action: "factCheckError",
        error: error.message,
      })
    })

    sendResponse({ status: "processing" })
    return true
  }
})