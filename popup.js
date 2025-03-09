document.addEventListener("DOMContentLoaded", () => {
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

  const claimDetailTitle = document.getElementById("claim-detail-title")
  const claimDetailContent = document.getElementById("claim-detail-content")
  const claimScoreValue = document.getElementById("claim-score-value")
  const claimScoreBar = document.getElementById("claim-score-bar")
  const claimScoreDescription = document.getElementById("claim-score-description")

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

  if (
    localStorage.getItem("darkMode") === "true" ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches && localStorage.getItem("darkMode") === null)
  ) {
    document.body.classList.add("dark")
  }

  themeToggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark")
    localStorage.setItem("darkMode", document.body.classList.contains("dark"))
  })

  function formatTimestamp(timestamp) {
    const now = Date.now()
    const diff = now - timestamp

    if (diff < 60000) {
      return "Just now"
    }

    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000)
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`
    }

    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000)
      return `${hours} hour${hours > 1 ? "s" : ""} ago`
    }

    const date = new Date(timestamp)
    return date.toLocaleDateString()
  }

  function formatUrl(url) {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname
    } catch (e) {
      return url
    }
  }

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
        loadingOverlay.style.display = "none"

        updateBiasStuff(data.score, data.label, data.analysis, data.factScore, data.factExplanation, data.references)

        //updateScore(data.score || 35)

        if (data["Bias Score"] !== undefined) {
          updateBiasScore(
            data["Bias Score"],
            data.analysis?.verdict || "Unknown",
            data.analysis?.explanation || "No explanation available.",
          )
        }

        console.log("Analysis:", data.analysis)
      })
      .catch((error) => {
        console.error("Error sending data to Python backend:", error)
        loadingOverlay.style.display = "none"
        updateScore(35)

        updateBiasScore(50, "Unable to analyze", "Could not connect to the bias detection service.")
      })
  }

  if (typeof chrome !== "undefined" && chrome.runtime) {
    chrome.runtime.sendMessage({ action: "getSelectedText" }, (response) => {
      if (response && response.text) {
        selectedTextElement.textContent = `"${response.text}"`

        if (response.sourceUrl) {
          sourceUrlElement.textContent = `Source: ${formatUrl(response.sourceUrl)}`
        }

        if (response.timestamp) {
          timestampElement.textContent = formatTimestamp(response.timestamp)
        }

        homeScreen.classList.remove("active")
        resultsScreen.classList.add("active")

        loadingOverlay.style.display = "flex"

        sendToPythonBackend(response.text)
      }
    })
  }

  demoButton.addEventListener("click", () => {
    homeScreen.classList.remove("active")
    resultsScreen.classList.add("active")

    const demoText = "Global temperatures have not increased in the last decade, according to some scientists."
    selectedTextElement.textContent = `"${demoText}"`

    loadingOverlay.style.display = "flex"

    sendToPythonBackend(demoText)
  })

  backButton.addEventListener("click", () => {
    resultsScreen.classList.remove("active")
    homeScreen.classList.add("active")

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



  function showClaimDetail(claimId) {
    const claim = claimData[claimId]

    claimDetailTitle.textContent = `Claim ${claimId}`
    claimDetailContent.textContent = `"${claim.text}"`

    updateClaimScore(claim.score)

    document.getElementById("claim-analysis").querySelector("p").textContent = claim.analysis
    document.getElementById("source-credibility").querySelector("p").textContent = claim.sourceCredibility
    document.getElementById("missing-context").querySelector("p").textContent = claim.missingContext

    resultsScreen.classList.remove("active")
    claimDetailScreen.classList.add("active")

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

  const analysisHeaders = document.querySelectorAll(".analysis-header")

  analysisHeaders.forEach((header) => {
    header.addEventListener("click", function () {
      const targetId = this.getAttribute("data-toggle")
      const content = document.getElementById(targetId)

      const isExpanded = this.getAttribute("aria-expanded") === "true"
      this.setAttribute("aria-expanded", !isExpanded)

      if (content.classList.contains("active")) {
        content.classList.remove("active")
      } else {
        content.classList.add("active")
      }
    })

    header.setAttribute("aria-expanded", "false")
  })

  //start of stuff
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

    let formattedRefs = "No references available.";

    function convertToHyperlink(text) {
      const urlPattern = /(https?:\/\/[^\s]+)/g;

      return text.replace(urlPattern, match => {
        return `<a href="${match}" target="_blank" rel="noopener noreferrer" style="color:rgb(167, 201, 255);">${match}</a>`;
      });
    }
    
    if (references) {
      if (Array.isArray(references)) {
        formattedRefs = references
          .filter(ref => ref && ref.trim())
          .map(ref => {
            const linkified = convertToHyperlink(ref.trim());
            return `<p style="margin-bottom: 20px;">${linkified}</p>`;
          })
          .join('');
      } 
      else if (typeof references === 'string') {
        const refsArray = references.split(/\n+/);
        formattedRefs = refsArray
          .filter(ref => ref && ref.trim())
          .map(ref => {
            const linkified = convertToHyperlink(ref.trim());
            return `<p style="margin-bottom: 20px;">${linkified}</p>`;
          })
          .join('');
      }
      else if (typeof references === 'object') {
        try {
          const refsStr = JSON.stringify(references);
          formattedRefs = `<p style="margin-bottom: 20px;">${convertToHyperlink(refsStr)}</p>`;
        } catch (e) {
          console.error("Could not format references object:", e);
        }
      }
    }
    
    content2.innerHTML = formattedRefs;
  
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
  
    scoreBar.style.width = "0%"
    setTimeout(() => {
      scoreBar.style.width = `${score}%`
    }, 100)
    
    factBar.style.width = "0%"
    setTimeout(() => {
      factBar.style.width = `${factscore}%`
    }, 100)
  }
  //end of stuff

  function updateScore(score) {
    const scoreValue = document.getElementById("score-value")
    const scoreBar = document.getElementById("score-bar")
    const scoreDescription = document.getElementById("score-description")

    scoreValue.textContent = `${score}/100`

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

    scoreBar.style.width = "0%"
    setTimeout(() => {
      scoreBar.style.width = `${score}%`
    }, 100)
  }

  function updateClaimScore(score) {
    claimScoreValue.textContent = `${score}/100`

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

    claimScoreBar.style.width = "0%"
    setTimeout(() => {
      claimScoreBar.style.width = `${score}%`
    }, 100)
  }

  function updateBiasScore(score, verdict, explanation) {
    const biasScoreValue = document.getElementById("bias-score-value")
    const biasScoreBar = document.getElementById("bias-score-bar")
    const biasScoreVerdict = document.getElementById("bias-score-verdict")
    const biasScoreExplanation = document.getElementById("bias-score-explanation")

    biasScoreValue.textContent = `${score}/100`
    biasScoreVerdict.textContent = verdict
    biasScoreExplanation.textContent = explanation

    if (score < 33) {
      biasScoreBar.style.background = "linear-gradient(90deg, #10b981, #4361ee)"
    } else if (score < 66) {
      biasScoreBar.style.background = "linear-gradient(90deg, #f59e0b, #10b981)"
    } else {
      biasScoreBar.style.background = "linear-gradient(90deg, #ef4444, #f59e0b)"
    }

    biasScoreBar.style.width = "0%"
    setTimeout(() => {
      biasScoreBar.style.width = `${score}%`
    }, 100)
  }
})