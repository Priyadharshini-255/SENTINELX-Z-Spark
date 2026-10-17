
"use strict";

/* =====================================
   SENTINELX - COMPLETE WEBSITE JAVASCRIPT
   ===================================== */

const DEMO_OTP = "482916";
const STORAGE_KEY = "sentinelXDemoReports";

let alarmContext = null;
let alarmTimer = null;
let alarmCount = 0;

/* ---------- WEBSITE NAVIGATION ---------- */

function showView(viewId) {
  const target = document.getElementById(viewId);

  if (!target) {
    console.warn("Page not found:", viewId);
    return;
  }

  document.querySelectorAll(".view").forEach(view => {
    view.classList.toggle("active", view.id === viewId);
  });

  const nav = document.getElementById("navLinks");
  if (nav) nav.classList.remove("active");

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function toggleMenu() {
  document.getElementById("navLinks")?.classList.toggle("active");
}

/* Compatibility with older buttons */
function openService(serviceId) {
  if (document.getElementById(serviceId)) {
    showView(serviceId);
  }
}

/* ---------- 1. FAKE ID DETECTOR ---------- */

function checkFakeProfile() {
  const username =
    document.getElementById("profileUsername").value.trim();

  const followersValue =
    document.getElementById("profileFollowers").value;

  const followingValue =
    document.getElementById("profileFollowing").value;

  const ageValue =
    document.getElementById("profileAge").value;

  const result = document.getElementById("profileResult");

  if (!username) {
    showResult(result, "Please enter a username.", "warning");
    return;
  }

  const followers = Number(followersValue || 0);
  const following = Number(followingValue || 0);
  const age = Number(ageValue || 0);

  if (
    !Number.isFinite(followers) ||
    !Number.isFinite(following) ||
    !Number.isFinite(age) ||
    followers < 0 || following < 0 || age < 0
  ) {
    showResult(result, "Enter valid, non-negative numbers.", "warning");
    return;
  }

  const reasons = [];

  if (followers === 0 && following > 100) {
    reasons.push("No followers but many accounts followed.");
  }

  if (following > 0 && following > Math.max(followers, 1) * 10) {
    reasons.push("Following is much higher than followers.");
  }

  if (age > 0 && age < 30) {
    reasons.push("The account may be very new.");
  }

  if (reasons.length > 0) {
    showResult(
      result,
      "CAUTION: " + reasons.join(" ") +
      " Verify the profile independently. These signs do not prove it is fake.",
      "warning"
    );
  } else {
    showResult(
      result,
      "No warning signs were detected by these basic checks. " +
      "This does not prove the profile is genuine.",
      "success"
    );
  }
}

/* ---------- COMMON RESULT MESSAGE ---------- */

function showResult(element, message, type) {
  if (!element) return;

  element.textContent = message;
  element.className = "result " + type;
}

/* ---------- 2. AI PHOTO MISUSE ---------- */

function openReportingResource(platform) {
  const resources = {
    instagram: "https://help.instagram.com/",
    facebook: "https://www.facebook.com/help/",
    youtube: "https://support.google.com/youtube/",
    stopncii: "https://stopncii.org/",
    cybercrime: "https://cybercrime.gov.in/"
  };

  if (!resources[platform]) {
    alert("Reporting resource not found.");
    return;
  }

  window.open(
    resources[platform],
    "_blank",
    "noopener,noreferrer"
  );
}

/* ---------- 3. OTP & BANK FRAUD ---------- */

/* Stops any active demo alarm. */
function stopFraudAlarm() {
  if (alarmTimer !== null) {
    clearTimeout(alarmTimer);
    alarmTimer = null;
  }

  if (alarmContext) {
    const context = alarmContext;
    alarmContext = null;

    if (context.state !== "closed") {
      context.close().catch(() => {});
    }
  }

  alarmCount = 0;
}

/* Plays eight short warning beeps. */
function playFraudAlarm() {
  stopFraudAlarm();

  const AudioContextClass =
    window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) {
    alert("Warning! Audio is unavailable. Please verify the situation.");
    return;
  }

  try {
    alarmContext = new AudioContextClass();
  } catch (error) {
    alert("Could not start the alarm.");
    return;
  }

  const context = alarmContext;
  alarmCount = 0;

  context.resume().then(() => {
    if (alarmContext !== context) return;

    function beep() {
      if (
        alarmContext !== context ||
        context.state === "closed"
      ) {
        return;
      }

      if (alarmCount >= 8) {
        stopFraudAlarm();
        return;
      }

      try {
        const oscillator = context.createOscillator();
        const gain = context.createGain();

        oscillator.type = "sawtooth";
        oscillator.frequency.value = 880;
        gain.gain.value = 0.12;

        oscillator.connect(gain);
        gain.connect(context.destination);

        oscillator.start();
        oscillator.stop(context.currentTime + 0.16);

        alarmCount++;
        alarmTimer = setTimeout(beep, 280);
      } catch (error) {
        stopFraudAlarm();
      }
    }

    beep();
  }).catch(() => {
    stopFraudAlarm();
    alert("Audio could not start. Please verify manually.");
  });
}

/* Checks only the fixed demonstration OTP. */
function checkDemoOtp() {
  const entered =
    document.getElementById("demoOtp").value.trim();

  const result = document.getElementById("otpAlert");

  if (!/^\d{6}$/.test(entered)) {
    stopFraudAlarm();

    showResult(
      result,
      "Enter a six-digit demo OTP.",
      "warning"
    );
    return;
  }

  if (entered !== DEMO_OTP) {
    showResult(
      result,
      "DEMO WARNING: OTP mismatch detected! " +
      "This simulated alarm does not prove real fraud.",
      "warning"
    );

    playFraudAlarm();
  } else {
    stopFraudAlarm();

    showResult(
      result,
      "Demo OTP matched. This does not verify a real bank OTP or transaction.",
      "success"
    );
  }
}

/* Banking situation guidance. */
function analyseFraud() {
  const situation =
    document.getElementById("fraudSituation").value;

  const result = document.getElementById("fraudAdvice");

  const advice = {
    otp:
      "Never share an OTP with a caller. End the conversation and contact your bank using its official app or phone number.",

    money:
      "Contact your bank immediately about the unauthorised debit. In India, call 1930 promptly and report through the official cybercrime portal.",

    call:
      "End suspicious calls. Never share an OTP, PIN or password. Verify claims using your bank's official contact details.",

    link:
      "Stop entering details on the suspicious page. If you submitted banking information, contact your bank immediately and secure your account through official channels."
  };

  if (!advice[situation]) {
    showResult(result, "Please select a situation first.", "warning");
    return;
  }

  result.replaceChildren();
  result.className = "result warning";

  const message = document.createElement("p");
  message.textContent = advice[situation];

  const link = document.createElement("a");
  link.href = "https://cybercrime.gov.in/";
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "Open official Cyber Crime Portal ↗";

  result.append(message, link);

  if (situation === "money" || situation === "otp") {
    playFraudAlarm();
  } else {
    stopFraudAlarm();
  }
}

/* ---------- 4. LINK ATTACK CHECKER ---------- */

function scanSuspiciousLink() {
  const input =
    document.getElementById("linkInput").value.trim();

  const result = document.getElementById("linkResult");

  if (!input) {
    showResult(result, "Please enter a website URL.", "warning");
    return;
  }

  let url;

  try {
    const prepared =
      /^https?:\/\//i.test(input)
        ? input
        : "https://" + input;

    url = new URL(prepared);
  } catch (error) {
    showResult(
      result,
      "Invalid URL. Please check the address.",
      "warning"
    );
    return;
  }

  if (
    !["https:", "http:"].includes(url.protocol) ||
    !url.hostname
  ) {
    showResult(result, "Unsupported or invalid URL.", "warning");
    return;
  }

  const host = url.hostname.toLowerCase();
  const fullURL = url.href.toLowerCase();
  const warnings = [];

  if (url.protocol !== "https:") {
    warnings.push("The URL does not use HTTPS.");
  }

  if (url.username || url.password) {
    warnings.push("The URL contains unusual embedded login details.");
  }

  if (host.includes("xn--")) {
    warnings.push("The domain uses encoded characters.");
  }

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    warnings.push("The website uses an IP address instead of a domain.");
  }

  if (host.split(".").length > 4) {
    warnings.push("The URL has a long subdomain structure.");
  }

  if (
    /(login|verify|urgent|secure|banking|password|gift|prize|claim)/i
      .test(fullURL)
  ) {
    warnings.push("The URL contains words sometimes used in scam messages.");
  }

  if (warnings.length > 0) {
    showResult(
      result,
      "CAUTION: " + warnings.join(" ") +
      " Do not enter credentials until you verify the site independently.",
      "warning"
    );
  } else {
    showResult(
      result,
      "No obvious warning signs were detected. This does not mean the website is safe.",
      "success"
    );
  }
}

/* ---------- 5. NATIONWIDE SOS ---------- */

function callEmergency(number) {
  const phone = String(number).replace(/\D/g, "");

  if (!phone) {
    alert("Invalid phone number.");
    return;
  }

  window.location.href = "tel:" + phone;
}

function openNearbyPolice() {
  window.open(
    "https://www.google.com/maps/search/police+station+near+me/",
    "_blank",
    "noopener,noreferrer"
  );
}

function openCyberCrimePortal() {
  window.open(
    "https://cybercrime.gov.in/",
    "_blank",
    "noopener,noreferrer"
  );
}

function reportFinancialFraud() {
  const confirmed = confirm(
    "If you lost money in online financial fraud, contact your bank immediately and call 1930 promptly. Open the official cybercrime portal?"
  );

  if (confirmed) openCyberCrimePortal();
}

/* ---------- 6. DIGITAL SAFETY CENTRE ---------- */

/* Read reports stored in this browser. */
function getReports() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return [];

    const reports = JSON.parse(saved);
    return Array.isArray(reports) ? reports : [];
  } catch (error) {
    console.warn("Could not read demo reports:", error);
    return [];
  }
}

/* Display report history safely. */
function displayReports() {
  const history = document.getElementById("reportHistory");
  if (!history) return;

  history.replaceChildren();

  const reports = getReports();

  if (reports.length === 0) {
    history.textContent = "No demo reports created yet.";
    return;
  }

  reports.forEach(report => {
    const card = document.createElement("article");
    card.className = "report-card";

    const heading = document.createElement("strong");
    heading.textContent = report.reference;

    const type = document.createElement("p");
    type.textContent = "Type: " + report.type;

    const description = document.createElement("p");
    description.textContent = "Description: " + report.description;

    const date = document.createElement("small");
    date.textContent = "Created: " + report.date;

    const note = document.createElement("p");
    note.textContent = "Demo only. Not sent to any authority.";

    card.append(heading, type, description, date, note);
    history.appendChild(card);
  });
}

/* Create one demo report per form submission. */
function handleIncidentSubmit(event) {
  event.preventDefault();

  const type = document.getElementById("incidentType").value;
  const description =
    document.getElementById("incidentDescription").value.trim();

  const result = document.getElementById("incidentResult");

  if (!type || !description) {
    showResult(result, "Please complete all fields.", "warning");
    return;
  }

  const report = {
    reference: "SX-" + Date.now().toString().slice(-8),
    type: type,
    description: description,
    date: new Date().toLocaleString()
  };

  const reports = getReports();
  reports.unshift(report);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  } catch (error) {
    showResult(
      result,
      "Could not save the report in this browser.",
      "warning"
    );
    return;
  }

  showResult(
    result,
    "Demo report created: " + report.reference +
    ". It has NOT been sent to any authority.",
    "success"
  );

  document.getElementById("incidentForm").reset();
  displayReports();
}

function clearReports() {
  if (!confirm("Delete all demo reports saved in this browser?")) {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
    displayReports();

    showResult(
      document.getElementById("incidentResult"),
      "Demo report history cleared.",
      "success"
    );
  } catch (error) {
    alert("Could not clear report history.");
  }
}

/* ---------- INITIALIZE WEBSITE ---------- */

document.addEventListener("DOMContentLoaded", function () {
  const year = document.getElementById("currentYear");

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  document.getElementById("checkDemoOtp")
    ?.addEventListener("click", checkDemoOtp);

  document.getElementById("stopAlarm")
    ?.addEventListener("click", stopFraudAlarm);

  document.getElementById("analyseFraud")
    ?.addEventListener("click", analyseFraud);

  document.getElementById("incidentForm")
    ?.addEventListener("submit", handleIncidentSubmit);

  document.getElementById("clearReportsBtn")
    ?.addEventListener("click", clearReports);

  displayReports();

  console.log("SentinelX website loaded successfully.");
});
