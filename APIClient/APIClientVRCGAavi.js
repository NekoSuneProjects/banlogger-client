const crypto = require("crypto");
const { LOGSCLASS } = require("../Configfiles/logsclass.js");
const getConfig = require("../functions/getConfig"); // Import the getConfig function

async function initializeConfig() {
  const Config = {
    ApiKeys: {
      ApiEndpointUrL: await getConfig("ApiKeys.ApiEndpointUrL")
    }
  };
  return Config;
}

class APIClientVRCGAavi {
  static CrasherAvatar = [];
  static RipperAvatar = [];

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
      console.log(`vrclogger dl error stack: ${error}`);
      throw error;
    }
  }

  static async fetchListsBlackList() {
    try {
      const Config = await initializeConfig(); // Fetch config settings from the database
      const blacklistAvisData = await this.downloadJson(
        `${Config.ApiKeys
          .ApiEndpointUrL}/v5/games/api/vrchat/yoinker/avatarblacklist`
      );

      if (blacklistAvisData.error) {
        return blacklistAvisData.error;
      }

      // Clear existing data in the arrays
      this.CrasherAvatar = [];
      this.RipperAvatar = [];

      if (blacklistAvisData && blacklistAvisData.length > 0) {
        for (const user of blacklistAvisData) {
          if (user.crasher) {
            this.CrasherAvatar.push({
              displayName: user.displayName,
              avatarId: user.avatarId,
              userId: user.userId,
              date: user.date
            });
          }

          if (user.ripper) {
            this.RipperAvatar.push({
              displayName: user.displayName,
              avatarId: user.avatarId,
              userId: user.userId,
              date: user.date
            });
          }
        }
      }
    } catch (error) {
      LOGSCLASS.writeErrorToFile(error);
      console.log(`vrclogger list error stack: ${error}`);
    }
  }
}

module.exports = {
  APIClientVRCGAavi
};
