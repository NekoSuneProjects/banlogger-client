const main = require("../main.js");
const getConfig = require("./getConfig"); // Import the getConfig function

const { fetchWithRetry } = require("./funct-short"); // Import the getConfig function

function formatSize(sizeInBytes) {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let index = 0;
  while (sizeInBytes >= 1024 && index < units.length - 1) {
    sizeInBytes /= 1024;
    index++;
  }
  return sizeInBytes.toFixed(2) + " " + units[index];
}

async function initializeConfig() {
  const Config = {
    Toggle: {
      AviAnalysisStats: await getConfig("Toggle.AviAnalysisStats")
    },
    ApiKeys: {
      Auto_Mod_Check: await getConfig("ApiKeys.Auto_Mod_Check"),
      Auto_Mod_Check_Global: await getConfig("ApiKeys.Auto_Mod_Check_Global"),
      ApiEndpointUrL: await getConfig("ApiKeys.ApiEndpointUrL")
    }
  };
  return Config;
}

let queue = []; // The queue to hold the file IDs and versions
let isProcessing = false; // Flag to track if processing is in progress

// Function to add items to the queue
function fetchVRChatAnalysisStats(fileid, fileversion) {
  queue.push({ fileid, fileversion });
  processQueue();
}

// Function to process the queue
async function processQueue() {
  // If already processing, wait until the current process finishes
  if (isProcessing) {
    console.log('Currently processing, will try again later.');
    return;
  }

  // If the queue is empty, do nothing
  if (queue.length === 0) {
    //console.log('No requests to process.');
    return;
  }

  // Set the flag to indicate processing is in progress
  isProcessing = true;

  // Dequeue the first request
  const { fileid, fileversion } = queue.shift();

  try {
    // Process the file request
    await fetchVRChatAnalysisStatsAPI(fileid, fileversion);
  } catch (error) {
    console.error('Error processing file:', error);
  } finally {
    // Reset the flag and wait for the next one
    isProcessing = false;
    console.log('Finished processing, waiting for the next request.');
    
    // Wait for 1 minute before processing the next request
    setTimeout(processQueue, 60000);
  }
}

function formatTimestamp() {
    const timestamp = Math.round(Date.now() / 1000);
  
    // Create a Date object from the timestamp
    const date = new Date(timestamp * 1000); // Convert to milliseconds
  
    // Extract the day, month, year, hours, minutes, and seconds
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
  
    // Format the date in dd/mm/yyyy hh:mm:ss
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }
  
  // Example usage:
  const formattedDate = formatTimestamp();
  console.log(formattedDate);
  

async function fetchVRChatAnalysisStatsAPI(fileid, fileversion) {
  const Config = await initializeConfig(); // Fetch config settings from the database

  if (Config.Toggle.AviAnalysisStats == true) {
    let apiUrl;
    let apireq;
    let apimethod;

    if (fileid) {
      apiUrl = `${Config.ApiKeys
        .ApiEndpointUrL}/v5/games/api/vrchat/yoinker/safety/avataranalysis`;
      apimethod = `POST`;
      apireq = `${fileid}`;
    } else {
      return; // or throw an error, depending on your requirements
    }

    switch (apimethod) {
      case "GET":
        const headers = {
          Accept: "application/json",
          "vrclogger-api-key": `${Config.ApiKeys.Auto_Mod_Check}`
        };

        fetchWithRetry(`${apiUrl}/${apireq}`, {
          method: "GET",
          headers
        })
          .then(handleResponse)
          .then(handleData)
          .catch(handleError);
        break;
      case "POST":
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

        myHeaders.append("Accept", "application/json");
        myHeaders.append("vrclogger-api-key", `${Config.ApiKeys.Auto_Mod_Check}`)

        const urlencoded = new URLSearchParams();
        urlencoded.append("fileId", `${fileid}`);
        urlencoded.append("fileVersion", `${fileversion}`);

        const requestOptions = {
          method: "POST",
          headers: myHeaders,
          body: urlencoded,
          redirect: "follow"
        };
        fetchWithRetry(`${apiUrl}`, requestOptions)
          .then(handleResponse)
          .then(handleData)
          .catch(handleError);
        break;
    }

    function handleResponse(response) {
      if (!response.ok) {
        if (response.status === 404) {
          return {
            status: 404,
            error: `404`
          };
        } else {
          console.log(`API vrclogger Failed to fetch data: ${response.status}`);
          throw new Error(
            `API vrclogger Failed to fetch data: ${response.status}`
          );
        }
      }
      return response.json();
    }

    function handleData(data) {
      const timestamp = formatTimestamp();
      // Format sizes
      const fileSize = formatSize(data.data.fileSize);
      const uncompressedSize = formatSize(data.data.uncompressedSize);

      // Create the message for logging
      const avatarStats = data.data.avatarStats;
      const message = `${timestamp} vrchat logs - FileID: ${fileid}\nVersion: ${fileversion}\nAvatar Stats:\nAnimator Count: ${avatarStats.animatorCount}, Audio Source Count: ${avatarStats.audioSourceCount}, Blend Shape Count: ${avatarStats.blendShapeCount}, Bone Count: ${avatarStats.boneCount}, Camera Count: ${avatarStats.cameraCount}, Cloth Count: ${avatarStats.clothCount}, Constraint Count: ${avatarStats.constraintCount}, Contact Count: ${avatarStats.contactCount}, Custom Expressions: ${avatarStats.customExpressions}, Customize Animation Layers: ${avatarStats.customizeAnimationLayers}, Enable Eye Look: ${avatarStats.enableEyeLook}, Light Count: ${avatarStats.lightCount}, Lip Sync Count: ${avatarStats.lipSync}, Material Count: ${avatarStats.materialCount}, Mesh Count: ${avatarStats.meshCount}, Total Polygons: ${avatarStats.totalPolygons}\nSize: ${fileSize} (Uncompressed Size: ${uncompressedSize})\nPerformance Rating: ${data.data.performanceRating}`;

      main.log(message, "info", "modlog");
    }

    function handleError(error) {
      console.error(error);
      LOGSCLASS.writeErrorToFile(error);
    }
  }
}

module.exports = {
  fetchVRChatAnalysisStats
};
