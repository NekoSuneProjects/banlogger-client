const fs = require("fs");
const path = require("path");
const os = require("os");
const main = require("./main");
const pkgjn = require("./package.json");

// Get the path where the app is installed
const appInstallPath = path.join(
  os.homedir(),
  "AppData",
  "Roaming",
  pkgjn.name
);

const logpath = path.join(appInstallPath, "log");
const configDir = path.join(appInstallPath, "config");

const getConfig = require("./functions/getConfig"); // Import the getConfig function

async function initializeConfig() {
  const Config = {
    Directories: {
      LogDirectory: await getConfig("Directories.LogDirectory")
    },
    Toggle: {
      Mainwebhook: await getConfig("Toggle.Mainwebhook"),
      Authwebhook: await getConfig("Toggle.Authwebhook"),
      vrcxdata: await getConfig("Toggle.vrcxdata"),
      VRCLOGGERAPI: await getConfig("Toggle.VRCLOGGERAPI"),
      Countersavi: await getConfig("Toggle.Countersavi"),
      Countersvrca: await getConfig("Toggle.Countersvrca"),
      isEmbed: await getConfig("Toggle.isEmbed"),
      AviSwitch: await getConfig("Toggle.AviSwitch"),
      AviLogger: await getConfig("Toggle.AviLogger"),
      CheckGroupsBL: await getConfig("Toggle.CheckGroupsBL"),
      VRNotify: await getConfig("Toggle.VRNotify"),
      CheckAutoMod: await getConfig("Toggle.CheckAutoMod"),
      CheckUser: await getConfig("Toggle.CheckUser"),
      TTSBL: await getConfig("Toggle.TTSBL"),
      TTSAutoMod: await getConfig("Toggle.TTSAutoMod"),
      BOSAlert: await getConfig("Toggle.BOSAlert"),
      vrcx: await getConfig("Toggle.vrcx"),
      globaltoggle: await getConfig("Toggle.globaltoggle"),
      assetslogger: await getConfig("Toggle.assetslogger"),
      AviAnalysisStats: await getConfig("Toggle.AviAnalysisStats")
    },
    PrivacyandSafety: {
      videolonginfo: await getConfig("PrivacyandSafety.videolonginfo"),
      ipgrabber: await getConfig("PrivacyandSafety.ipgrabber")
    }
  };
  return Config;
}

if (!fs.existsSync(logpath)) {
  fs.mkdirSync(logpath, { recursive: true });
}

if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

const { checkthingtwo } = require("./AvatarUpload/index.js");

const {
  LOGSCLASS,
  PlayerClass,
  ModClass,
  UIPageShown,
  AVISwitchingClass,
  ModResetShowUserAvatarClass,
  AVISwitchinglogsClass,
  worldjsoncsvClass
} = require("./Configfiles/logsclass.js");

const { APICount } = require("./APIClient/APICount.js");

const { removetwobrackets } = require("./Splitlogjsonpart/index.js");

// webhook send data it
const { sendToWebhook } = require("./webhook/index.js");

const { resetCounter, updateCounter } = require("./playercounter/index.js");

const {
  vrchatcheckUserConnectionleft,
  vrchatcheckUserConnection
} = require("./VRChatLogUserID/index.js");

const { IpGrabbedAlert } = require("./SafetyProtection/index.js");

const { vrcxdata } = require("./vrcx/vrcxdata.js");

const { getDeviceVoices, SayDeviceVoices } = require("./functions/TTS.js");
const { fetchVRChatAnalysisStats } = require("./functions/VRChatAPI.js");

// Wrap in an IIFE (Immediately Invoked Function Expression) to use await at the top level
(async () => {
  const Config = await initializeConfig(); // Fetch config settings from the database

  if (Config.Toggle.AviLogger == true) {
    checkthingtwo();
  }

  if (Config.Toggle.Counters == true) {
    APICount.fetchListsBlackListCount();
  }
})().catch(error => {
  console.error("Error initializing config:", error);
});

// Timer configuration
const TIMER_INTERVAL = 25 * 60 * 1000; // 25 minutes
const BLACKLIST_FETCH_API = APICount.fetchListsBlackListCount;

// Create a timer to call FetchLists every 25 minutes
let blacklistFetchIntervalTimer;

// Initial setup for the timer
async function initializeTimer() {
  const Config = await initializeConfig(); // Fetch config settings from the database
  try {
    if (blacklistFetchIntervalTimer) {
      clearInterval(blacklistFetchIntervalTimer);
    }

    blacklistFetchIntervalTimer = setInterval(async () => {
      if (Config.Toggle.Counters === true) {
        await BLACKLIST_FETCH_API();
      }
    }, TIMER_INTERVAL);

    // Clean up the timer when it's no longer needed
    return () => {
      clearInterval(blacklistFetchIntervalTimer);
    };
  } catch (error) {
    errsleepy = `Error initializing timer: ${error.message}`;
    LOGSCLASS.writeErrorToFile(errsleepy);
  }
}

let currentLogFile = null;
let lastReadPosition = 0;

async function checkForNewFiles() {
  const Config = await initializeConfig(); // Fetch config settings from the database
  const logDirectory = Config.Directories.LogDirectory;
  const logFileNames = await fs.promises.readdir(logDirectory);
  const newLogFileNames = logFileNames.filter(fileName =>
    fileName.startsWith("output_log")
  );
  newLogFileNames.sort(); // Sort to pick the latest log file

  if (newLogFileNames.length > 0) {
    const latestLogFile = path.join(
      logDirectory,
      newLogFileNames[newLogFileNames.length - 1]
    );
    if (latestLogFile !== currentLogFile) {
      // Switch to the new log file
      currentLogFile = latestLogFile;
      lastReadPosition = 0;
      main.log(
        `Switching to new log file: ${currentLogFile}`,
        "info",
        "mainlog"
      );
    }
  }
}

async function readNewLogs(currentLogFile, lastReadPosition) {
  try {
    const fileData = await fs.promises.readFile(currentLogFile, "utf8");

    if (!fileData) {
      return [[], 0]; // Return an empty array and 0 as the last read position
    }

    const newData = fileData.slice(lastReadPosition);
    const newLogs = newData.split("\n").filter(Boolean); // Remove empty strings
    const newLastReadPosition = fileData.length;

    return [newLogs, newLastReadPosition]; // Return an array with newLogs and newLastReadPosition
  } catch (err) {
    errsleepy = `Error reading log file: ${err}`;
    LOGSCLASS.writeErrorToFile(errsleepy);
    throw err; // Rethrow the error to propagate it up the call stack
  }
}

async function monitorAndSend() {
  const Config = await initializeConfig(); // Fetch config settings from the database

  const toggle = {
    Mainwebhook: Config.Toggle.Mainwebhook,
    Ohterwebhook: Config.Toggle.Ohterwebhook,
    Authwebhook: Config.Toggle.Authwebhook,
    vrcxdata: Config.Toggle.vrcxdata,
    WBAPI: Config.Toggle.WBAPI,
    Countersavi: Config.Toggle.Countersavi,
    Counters: Config.Toggle.Counters,
    isEmbed: Config.Toggle.isEmbed,
    AviSwitch: Config.Toggle.AviSwitch,
    AviLogger: Config.Toggle.AviLogger,
    TTS: Config.Toggle.TTS,
    assetslogger: Config.Toggle.assetslogger,
    AviAnalysisStats: Config.Toggle.AviAnalysisStats
  };

  const PrivacyandSafety = {
    videolonginfo: Config.PrivacyandSafety.videolonginfo,
    ipgrabber: Config.PrivacyandSafety.ipgrabber
  };

  try {
    while (true) {
      // Check for new files in each loop iteration
      await checkForNewFiles();
      if (currentLogFile) {
        const currentSize = fs.statSync(currentLogFile).size;
        if (currentSize > lastReadPosition) {
          const [newLogs, newLastReadPosition] = await readNewLogs(
            currentLogFile,
            lastReadPosition
          );

          newLogs.forEach(async log => {
            // Check log length before processing
            if (log.length > 10000) {
              // Adjust the limit as necessary
              main.log(
                `Log entry too long, skipping: ${log.length}`,
                "warn",
                "mainlog"
              );
              errsleepy = `Log entry too long, skipping: ${log.length}`;
              LOGSCLASS.writeErrorToFile(errsleepy);
              return; // Skip processing this log entry
            }
            if (log.includes("Joining or Creating Room")) {
              const logParts = log.split(" ").filter(part => part !== "");
              logParts.splice(logParts.indexOf("[Behaviour]"), 1);

              resetCounter("player");

              if (toggle.vrcxdata == true) {
                vrcxdata();
              }

              main.log(
                `vrchat log - ${logParts.join(" ")}`,
                "info",
                "joinleavelog"
              );
              sendToWebhook(logParts.join(" "));
            } else if (log.includes("[Always] Instance closed:")) {
              const logParts = log.split(" ").filter(part => part !== "");
              logParts.splice(logParts.indexOf("[Always]"), 1);

              const timestamp = Date.now() / 1000;
              formattedLogMessage = `<t:${Math.round(
                timestamp
              )}:f> ${logParts.join(" ")}`;

              PlayerClass.writeplayerToFile(formattedLogMessage);
              ModClass.writeModerationToFile(formattedLogMessage);

              main.log(logParts.join(" "), "info", "joinleavelog");

              sendToWebhook(formattedLogMessage);
            } else if (log.includes("ModerationManager")) {
              const logRegex = /(?:\[ModerationManager\]\W-?\W?)([\S]+)(?:\W-\W)?(?:is no longer Muted|avatar is enabled|is now Blocked|Requesting block on|has been (warned|kicked)(?:\Wby\W([\S]+))?)/;
              const voteKickMatch = log.match(
                /A vote kick has been initiated against ([^,]+) by ([^,]+)/
              );

              const timestamp = Math.round(Date.now() / 1000);
              let formattedLogMessage;

              if (voteKickMatch) {
                // Vote kick detected
                const [, voteKickUser, voteKickModerator] = voteKickMatch;
                formattedLogMessage = `<t:${timestamp}:f> vrchat logs - ModerationManager A vote kick has been initiated against ${voteKickUser} by ${voteKickModerator}, do you agree?`;
              } else {
                // Check for other moderation actions
                const match = log.match(logRegex);
                if (match) {
                  const [, userName, action, moderator] = match;

                  if (log.includes("is no longer Muted")) {
                    formattedLogMessage = `<t:${timestamp}:f> vrchat logs - ModerationManager ${userName} is no longer Muted.`;
                  } else if (log.includes("avatar is enabled")) {
                    formattedLogMessage = `<t:${timestamp}:f> vrchat logs - ModerationManager ${userName}'s avatar is enabled.`;
                  } else if (log.includes("is now Blocked")) {
                    formattedLogMessage = `<t:${timestamp}:f> vrchat logs - ModerationManager ${userName} is now Blocked.`;
                  } else if (log.includes("Requesting block on")) {
                    formattedLogMessage = `<t:${timestamp}:f> vrchat logs - ModerationManager Requesting block on ${userName}.`;
                  } else {
                    // Default to warn/kick logs
                    formattedLogMessage = `<t:${timestamp}:f> vrchat logs - ModerationManager User ${userName} has been ${action}${moderator
                      ? ` by ${moderator}`
                      : ""}.`;
                  }
                }
              }

              if (formattedLogMessage) {
                ModClass.writeModerationToFile(formattedLogMessage);
                main.log(formattedLogMessage, "info", "modlog");
                sendToWebhook(formattedLogMessage);
              }
            } else if (log.includes("VRC.Udon.VM.UdonVMException")) {
              //used for see if any errors are thrown from a client user
              // https://creators.vrchat.com/worlds/udon/debugging-udon-projects/
              const logParts = log.split(" ").filter(part => part !== "");
              logParts.splice(logParts.indexOf("[Behaviour]"), 1);
              main.log(logParts.join(" "), "info", "modlog");
              sendToWebhook(logParts.join(" "));
            } else if (log.includes("USharpVideo")) {
              const logParts = log.split(" ").filter(part => part !== "");
              if (PrivacyandSafety.ipgrabber == true) {
                IpGrabbedAlert(log);
              }
              if (PrivacyandSafety.videolonginfo == true) {
                logParts.splice(logParts.indexOf("[Behaviour]"), 1);
              }
              main.log(logParts.join(" "), "info", "modlog");
              sendToWebhook(logParts.join(" "));
            } else if (log.includes("Video Playback")) {
              const logParts = log.split(" ").filter(part => part !== "");
              if (PrivacyandSafety.ipgrabber == true) {
                IpGrabbedAlert(log);
              }
              if (PrivacyandSafety.videolonginfo == true) {
                logParts.splice(logParts.indexOf("[Behaviour]"), 1);
              }
              main.log(logParts.join(" "), "info", "modlog");
              sendToWebhook(logParts.join(" "));
            } else if (log.includes("[StickersManager] ")) {
              //2024.12.13 21:20:54 Log -  [Always] [StickersManager] User usr_a2544e1a-5d86-4da1-a841-88cbbef08c91 (Doughnut~Coffee) spawned sticker file_e517d3c1-5744-4b01-bcb3-59dff4606a10
              if (toggle.assetslogger == true) {
                const logRegex = /([\d]{4}.[\d]{2}.[\d]{2}\W[\d]{2}:[\d]{2}:[\d]{2})\W(Log[\W]{8}|Debug[\W]{6})-\W\W(?:[\[Always\]\W]*)\[StickersManager\]\WUser\W(usr_[\d\w\W]+)\W\(([\d\w\W]+)\)\Wspawned\Wsticker\W(file_[\d\w\W]+)/;

                const match = log.match(logRegex);
                if (match) {
                  const timestamp = Math.round(Date.now() / 1000);
                  const [
                    ,
                    logTime,
                    logLevel,
                    userId,
                    userName,
                    stickerId
                  ] = match;

                  const formattedLogMessage = `${logTime} vrchat logs - StickersManager User ${userId} (${userName}) spawned sticker ${stickerId}`;

                  ModClass.writeModerationToFile(formattedLogMessage);
                  main.log(formattedLogMessage, "info", "modlog");
                  sendToWebhook(formattedLogMessage);
                }
              }
            } else if (log.includes("[API] Requesting Get prints/")) {
              if (toggle.assetslogger == true) {
                const printSpawnRegex = /([\d]{4}.[\d]{2}.[\d]{2}\W[\d]{2}:[\d]{2}:[\d]{2})\W(Log[\W]{8}|Debug[\W]{6})-\W\W\[API\]\WRequesting\WGet\Wprints\/(prnt_[\d\w\W]+)\W\{\{\}\}/;

                const match = log.match(printSpawnRegex);
                if (match) {
                  const timestamp = Math.round(Date.now() / 1000);
                  const [, logTime, logLevel, printFile] = match;

                  const formattedLogMessage = `${logTime} vrchat logs - API Requested print file ${printFile}`;

                  ModClass.writeModerationToFile(formattedLogMessage);
                  main.log(formattedLogMessage, "info", "modlog");
                  sendToWebhook(formattedLogMessage);
                }
              }
            } else if (
              /\[API\] Requesting Get analysis\/(file_[0-9a-fA-F-]+)\/(\d+)/.test(
                log
              )
            ) {
              if (toggle.AviAnalysisStats == true) {
                const timestamp = Math.round(Date.now() / 1000);
                const match = log.match(
                  /\[API\] Requesting Get analysis\/(file_[0-9a-fA-F-]+)\/(\d+)/
                );
                if (match) {
                  const [, fileId, row] = match;
                  main.log(
                    `<t:${timestamp}:f> vrchat logs - VRChat API Analysis Requested: File ID - ${fileId}, Row - ${row}`,
                    "info",
                    "modlog"
                  );
                  fetchVRChatAnalysisStats(fileId, row);
                }
              }
            } else if (log.includes("[Behaviour]")) {
              const logParts = log.split(" ").filter(part => part !== "");
              logParts.splice(logParts.indexOf("[Behaviour]"), 1);
              const timestamp = Math.round(Date.now() / 1000);

              if (log.includes("Event: UI_PageShown -")) {
                let jsonObject = await removetwobrackets(logParts);
                const formattedLogMessage = `<t:${timestamp}:f> ${JSON.stringify(
                  jsonObject
                )}`;
                const formattedLogMessageediut = `<t:${timestamp}:f> ${jsonObject}`;
                UIPageShown.writeModerationToFile(formattedLogMessageediut);
                main.log(jsonObject, "info", "uivrchatlog");
                sendToWebhook(formattedLogMessage);
              } else if (log.includes("OnPlayerJoined")) {
                const logParts = log.split(" ").filter(part => part !== "");
                logParts.splice(logParts.indexOf("[Behaviour]"), 1);

                /// only for vrcx
                const userIdPattern = /\(usr_[\w-]+\)/; // Pattern to match user ID
                const userIdIndex = logParts.findIndex(part =>
                  userIdPattern.test(part)
                );

                let displayName = null; // Declare displayName once
                let userid = null; // Declare userid once

                // Check if logParts has enough elements
                if (logParts && logParts.length > 5) {
                  // Extract display name based on the userIdIndex
                  if (userIdIndex > 5) {
                    // Ensure there are enough parts before the user ID
                    displayName = logParts
                      .slice(5, userIdIndex)
                      .join(" ")
                      .trim(); // Extract display name
                  } else if (userIdIndex === 5) {
                    displayName = logParts
                      .slice(5, userIdIndex)
                      .join(" ")
                      .trim(); // This will be empty
                  } else {
                    displayName = logParts.slice(5).join(" ").trim(); // Fallback if userIdIndex is not found
                  }
                }

                // If userIdIndex is found, get the user ID
                if (userIdIndex >= 0) {
                  userid = logParts[userIdIndex]; // Get user ID from logParts
                }

                const cleanUser = userid
                  ? userid.replace(/[()]/g, "")
                  : "unknown"; // Clean user ID or default to "unknown"
                const cleanedString = displayName || "unknown"; // Default to "unknown" if null

                vrchatcheckUserConnection(cleanedString, cleanUser);

                if (toggle.vrcx == true) {
                  checkUserConnectionjoin(cleanedString);
                }

                const timestamp = Date.now() / 1000;
                formattedLogMessage = `<t:${Math.round(
                  timestamp
                )}:f> ${logParts.join(" ")}`;

                PlayerClass.writeplayerToFile(formattedLogMessage);

                main.log(logParts.join(" "), "info", "joinleavelog");
                sendToWebhook(logParts.join(" "));
              } else if (log.includes("OnPlayerLeft")) {
                const logParts = log.split(" ").filter(part => part !== "");
                logParts.splice(logParts.indexOf("[Behaviour]"), 1);
                /// only for vrcx
                const userIdPattern = /\(usr_[\w-]+\)/; // Pattern to match user ID
                const userIdIndex = logParts.findIndex(part =>
                  userIdPattern.test(part)
                );

                let displayName = null; // Declare displayName once
                let userid = null; // Declare userid once

                // Check if logParts has enough elements
                if (logParts && logParts.length > 5) {
                  // Extract display name based on the userIdIndex
                  if (userIdIndex > 5) {
                    // Ensure there are enough parts before the user ID
                    displayName = logParts
                      .slice(5, userIdIndex)
                      .join(" ")
                      .trim(); // Extract display name
                  } else if (userIdIndex === 5) {
                    displayName = logParts
                      .slice(5, userIdIndex)
                      .join(" ")
                      .trim(); // This will be empty
                  } else {
                    displayName = logParts.slice(5).join(" ").trim(); // Fallback if userIdIndex is not found
                  }
                }

                // If userIdIndex is found, get the user ID
                if (userIdIndex >= 0) {
                  userid = logParts[userIdIndex]; // Get user ID from logParts
                }

                const cleanUser = userid
                  ? userid.replace(/[()]/g, "")
                  : "unknown"; // Clean user ID or default to "unknown"
                const cleanedString = displayName || "unknown"; // Default to "unknown" if null

                vrchatcheckUserConnectionleft(cleanedString, cleanUser);

                if (toggle.vrcx == true) {
                  checkUserConnectionleft(cleanedString);
                }
                const timestamp = Date.now() / 1000;
                formattedLogMessage = `<t:${Math.round(
                  timestamp
                )}:f> ${logParts.join(" ")}`;

                PlayerClass.writeplayerToFile(formattedLogMessage);

                main.log(logParts.join(" "), "info", "joinleavelog");
                sendToWebhook(logParts.join(" "));
              } else if (log.includes("Destroying")) {
                updateCounter("player", "left");
                PlayerClass.writeplayerToFile(
                  `<t:${timestamp}:f> ${logParts.join(" ")}`
                );
              } else if (log.includes("OnPlayerLeftRoom")) {
                PlayerClass.writeplayerToFile(logParts.join(" "));
              } else if (log.includes("Initialized player")) {
                updateCounter("player", "join");
                PlayerClass.writeplayerToFile(
                  `<t:${timestamp}:f> ${logParts.join(" ")}`
                );
              } else if (log.includes("Entering Room:")) {
                worldjsoncsvClass.writToFile(logParts.join(" "));
              } else if (log.includes("Successfully left room")) {
                // No action needed
              } else if (
                log.includes("Event: Moderation_ResetShowUserAvatarToDefault")
              ) {
                const logParts = log.split(" ").filter(part => part !== "");
                logParts.splice(logParts.indexOf("[Behaviour]"), 1);

                const timestamp = Date.now() / 1000;
                formattedLogMessage = `<t:${Math.round(
                  timestamp
                )}:f> ${logParts.join(" ")}`;

                ModResetShowUserAvatarClass.writeModerationResetShowUserAvatarToFile(
                  formattedLogMessage
                );
                main.log(logParts.join(" "), "info", "modlog");
                sendToWebhook(logParts.join(" "));
              } else if (
                log.includes(
                  "Event: Received executive message: You have been kicked from the instance"
                )
              ) {
                const logParts = log.split(" ").filter(part => part !== "");
                main.log(logParts.join(" "), "info", "joinleavelog");
                sendToWebhook(logParts.join(" "));
              } else if (log.includes("Switching ")) {
                const logParts = log.split(" ").filter(part => part !== "");
                logParts.splice(logParts.indexOf("[Behaviour]"), 1);

                const matchResult = logParts.join(" ").match(/avatar (.*)/);
                const matchResult2 = logParts
                  .join(" ")
                  .match(/Switching (.*?) to/);

                if (matchResult && matchResult2) {
                  const avatarneedName = matchResult[1];
                  const username = matchResult2[1];

                  const timestamp = Date.now() / 1000;
                  formattedLogMessage = `<t:${Math.round(
                    timestamp
                  )}:f> vrchat log - user ${username} Switching to ${avatarneedName}`;

                  sendToWebhook(formattedLogMessage);
                  AVISwitchingClass.writeModerationToFile(formattedLogMessage);
                  if (toggle.AviSwitch == true) {
                    main.log(
                      `vrchat log - user ${username} Switching to ${avatarneedName}`,
                      "info",
                      "avatarswitchlog"
                    );
                  }
                }
              } else if (log.includes("Destination set: ")) {
                try {
                  const logParts = log.split(" ").filter(part => part !== "");
                  logParts.splice(logParts.indexOf("[Behaviour]"), 1);

                  const destinationPart = logParts.find(part =>
                    part.startsWith("wrld_")
                  );

                  if (destinationPart) {
                    const subparts = destinationPart.split(":");
                    if (subparts.length > 1) {
                      const worldId = subparts[0].trim(); // Trim any leading or trailing whitespaces
                      const instanceInfo = subparts[1].trim();

                      // Remove the query parameters from instanceInfo
                      const queryIndex = instanceInfo.indexOf("?");
                      if (queryIndex !== -1) {
                        instanceInfo = instanceInfo.substring(0, queryIndex);
                      }

                      // Extract the number from instanceInfo
                      const instanceId = instanceInfo.split("~")[0]; // Get the part before the first '~'
                      // Extract the group ID from instanceInfo
                      const groupIdMatch = instanceInfo.match(
                        /group\(([^)]+)\)/
                      );
                      const groupId = groupIdMatch ? groupIdMatch[1] : null; // Get the group ID from the match

                      const data = [worldId, groupId, instanceId];

                      worldjsoncsvClass.writToFile(data);

                      main.log(
                        `vrchat log - You have joined ID: ${worldId}`,
                        "info",
                        "joinleavelog"
                      );
                      main.log(
                        `vrchat log - You have joined Instance Info: ${instanceInfo}`,
                        "info",
                        "joinleavelog"
                      );
                      main.log(
                        `vrchat log - You have joined Instance id: ${instanceId}`,
                        "info",
                        "joinleavelog"
                      );

                      const timestamp = Date.now() / 1000;
                      formattedLogMessage = `<t:${Math.round(
                        timestamp
                      )}:f> You have joined [WORLD URL](https://vrchat.com/home/launch?worldId=${worldId}&instanceId=${instanceInfo})`;
                      sendToWebhook(formattedLogMessage);
                    } else {
                      main.log(
                        `Error: Unable to extract world ID and instance info`,
                        "info",
                        "joinleavelog"
                      );
                    }
                  }
                } catch (error) {
                  errsleepy = `error stack: ${error}`;
                  LOGSCLASS.writeErrorToFile(errsleepy);
                }
              }
            }
          });
          lastReadPosition = newLastReadPosition;
        } else {
          main.log(
            `No log file selected. Waiting for a new log file...`,
            "info",
            "mainlog"
          );
        }
      }
      await new Promise(resolve => setTimeout(resolve, 1000)); // Adjust the polling interval as needed
    }
  } catch (error) {
    errsleepy = `error stack of monitor of vrchat: ${error.message}`;
    LOGSCLASS.writeErrorToFile(errsleepy);
    main.log(errsleepy, "info", "mainlog");
  }
}

monitorAndSend();
initializeTimer();

// ———————————————[Error Handling]———————————————
process.on("uncaughtException", (err, origin) => {
  LOGSCLASS.writeErrorToFile(
    `Uncaught Exception at: ${new Date().toISOString()}
        Error: ${err.message}
        Stack: ${err.stack}
        Origin: ${origin}`
  );
  setTimeout(() => process.exit(1), 100);
});

process.on("unhandledRejection", (reason, promise) => {
  LOGSCLASS.writeErrorToFile(
    `Unhandled Rejection at: ${new Date().toISOString()}
        Reason: ${reason}
        Promise: ${promise}`
  );
});
