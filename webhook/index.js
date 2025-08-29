const { LOGSCLASS } = require("../Configfiles/logsclass.js");
const fs = require("fs");
const axios = require("axios");
const getConfig = require("../functions/getConfig"); // Import the getConfig function

async function initializeConfig() {
  const Config = {
    Toggle: {
      Mainwebhook: await getConfig("Toggle.Mainwebhook"),
      Ohterwebhook: await getConfig("Toggle.Ohterwebhook"),
      Authwebhook: await getConfig("Toggle.Authwebhook"),
      isEmbed: await getConfig("Toggle.isEmbed")
    },
    Webhooks: {
      Mainlogger: await getConfig("Webhooks.Mainlogger"),
      Authwebhook: await getConfig("Webhooks.Authwebhook")
    }
  };
  return Config;
}

function getHeaders() {
  return {
    "Content-Type": "application/json"
  };
}

async function sendToWebhook(logEntry) {
  const headers = getHeaders();

  const Config = await initializeConfig(); // Fetch config settings from the database

  if (Config.Toggle.Authwebhook) {
    const authWebhooks = Config.Webhooks.Authwebhook;

    for (const { url, token } of authWebhooks) {
      try {
        const isEmbed = Config.Toggle.isEmbed;
        headers.Authorization = `Bearer ${token}`;

        if (isEmbed) {
          await axios.post(
            url,
            {
              embed: {
                title: "VRCLogger",
                description: logEntry,
                color: 0x0017ff,
                timestamp: new Date().toISOString()
              },
              isEmbed: isEmbed
            },
            {
              headers,
              timeout: 30000 // 30 seconds
            }
          );
        } else {
          await axios.post(
            url,
            { content: logEntry, isEmbed: isEmbed },
            {
              headers,
              timeout: 30000 // 30 seconds
            }
          );
        }
      } catch (error) {
        LOGSCLASS.writeErrorToFile(
          `Error sending to webhook ${url}: ${error.message}`
        );
      }
    }
  } else {
    const webhooks = Config.Webhooks.Mainlogger;

    for (const url of webhooks) {
      try {
        const isEmbed = Config.Toggle.isEmbed;

        if (isEmbed) {
          await axios.post(
            url,
            {
              embeds: [
                {
                  title: "VRCLogger",
                  description: logEntry,
                  color: 0x0017ff,
                  timestamp: new Date().toISOString()
                }
              ]
            },
            {
              headers,
              timeout: 30000 // 30 seconds
            }
          );
        } else {
          await axios.post(
            url,
            { content: logEntry },
            {
              headers,
              timeout: 30000 // 30 seconds
            }
          );
        }
      } catch (error) {
        if (error.response && error.response.status === 429) {
          // Rate limited, wait for 1 second before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          LOGSCLASS.writeErrorToFile(
            `Error sending to webhook ${url}: ${error.message}`
          );
        }
      }
    }
  }
}

module.exports = {
  sendToWebhook
};
