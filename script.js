
"use strict";

/* =========================================
   SENTINELX SOCIALSHIELD
   Browser-only educational prototype
========================================= */

const $ = (id) => document.getElementById(id);

const historyItems = [];
const MAX_HISTORY = 8;

/* Safely display text as plain text, not HTML. */
function setText(id, value) {
  const element = $(id);
  if (element) element.textContent = value;
}

/* Keep scores inside the 0–100 range. */
function clampScore(score) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

/* Map scores to a preliminary warning level. */
function getLevel(score) {
  if (score >= 60) return "high";
  if (score >= 30) return "medium";
  return "low";
}

function getLevelLabel(level) {
  return {
    low: "FEWER WARNING SIGNS",
    medium: "REVIEW CAREFULLY",
    high: "MULTIPLE WARNING SIGNS"
  }[level];
}

/* Display result and its explanation. */
function showResult(prefix, score, title, summary, signals) {
  const level = getLevel(score);

  const result = $(prefix + "Result");
  const badge = $(prefix + "Badge");

  result.classList.remove("hidden");
  badge.className = "result-badge " + level;
  badge.textContent = getLevelLabel(level);

  setText(prefix + "Score", score + " / 100");
  setText(prefix + "Title", title);
  setText(prefix + "Summary", summary);

  const list = $(prefix + "Signals");
  list.replaceChildren();

  signals.forEach((signal) => {
    const item = document.createElement("li");
    item.textContent = signal;
    list.appendChild(item);
  });

  result.scrollIntoView({
    behavior: "smooth",
    block: "nearest"
  });

  return level;
}

/* =========================================
   RECENT REVIEW HISTORY
========================================= */

function addHistory(type, item, score) {
  historyItems.unshift({
    type,
    item,
    score,
    time: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    })
  });

  if (historyItems.length > MAX_HISTORY) {
    historyItems.pop();
  }

  renderHistory();
}

function renderHistory() {
  const body = $("historyBody");
  body.replaceChildren();

  if (historyItems.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = 4;
    cell.className = "empty-state";
    cell.textContent =
      "No reviews yet. Try one of the checks above.";

    row.appendChild(cell);
    body.appendChild(row);
    return;
  }

  historyItems.forEach((entry) => {
    const row = document.createElement("tr");

    const typeCell = document.createElement("td");
    typeCell.textContent = entry.type;

    const itemCell = document.createElement("td");
    itemCell.textContent = entry.item;

    const scoreCell = document.createElement("td");
    const chip = document.createElement("span");
    chip.className = "score-chip " + getLevel(entry.score);
    chip.textContent = entry.score + " / 100";
    scoreCell.appendChild(chip);

    const timeCell = document.createElement("td");
    timeCell.textContent = entry.time;

    row.append(typeCell, itemCell, scoreCell, timeCell);
    body.appendChild(row);
  });
}

$("clearHistory").addEventListener("click", () => {
  historyItems.length = 0;
  renderHistory();
});

/* =========================================
   1. SOCIAL ACCOUNT WARNING-SIGNAL CHECK
========================================= */

$("accountForm").addEventListener("submit", (event) => {
  event.preventDefault();

  let score = 0;
  const signals = [];

  const profileValue = $("profileUrl").value.trim();
  const accountAge = $("accountAge").value;
  const photoStatus = $("photoStatus").value;
  const bioText = $("bioText").value.trim().toLowerCase();
  const impersonation = $("impersonation").checked;
  const moneyRequest = $("moneyRequest").checked;

  if (profileValue) {
    try {
      const profile = new URL(profileValue);

      if (!["http:", "https:"].includes(profile.protocol)) {
        signals.push("The profile URL uses an unusual protocol.");
        score += 20;
      } else {
        signals.push("A profile URL was provided; this prototype does not visit it.");
      }
    } catch {
      signals.push("The profile URL format appears invalid.");
      score += 15;
    }
  } else {
    signals.push("No profile URL provided; fewer details are available.");
  }

  if (accountAge === "new") {
    score += 15;
    signals.push("The account is reported as recently created.");
  } else if (accountAge === "old") {
    signals.push("The account is reported as older; age alone does not prove trust.");
  } else {
    signals.push("Account age is unknown.");
  }

  if (photoStatus === "copied") {
    score += 20;
    signals.push("The profile photo may be copied or reused.");
  } else if (photoStatus === "normal") {
    signals.push("No obvious photo concern was reported; this is not verification.");
  } else {
    signals.push("Photo status is unknown.");
  }

  if (impersonation) {
    score += 25;
    signals.push("You suspect the account may be impersonating someone.");
  }

  if (moneyRequest) {
    score += 35;
    signals.push("Unexpected money, OTP, or urgent-action requests are a serious warning sign.");
  }

  const bioPatterns = [
    {
      pattern: /\b(otp|one.time.password|verification code)\b/,
      message: "The bio mentions an OTP or verification code."
    },
    {
      pattern: /\b(gift card|send money|wire transfer|crypto payment)\b/,
      message: "The bio mentions a payment-related phrase that deserves review."
    },
    {
      pattern: /\b(account suspended|account blocked|urgent action)\b/,
      message: "The bio uses urgent account-related wording."
    },
    {
      pattern: /\b(official support|customer support|help desk)\b/,
      message: "Support-related claims should be verified through the organisation's official website."
    }
  ];

  bioPatterns.forEach(({ pattern, message }) => {
    if (pattern.test(bioText)) {
      score += 10;
      signals.push(message);
    }
  });

  score = clampScore(score);

  let title = "Review the account carefully";
  let summary =
    "The score reflects only the warning signs entered into this form.";

  if (score >= 60) {
    title = "Several warning signs were reported";
    summary =
      "Pause before interacting. Verify the account through a separate trusted channel.";
  } else if (score >= 30) {
    title = "Some warning signs need attention";
    summary =
      "Review the listed signals and independently verify the account.";
  } else {
    title = "Few warning signs were entered";
    summary =
      "A low score does not mean the account is genuine or safe.";
  }

  showResult("account", score, title, summary, signals);

  addHistory(
    "Account",
    profileValue || "Profile details",
    score
  );
});

/* =========================================
   2. PHISHING URL WARNING CHECKER
========================================= */

function inspectUrl(rawValue) {
  const signals = [];
  let score = 0;
  let parsedUrl;

  const value = rawValue.trim();

  if (!value) {
    return {
      valid: false,
      score: 0,
      signals: ["Enter a URL to check."]
    };
  }

  if (/\s/.test(value)) {
    return {
      valid: false,
      score: 0,
      signals: ["The URL contains spaces. Check that you pasted the complete link."]
    };
  }

  /* Parse the URL without opening it or sending it anywhere. */
  try {
    const candidate = /^https?:\/\//i.test(value)
      ? value
      : "https://" + value;

    parsedUrl = new URL(candidate);
  } catch {
    return {
      valid: false,
      score: 0,
      signals: ["This does not look like a valid web URL."]
    };
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return {
      valid: false,
      score: 0,
      signals: ["Only HTTP and HTTPS web URLs are supported."]
    };
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  const fullUrl = parsedUrl.href.toLowerCase();

  if (!hostname || !hostname.includes(".")) {
    score += 20;
    signals.push("The hostname is unusual or incomplete.");
  }

  if (parsedUrl.username || parsedUrl.password) {
    score += 25;
    signals.push("The URL contains text before the @ symbol that may disguise the destination.");
  }

  if (hostname.startsWith("xn--") || hostname.includes(".xn--")) {
    score += 20;
    signals.push("The domain contains an internationalised/punycode label. Check for look-alike characters.");
  }

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
    score += 20;
    signals.push("The destination uses an IP address instead of a familiar domain name.");
  }

  if (hostname.split(".").length >= 5) {
    score += 10;
    signals.push("The domain has many subdomain levels. Verify the actual registered domain.");
  }

  if (hostname.length > 35) {
    score += 10;
    signals.push("The hostname is unusually long. Read it carefully.");
  }

  if (parsedUrl.protocol === "http:") {
    score += 10;
    signals.push("The link uses HTTP rather than encrypted HTTPS.");
  }

  const suspiciousTerms = [
    "verify-account",
    "account-verify",
    "login-secure",
    "secure-login",
    "password-reset",
    "free-gift",
    "claim-prize",
    "wallet-connect",
    "urgent-verify"
  ];

  if (suspiciousTerms.some((term) => fullUrl.includes(term))) {
    score += 15;
    signals.push("The URL contains wording commonly used in deceptive login, prize, or verification links.");
  }

  const riskyExtensions = [
    ".zip", ".exe", ".scr", ".apk", ".msi", ".bat"
  ];

  if (riskyExtensions.some((ext) =>
    parsedUrl.pathname.toLowerCase().endsWith(ext)
  )) {
    score += 20;
    signals.push("The URL appears to point to a potentially risky downloadable file.");
  }

  if (parsedUrl.hostname.split(".").some((label) => label.length > 30)) {
    score += 10;
    signals.push("A domain label is unusually long.");
  }

  if (signals.length === 0) {
    signals.push("No configured warning pattern was detected.");
    signals.push("This does not establish that the website is safe.");
  }

  return {
    valid: true,
    hostname,
    score: clampScore(score),
    signals
  };
}

$("phishingForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const rawValue = $("phishingUrl").value;
  const result = inspectUrl(rawValue);

  if (!result.valid) {
    showResult(
      "phishing",
      0,
      "URL needs to be checked",
      "We could not complete the pattern check. Review the input and try again.",
      result.signals
    );
    return;
  }

  const score = result.score;

  let title = "No configured warning pattern detected";
  let summary =
    "This is only a basic browser-side check. Do not treat this result as a safety guarantee.";

  if (score >= 60) {
    title = "Multiple URL warning signs";
    summary =
      "Avoid opening the link until you independently verify its destination.";
  } else if (score >= 30) {
    title = "Review this URL carefully";
    summary =
      "Some patterns deserve attention. Verify the domain using a trusted source.";
  }

  showResult("phishing", score, title, summary, result.signals);

  addHistory("URL", result.hostname, score);
});

/* Initialise the activity table on page load. */
renderHistory();

console.log("SentinelX SocialShield is ready.");
