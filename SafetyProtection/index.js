const { sendToWebhook } = require("../webhook/index.js");
const main = require("../main.js");

async function IpGrabbedAlert(log) {
  try {
    const response = await fetch(
      "https://vrcloggerpub.nekosunevr.co.uk/safetyjson.json"
    );
    if (!response.ok) {
      console.error(`Error fetching IPGrabbers Lists: ${response.statusText}`);
      return;
    }

    const ipgrabbers = await response.json();

    // Extract domain from log
    const logParts = log.split(" ").filter(part => part.trim() !== "");

    // Find the URL part in the log entry
    const urlIndex = logParts.findIndex(part => part.startsWith("http"));
    const url =
      urlIndex !== -1 ? logParts[urlIndex].replace(/['",]/g, "") : null;
    let domain = null;

    if (url) {
      domain = new URL(url).hostname;
    } else {
      // Check for 'Attempting to resolve URL' pattern
      const attemptIndex = log.indexOf("Attempting to resolve URL '");
      if (attemptIndex !== -1) {
        const urlStart = attemptIndex + "Attempting to resolve URL '".length;
        const urlEnd = log.indexOf("'", urlStart);
        if (urlEnd !== -1) {
          const extractedUrl = log.substring(urlStart, urlEnd);
          domain = new URL(extractedUrl).hostname;
        }
      }
    }

    // Extract display name only if "requested by" is present in the log
    const requestedByPhrase = "requested by";
    const requestedByIndex = log.indexOf(requestedByPhrase);
    let displayName = null;

    if (requestedByIndex !== -1) {
      // Extract the part after "requested by"
      const afterRequestedBy = log
        .substring(requestedByIndex + requestedByPhrase.length)
        .trim();
      const partsAfterRequestedBy = afterRequestedBy.split(/[\s,]+/); // Split by whitespace or comma

      // The username should be the last part of the extracted substring
      if (partsAfterRequestedBy.length > 0) {
        displayName = partsAfterRequestedBy.pop(); // Get the last element

        // Check if the displayName is a timestamp or unwanted characters
        const timestampRegex = /^\d{2}:\d{2}:\d{2}$/;
        if (timestampRegex.test(displayName)) {
          displayName = null;
        }
      }
    }

    // Only process if a domain was found and is an IP grabber
    if (domain && ipgrabbers.ipgrabber_domains.includes(domain)) {
      const currentDate = new Date()
        .toISOString()
        .replace("T", " ")
        .split(".")[0];
      if (displayName) {
        main.log(
          `vrchat log - ${currentDate} [HIGH ALERT] - [IP-GRABBER] Warning: User ${displayName} used an IP grabber domain (${domain}) in the world!`,
          "info",
          "modlog"
        );
        const timestamp = Date.now() / 1000;
        formattedLogMessage = `<t:${Math.round(
          timestamp
        )}:f> vrchat log - ${currentDate} "[HIGH ALERT]" - [IP-GRABBER] Warning: User ${displayName} used an IP grabber domain (${domain}) in the world!`;

        sendToWebhook(formattedLogMessage);
      } else {
        main.log(
          `vrchat log - ${currentDate} [HIGH ALERT] - [IP-GRABBER] Warning: Someone in Lobby used an IP grabber domain (${domain}) in the world!`,
          "info",
          "modlog"
        );
        const timestamp = Date.now() / 1000;
        formattedLogMessage = `<t:${Math.round(
          timestamp
        )}:f> vrchat log - ${currentDate} "[HIGH ALERT]" - [IP-GRABBER] Warning: Someone in Lobby used an IP grabber domain (${domain}) in the world!`;

        sendToWebhook(formattedLogMessage);
      }
    }
  } catch (err) {
    console.error(`Error in IpGrabbedAlert: ${err.message}`);
  }
}

module.exports = {
  IpGrabbedAlert
};
