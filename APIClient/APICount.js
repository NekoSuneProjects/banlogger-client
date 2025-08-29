const crypto = require("crypto");
const fs = require("fs");
const { LOGSCLASS } = require("../Configfiles/logsclass.js");
const main = require("../main");

class APICount {
  static async downloadJson(url) {
    try {
      const userAgent = `Mozilla/5.0 (${crypto
        .randomBytes(12)
        .toString("hex")})`;
      const response = await fetch(url, {
        headers: { "User-Agent": userAgent }
      });

      if (!response.ok) {
        throw new Error(
          `Failed to download JSON from ${url}. Status code: ${response.status}`
        );
      }

      return response.json();
    } catch (error) {
      LOGSCLASS.writeErrorToFile(error);
      console.log(`ny error stack: ${error}`);
      throw error;
    }
  }

  static async fetchListsBlackListCount() {
    const Config = await initializeConfig(); // Fetch config settings from the database
    APICount.downloadJson(
      `${Config.ApiKeys.ApiEndpointUrL}/v5/games/api/vrchat/yoinker/count`
    )
      .then(data => {
        const yoinkers = data[0].yoinker;

        if (yoinkers.ripper > 0) {
          main.log(`Ripper Users: ${JSON.stringify(yoinkers.ripper)}`, "info");
        }

        if (yoinkers.crasher > 0) {
          main.log(
            `Crasher Users: ${JSON.stringify(yoinkers.crasher)}`,
            "info",
            "mainlog"
          );
        }

        if (yoinkers.cyberbully > 0) {
          main.log(
            `Cyberbully Users: ${JSON.stringify(yoinkers.cyberbully)}`,
            "info",
            "mainlog"
          );
        }

        if (yoinkers.banned > 0) {
          main.log(
            `Banned Users: ${JSON.stringify(yoinkers.banned)}`,
            "info",
            "mainlog"
          );
        }

        if (yoinkers.clients > 0) {
          main.log(
            `Clients Users: ${JSON.stringify(yoinkers.clients)}`,
            "info",
            "mainlog"
          );
        }

        if (yoinkers.troll > 0) {
          main.log(
            `Troll Users: ${JSON.stringify(yoinkers.troll)}`,
            "info",
            "mainlog"
          );
        }

        if (yoinkers.racism > 0) {
          main.log(
            `Racism Users: ${JSON.stringify(yoinkers.racism)}`,
            "info",
            "mainlog"
          );
        }

        if (yoinkers.underaged > 0) {
          main.log(
            `Underaged Users: ${JSON.stringify(yoinkers.underaged)}`,
            "info",
            "mainlog"
          );
        }

        if (data[0].avatarblacklist.crasher > 0) {
          main.log(
            `Crasher Avatars ${data[0].avatarblacklist.crasher}`,
            "info",
            "mainlog"
          );
        }

        if (data[0].avatarblacklist.ripper > 0) {
          main.log(
            `Ripper Avatars ${data[0].avatarblacklist.ripper}`,
            "info",
            "mainlog"
          );
        }
      })
      .catch(error => {
        LOGSCLASS.writeErrorToFile(error);
        console.log(`ny error stack: ${error}`);
      });
  }
}

module.exports = {
  APICount
};
