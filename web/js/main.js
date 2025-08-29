var version = "1.0.0"; // Version of the application
document.title = `VRCLogger Monitor v${version}`;

// Predefined log container elements
const logsDivMain = document.getElementById("mainLogContent");
const logsDivJoinLeave = document.getElementById("joiningLeavingContent");
const logsDivModLogs = document.getElementById("moderationLogsContent");

const logsDivBlacklist = document.getElementById("detectKnownBlacklistContent");

const logsDivAvatarSwitch = document.getElementById("avatarSwitchContent");

const logsDivassets = document.getElementById("assetsContent");

function displayImageFullscreen(imageSrc) {
  const modal = document.createElement("div");
  modal.classList.add("image-modal");

  const modalContent = document.createElement("div");
  modalContent.classList.add("modal-content");

  const closeButton = document.createElement("button");
  closeButton.textContent = "X";
  closeButton.classList.add("close-button");
  closeButton.onclick = () => modal.remove();

  const fullImage = document.createElement("img");
  fullImage.src = imageSrc;
  fullImage.classList.add("full-image");

  modalContent.appendChild(closeButton);
  modalContent.appendChild(fullImage);
  modal.appendChild(modalContent);

  document.body.appendChild(modal);
}

const requestQueue = [];
let isProcessing = false;
const requestDelay = 10 * 1000; // 10 seconds delay

async function processQueue() {
  if (isProcessing || requestQueue.length === 0) return;

  isProcessing = true;
  while (requestQueue.length > 0) {
    const printId = requestQueue.shift(); // Get the next request
    await fetchPrintImage(printId);
    await new Promise(resolve => setTimeout(resolve, requestDelay)); // Wait before next request
  }
  isProcessing = false;
}

async function fetchPrintImage(printId) {
  try {
    const apiUrl = await window.api.getApiEndpoint(); // Get API URL from main process
    const response = await fetch(
      `${apiUrl}/v5/games/api/vrchat/yoinker/getPrints/${printId}`
    );
    const data = await response.json();
    console.log(data);
    imageUrl = data.data.files.image;
    displayImage(imageUrl, "Print", Date.now(), data.data);
  } catch (error) {
    console.error("Error fetching print image:", error);
  }
}

function queueFetchPrintImage(printId) {
  requestQueue.push(printId);
}

// ✅ Process queue every 10 seconds
setInterval(async () => {
  if (requestQueue.length > 0) {
    const printId = requestQueue.shift(); // Get next request
    await fetchPrintImage(printId);
  }
}, requestDelay);

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

async function displayImage(url, type, timestamp, data) {
  const tableRow = document.createElement("tr");

  const typeCell = document.createElement("td");
  typeCell.textContent = type;

  const timestampCell = document.createElement("td");
  timestampCell.textContent = formatTimestamp(timestamp);

  const userIdCell = document.createElement("td");
  userIdCell.textContent = data[1] || data.ownerId;

  const displayNameCell = document.createElement("td");
  displayNameCell.textContent = data[2] || data.ownerName;

  const imageCell = document.createElement("td");
  const image = document.createElement("img");
  image.src = url;
  image.classList.add("log-image");
  image.style.maxWidth = "50px"; // Reduce image size
  image.style.height = "50px"; // Maintain aspect ratio
  image.onclick = () => displayImageFullscreen(url);
  imageCell.appendChild(image);

  tableRow.appendChild(typeCell);
  tableRow.appendChild(timestampCell);
  tableRow.appendChild(userIdCell);
  tableRow.appendChild(displayNameCell);
  tableRow.appendChild(imageCell);

  const tableBody = document.getElementById("assetsTableBody");
  tableBody.prepend(tableRow); // Insert latest entries at the top

  const userId = data[1] || data.ownerId || "Uknown";
  const displayName = data[2] || data.ownerName || "Uknown";

  // Auto-scroll to the bottom
  tableBody.scrollTop = tableBody.scrollHeight;
}

window.addEventListener("message", (event) => {
  console.log("Received message:", event.data); // Debugging log
  let logElement;
  
  switch (event.data.type) {
    case "mainlog":
      if (!logsDivMain) {
        console.error("logsDivMain is null");
        return;
      }
      logElement = document.createElement("p");
      logElement.innerHTML = event.data.message;
      logsDivMain.appendChild(logElement);
      logsDivMain.scrollTop = logsDivMain.scrollHeight;
      break;

    case "joinleavelog":
      if (!logsDivJoinLeave) {
        console.error("logsDivJoinLeave is null");
        return;
      }
      logElement = document.createElement("p");
      logElement.innerHTML = event.data.message;
      logsDivJoinLeave.appendChild(logElement);
      logsDivJoinLeave.scrollTop = logsDivJoinLeave.scrollHeight;
      break;

    case "modlog":
      if (!logsDivModLogs) {
        console.error("logsDivModLogs is null");
        return;
      }
      logElement = document.createElement("p");
      logElement.innerHTML = event.data.message;
      logsDivModLogs.appendChild(logElement);
      logsDivModLogs.scrollTop = logsDivModLogs.scrollHeight;
      break;

    case "avatarswitchlog":
      if (!logsDivAvatarSwitch) {
        console.error("logsDivAvatarSwitch is null");
        return;
      }
      logElement = document.createElement("p");
      logElement.innerHTML = event.data.message;
      logsDivAvatarSwitch.appendChild(logElement);
      logsDivAvatarSwitch.scrollTop = logsDivAvatarSwitch.scrollHeight;
      break;

    case "blacklistlog":
      if (!logsDivBlacklist) {
        console.error("logsDivBlacklist is null");
        return;
      }
      logElement = document.createElement("p");
      logElement.innerHTML = event.data.message;
      logsDivBlacklist.appendChild(logElement);
      logsDivBlacklist.scrollTop = logsDivBlacklist.scrollHeight;
      break;

    default:
      console.warn("Unknown log type:", event.data.type);
      break;
  }
});


const cacheOptions = {};
const directoriesOptions = {};
const vrcxOptions = {};
const toggleOptions = {};
const privacyandsafetyOptions = {};
const mainloggerWebhooks = [];
const authwebhooks = [];
const savedUserConfig = "";
const ApiKeysOptions = {};

// Show warning modal with a custom message
function showWarningModal(message) {
  document.getElementById("warningModalBody").textContent = message;
  const warningModal = new bootstrap.Modal(
    document.getElementById("warningModal")
  );

  warningModal.show(); /* Show the modal */
}

// Load configuration from main process
async function loadConfig() {
  try {
    const savedConfig = await window.api.loadConfig();
    console.log(savedConfig);

    // Ensure proper merging of configuration data
    Object.assign(toggleOptions, savedConfig.Toggle || {});
    Object.assign(ApiKeysOptions, savedConfig.ApiKeys || {});
    Object.assign(privacyandsafetyOptions, savedConfig.PrivacyandSafety || {});
    Object.assign(vrcxOptions, savedConfig.vrcx || {});
    Object.assign(directoriesOptions, savedConfig.Directories || {});
    Object.assign(cacheOptions, savedConfig.cache || {});

    mainloggerWebhooks.length = 0; // Clear existing items
    mainloggerWebhooks.push(...(savedConfig.Webhooks.Mainlogger || []));
    authwebhooks.length = 0; // Clear existing items
    authwebhooks.push(...(savedConfig.Webhooks.Authwebhook || []));

    renderApikeyOptions();
    renderSafetyToggleOptions();
    renderToggleOptions();
    renderMainloggerTable();
    renderAuthWebhookTable();
  } catch (error) {
    console.error("Failed to load config:", error);
  }
}

// Save configuration to main process
async function saveConfig() {
  const config = {
    cache: cacheOptions,
    Directories: directoriesOptions,
    vrcx: vrcxOptions,
    Webhooks: {
      Mainlogger: mainloggerWebhooks,
      Authwebhook: authwebhooks
    },
    Toggle: toggleOptions,
    PrivacyandSafety: privacyandsafetyOptions,
    ApiKeys: ApiKeysOptions
  };

  try {
    await window.api.saveConfig(config);
    console.log("Configuration saved:", config);
  } catch (error) {
    console.error("Failed to save config:", error);
  }
}

// Initial rendering
function init() {
  loadConfig();
}

// Safety Toggle options rendering
function renderSafetyToggleOptions() {
  const toggleSafetyOptionsDiv = document.getElementById("safetytoggleOptions");
  toggleSafetyOptionsDiv.innerHTML = ""; // Clear existing content
  Object.keys(privacyandsafetyOptions).forEach(key => {
    const isChecked = privacyandsafetyOptions[key];
    toggleSafetyOptionsDiv.innerHTML += `
<div class="form-check form-switch">
    <input class="form-check-input" type="checkbox" id="${key}" ${isChecked
      ? "checked"
      : ""} onchange="updateSafetyToggleOptions('${key}')">
    <label class="form-check-label" for="${key}">${key}</label>
</div>
`;
  });
}

// ApiKeys options rendering
function renderApikeyOptions() {
  const apikeysOptionsDiv = document.getElementById("apikeysOptions");
  apikeysOptionsDiv.innerHTML = ""; // Clear existing content
  Object.keys(ApiKeysOptions).forEach(key => {
    apikeysOptionsDiv.innerHTML += `
<div class="form-group mb-3">
    <label for="${key}" class="form-label">${key}</label>
    <input type="text" class="form-control" id="${key}" value="${ApiKeysOptions[
      key
    ]}" onchange="updateApikeyOption('${key}')">
</div>
`;
  });
}

// Update API key option
function updateApikeyOption(key) {
  ApiKeysOptions[key] = document.getElementById(key).value;
  saveConfig(); // Save configuration after updating API key
}

// Update safety toggle options
function updateSafetyToggleOptions(key) {
  privacyandsafetyOptions[key] = document.getElementById(key).checked;
  saveConfig();
}

// Toggle options rendering
function renderToggleOptions() {
  const toggleOptionsDiv = document.getElementById("toggleOptions");
  toggleOptionsDiv.innerHTML = ""; // Clear existing content
  Object.keys(toggleOptions).forEach(key => {
    const isChecked = toggleOptions[key];
    toggleOptionsDiv.innerHTML += `
<div class="form-check form-switch">
    <input class="form-check-input" type="checkbox" id="${key}" ${isChecked
      ? "checked"
      : ""} onchange="updateToggleOptions('${key}')">
    <label class="form-check-label" for="${key}">${key}</label>
</div>
`;
  });
}

// Update toggle options
function updateToggleOptions(key) {
  toggleOptions[key] = document.getElementById(key).checked;
  saveConfig();
}

// Main Logger Table rendering
function renderMainloggerTable() {
  const tableBody = document.getElementById("mainloggerTableBody");
  tableBody.innerHTML = ""; // Clear existing rows
  mainloggerWebhooks.forEach((webhook, index) => {
    tableBody.innerHTML += `
    <tr>
        <td>${webhook.url}</td>
        <td>
            <button class="btn btn-danger btn-sm" onclick="removeMainlogger(${index})">Remove</button>
        </td>
    </tr>
`;
  });
}

// Auth Webhook Table rendering
function renderAuthWebhookTable() {
  const tableBody = document.getElementById("authwebhookTableBody");
  tableBody.innerHTML = ""; // Clear existing rows
  authwebhooks.forEach((webhook, index) => {
    tableBody.innerHTML += `
    <tr>
        <td>${webhook.url}</td>
        <td>${webhook.token}</td>
        <td>
            <button class="btn btn-danger btn-sm" onclick="removeAuthWebhook(${index})">Remove</button>
        </td>
    </tr>
`;
  });
}

// Add Main Logger Webhook
function addMainlogger() {
  const url = document.getElementById("mainloggerURL").value;
  if (url) {
    mainloggerWebhooks.push({ url });
    renderMainloggerTable();
    document.getElementById("mainloggerSettingsForm").reset();
    saveConfig(); // Save configuration after adding
  } else {
    alert("Please enter a URL.");
  }
}

// Remove Main Logger Webhook
function removeMainlogger(index) {
  mainloggerWebhooks.splice(index, 1);
  renderMainloggerTable();
  saveConfig(); // Save configuration after removing
}

// Add Auth Webhook
function addAuthWebhook() {
  const url = document.getElementById("authWebhookURL").value;
  const token = document.getElementById("authWebhookToken").value;
  if (url && token) {
    authwebhooks.push({ url, token });
    renderAuthWebhookTable();
    document.getElementById("authwebhookSettingsForm").reset();
    saveConfig(); // Save configuration after adding
  } else {
    alert("Please enter both URL and Auth Token.");
  }
}

// Remove Auth Webhook
function removeAuthWebhook(index) {
  authwebhooks.splice(index, 1);
  renderAuthWebhookTable();
  saveConfig(); // Save configuration after removing
}
