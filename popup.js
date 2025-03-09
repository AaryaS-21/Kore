document.addEventListener("DOMContentLoaded", () => {
  // DOM elements
  const demoButton = document.getElementById("demo-button")
  const backButton = document.getElementById("back-button")
  const backToResultsButton = document.getElementById("back-to-results-button")
  const homeScreen = document.getElementById("home-screen")
  const resultsScreen = document.getElementById("results-screen")
  const claimDetailScreen = document.getElementById("claim-detail-screen")
  const selectedTextElement = document.getElementById("selected-text-content")
  const sourceUrlElement = document.getElementById("source-url")
  const timestampElement = document.getElementById("timestamp")
  const themeToggleBtn = document.getElementById("theme-toggle-btn")
  const loadingOverlay = document.getElementById("loading-overlay")
  const claimItems = document.querySelectorAll(".claim-item")

  // Claim detail elements
  const claimDetailTitle = document.getElementById("claim-detail-title")
  const claimDetailContent = document.getElementById("claim-detail-content")
  const claimScoreValue = document.getElementById("claim-score-value")
  const claimScoreBar = document.getElementById("claim-score-bar")
  const claimScoreDescription = document.getElementById("claim-score-description")

  // Claim data (for demo purposes)
  const claimData = {
    1: {
      text: "Global temperatures have not increased in the last decade",
      score: 25,
      analysis:
        "The claim that global temperatures have not increased in the last decade is false. According to NASA and NOAA data, the last decade (2013-2023) includes the hottest years on record.",
      sourceCredibility:
        'The phrase "according to some scientists" is vague and lacks specific attribution. Reputable scientific organizations like NASA, NOAA, and the IPCC have clear data showing temperature increases.',
      missingContext:
        "While there are natural fluctuations in temperature from year to year, the long-term trend shows clear warming. Cherry-picking specific time periods can be misleading without the broader context of climate change.",
    },
    2: {
      text: "According to some scientists",
      score: 60,
      analysis:
        'The claim references "some scientists" without specifying who these scientists are or their credentials. This vague attribution makes the claim difficult to verify.',
      sourceCredibility:
        "Without naming specific scientists or studies, it's impossible to evaluate the credibility of the sources. The scientific consensus, represented by major scientific bodies, contradicts this claim.",
      missingContext:
        "The statement omits that the overwhelming majority of climate scientists (over 97%) agree that climate warming trends are extremely likely due to human activities.",
    },
    3: {
      text: "Climate change is not occurring",
      score: 80,
      analysis:
        "The implied claim that climate change is not occurring contradicts the scientific consensus and empirical evidence from multiple independent sources.",
      sourceCredibility:
        "This claim contradicts findings from NASA, NOAA, the IPCC, and virtually every major scientific organization that studies climate.",
      missingContext:
        "The statement ignores extensive evidence of climate change including rising sea levels, ocean acidification, retreating glaciers, and increasing frequency of extreme weather events.",
    },
  }

  // Check for dark mode preference
  if (
    localStorage.getItem("darkMode") === "true" ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches && localStorage.getItem("darkMode") === null)
  ) {
    document.body.classList.add("dark")
  }

  // Theme toggle
  themeToggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark")
    localStorage.setItem("darkMode", document.body.classList.contains("dark"))
  })

  // Format timestamp
  function formatTimestamp(timestamp) {
    const now = Date.now()
    const diff = now - timestamp

    // Less than a minute
    if (diff < 60000) {
      return "Just now"
    }

    // Less than an hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000)
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`
    }

    // Less than a day
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000)
      return `${hours} hour${hours > 1 ? "s" : ""} ago`
    }

    // Format as date
    const date = new Date(timestamp)
    return date.toLocaleDateString()
  }

  // Format URL
  function formatUrl(url) {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname
    } catch (e) {
      return url
    }
  }

  // Function to send data to the Python backend
  function sendToPythonBackend(text) {
    console.log("Sending to Python backend:", text)

    fetch("http://localhost:5000/process", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: text }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Received from Python backend:", data)
        // Hide loading overlay
        loadingOverlay.style.display = "none"

        //data.fact-score, fact-explanation, references

        //data.score, data.label, data.analysis
        //the stuff below is also to update facts
        updateBiasStuff(data.score, data.label, data.analysis, data.factScore, data.factExplanation, data.references)

        // Update the UI with the received data
        //updateScore(data.score || 35)

        // Update bias detection section
        if (data["Bias Score"] !== undefined) {
          updateBiasScore(
            data["Bias Score"],
            data.analysis?.verdict || "Unknown",
            data.analysis?.explanation || "No explanation available.",
          )
        }

        // You can use the data.analysis object to populate the claims if needed
        console.log("Analysis:", data.analysis)
      })
      .catch((error) => {
        console.error("Error sending data to Python backend:", error)
        // Hide loading overlay and show error or fallback to demo data
        loadingOverlay.style.display = "none"
        updateScore(35) // Fallback score

        // Set default bias score in case of error
        updateBiasScore(50, "Unable to analyze", "Could not connect to the bias detection service.")
      })
  }

  // Check if we have selected text from context menu
  if (typeof chrome !== "undefined" && chrome.runtime) {
    chrome.runtime.sendMessage({ action: "getSelectedText" }, (response) => {
      if (response && response.text) {
        // We have text from the context menu, show results screen
        selectedTextElement.textContent = `"${response.text}"`

        if (response.sourceUrl) {
          sourceUrlElement.textContent = `Source: ${formatUrl(response.sourceUrl)}`
        }

        if (response.timestamp) {
          timestampElement.textContent = formatTimestamp(response.timestamp)
        }

        homeScreen.classList.remove("active")
        resultsScreen.classList.add("active")

        // Show loading overlay
        loadingOverlay.style.display = "flex"

        // Send the selected text to the Python backend
        sendToPythonBackend(response.text)
      }
    })
  }

  demoButton.addEventListener("click", () => {
    homeScreen.classList.remove("active")
    resultsScreen.classList.add("active")

    const demoText = "Global temperatures have not increased in the last decade, according to some scientists."
    selectedTextElement.textContent = `"${demoText}"`

    // Show loading for demo
    loadingOverlay.style.display = "flex"

    // Send the demo text to the Python backend
    sendToPythonBackend(demoText)
  })

  backButton.addEventListener("click", () => {
    resultsScreen.classList.remove("active")
    homeScreen.classList.add("active")

    // Clear the selected text when going back
    if (typeof chrome !== "undefined" && chrome.runtime) {
      chrome.runtime.sendMessage({ action: "clearSelectedText" })
    }
  })

  backToResultsButton.addEventListener("click", () => {
    claimDetailScreen.classList.remove("active")
    resultsScreen.classList.add("active")
  })

  // Claim item click handlers
  claimItems.forEach((item) => {
    item.addEventListener("click", function () {
      const claimId = this.getAttribute("data-claim")
      showClaimDetail(claimId)
    })
  })

  // Show claim detail screen


  function showClaimDetail(claimId) {
    const claim = claimData[claimId]

    // Update claim detail screen content
    claimDetailTitle.textContent = `Claim ${claimId}`
    claimDetailContent.textContent = `"${claim.text}"`

    // Update claim score
    updateClaimScore(claim.score)

    // Update analysis content
    document.getElementById("claim-analysis").querySelector("p").textContent = claim.analysis
    document.getElementById("source-credibility").querySelector("p").textContent = claim.sourceCredibility
    document.getElementById("missing-context").querySelector("p").textContent = claim.missingContext

    // Show claim detail screen
    resultsScreen.classList.remove("active")
    claimDetailScreen.classList.add("active")

    // Initialize the first analysis item as open
    const analysisHeaders = claimDetailScreen.querySelectorAll(".analysis-header")
    analysisHeaders.forEach((header) => {
      header.setAttribute("aria-expanded", "false")
      const targetId = header.getAttribute("data-toggle")
      const content = document.getElementById(targetId)
      content.classList.remove("active")
    })

    const firstHeader = claimDetailScreen.querySelector(".analysis-header")
    firstHeader.setAttribute("aria-expanded", "true")
    const firstContentId = firstHeader.getAttribute("data-toggle")
    const firstContent = document.getElementById(firstContentId)
    firstContent.classList.add("active")
  }

  // Toggle analysis sections
  const analysisHeaders = document.querySelectorAll(".analysis-header")

  analysisHeaders.forEach((header) => {
    header.addEventListener("click", function () {
      const targetId = this.getAttribute("data-toggle")
      const content = document.getElementById(targetId)

      // Toggle aria-expanded attribute
      const isExpanded = this.getAttribute("aria-expanded") === "true"
      this.setAttribute("aria-expanded", !isExpanded)

      // Toggle content visibility with animation
      if (content.classList.contains("active")) {
        content.classList.remove("active")
      } else {
        content.classList.add("active")
      }
    })

    // Set initial state
    header.setAttribute("aria-expanded", "false")
  })

  //start of bitch
  function updateBiasStuff(score, label, analysis, factscore, explaination, references) {
    const scoreValue = document.getElementById("bias-value")
    const scorevalforfact = document.getElementById("score-value")
    const scoreBar = document.getElementById("bias-bar")
    const factBar = document.getElementById("score-bar")
    const scoreDescription = document.getElementById("bias-description-value")

    const factDescription = document.getElementById("score-description")

    const content1 = document.getElementById("claim-analysis")
    const content2 = document.getElementById("claim-analysis-1")

    const enterBiasDescription = document.getElementById("bias-analysis-text")

    //console.log(analysis)

    const formattedAnalysis = analysis.replace(/\* /g, "•")
    const formattedAnalysis2 = formattedAnalysis.replace(/\./g, "\n")
    enterBiasDescription.innerText = formattedAnalysis2

    score = Math.round(score)

    scoreValue.textContent = `${score}/100`

    factscore = factscore * 10
    factscore = Math.round(factscore)
    scorevalforfact.textContent = `${factscore}/100`

    if (factscore < 33) {
      factBar.style.background = "linear-gradient(90deg, #ef4444, #f59e0b)"
      factDescription.textContent = "Mostly False"
    } else if (factscore < 66) {
      factBar.style.background = "linear-gradient(90deg, #f59e0b, #10b981 " + factscore + "%)"
      factDescription.textContent = "Neutral"
    } else {
      factBar.style.background = "linear-gradient(90deg, #10b981, #4361ee " + factscore + "%)"
      factDescription.textContent = "Mostly True"
    }


    content1.innerText = explaination
    content2.innerText = references

    // Update color based on score
    if (score < 33) {
      scoreBar.style.background = "linear-gradient(90deg, #ef4444, #f59e0b)"
      scoreDescription.textContent = label
    } else if (score < 66) {
      scoreBar.style.background = "linear-gradient(90deg, #f59e0b, #10b981 " + score + "%)"
      scoreDescription.textContent = label
    } else {
      scoreBar.style.background = "linear-gradient(90deg, #10b981, #4361ee " + score + "%)"
      scoreDescription.textContent = label
    }

    // Animate the score bar
    scoreBar.style.width = "0%"
    setTimeout(() => {
      scoreBar.style.width = `${score}%`
      factBar.style.width = `${factscore}%`
    }, 100)
  }
  //end of bitch

  // Function to update main score
  function updateScore(score) {
    const scoreValue = document.getElementById("score-value")
    const scoreBar = document.getElementById("score-bar")
    const scoreDescription = document.getElementById("score-description")

    scoreValue.textContent = `${score}/100`

    // Update color based on score
    if (score < 33) {
      scoreBar.style.background = "linear-gradient(90deg, #ef4444, #f59e0b)"
      scoreDescription.textContent = "False"
    } else if (score < 66) {
      scoreBar.style.background = "linear-gradient(90deg, #f59e0b, #10b981 " + score + "%)"
      scoreDescription.textContent = "Partially True"
    } else {
      scoreBar.style.background = "linear-gradient(90deg, #10b981, #4361ee " + score + "%)"
      scoreDescription.textContent = "Mostly True"
    }

    // Animate the score bar
    scoreBar.style.width = "0%"
    setTimeout(() => {
      scoreBar.style.width = `${score}%`
    }, 100)
  }

  // Function to update claim score
  function updateClaimScore(score) {
    claimScoreValue.textContent = `${score}/100`

    // Update color based on score
    if (score < 33) {
      claimScoreBar.style.background = "linear-gradient(90deg, #ef4444, #f59e0b)"
      claimScoreDescription.textContent = "False"
    } else if (score < 66) {
      claimScoreBar.style.background = "linear-gradient(90deg, #f59e0b, #10b981 " + score + "%)"
      claimScoreDescription.textContent = "Partially True"
    } else {
      claimScoreBar.style.background = "linear-gradient(90deg, #10b981, #4361ee " + score + "%)"
      claimScoreDescription.textContent = "Mostly True"
    }

    // Animate the score bar
    claimScoreBar.style.width = "0%"
    setTimeout(() => {
      claimScoreBar.style.width = `${score}%`
    }, 100)
  }

  // Function to update bias score
  function updateBiasScore(score, verdict, explanation) {
    const biasScoreValue = document.getElementById("bias-score-value")
    const biasScoreBar = document.getElementById("bias-score-bar")
    const biasScoreVerdict = document.getElementById("bias-score-verdict")
    const biasScoreExplanation = document.getElementById("bias-score-explanation")

    biasScoreValue.textContent = `${score}/100`
    biasScoreVerdict.textContent = verdict
    biasScoreExplanation.textContent = explanation

    // Update color based on score
    if (score < 33) {
      biasScoreBar.style.background = "linear-gradient(90deg, #10b981, #4361ee)"
    } else if (score < 66) {
      biasScoreBar.style.background = "linear-gradient(90deg, #f59e0b, #10b981)"
    } else {
      biasScoreBar.style.background = "linear-gradient(90deg, #ef4444, #f59e0b)"
    }

    // Animate the score bar
    biasScoreBar.style.width = "0%"
    setTimeout(() => {
      biasScoreBar.style.width = `${score}%`
    }, 100)
  }
})