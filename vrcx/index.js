const fs = require("fs");
const getConfig = require("../functions/getConfig"); // Import the getConfig function
const FuzzySet = require("fuzzyset");
const fetch = require("node-fetch");
const { LOGSCLASS, PlayerClass } = require("../Configfiles/logsclass.js");
const { sendToWebhook } = require("../webhook/index.js");
const { Sequelize } = require("sequelize");
const sqlite3 = require("sqlite3");
const main = require("../main");

// vrcga checkuser

// vrcga blacklist
const {
  blacklistvrcgajoined,
  blacklistvrcgajoinedGlobal
} = require("../VRChatLogUserID/vrcga/blacklist/index.js");

// vrcga automod
const {
  automoduservrcgajoined,
  automoduservrcgajoinedGlobal
} = require("../VRChatLogUserID/vrcga/automod/index.js");

// vrcga usercache
const {
  usercacheuservrcgajoined,
  usercacheuservrcgajoinedGlobal
} = require("../VRChatLogUserID/vrcga/usercache/index.js");

async function initializeConfig() {
  const Config = {
    vrcx: {
      db: await getConfig("vrcx.db")
    },
    Toggle: {
      CheckUser: await getConfig("Toggle.CheckUser"),
      CheckGroupsBL: await getConfig("Toggle.CheckGroupsBL"),
      VRNotify: await getConfig("Toggle.VRNotify"),
      CheckAutoMod: await getConfig("Toggle.CheckAutoMod"),
      CheckUser: await getConfig("Toggle.CheckUser"),
      globaltoggle: await getConfig("Toggle.globaltoggle"),
    },
    ApiKeys: {
      Auto_Mod_Check: await getConfig("ApiKeys.Auto_Mod_Check"),
      Auto_Mod_Check_Global: await getConfig("ApiKeys.Auto_Mod_Check_Global"),
      ApiEndpointUrL: await getConfig("ApiKeys.ApiEndpointUrL")
    }
  };
  return Config;
}

async function checkUserConnection(cleanedString) {
  const Config = await initializeConfig(); // Fetch config settings from the database

  let vrcxPath = Config.vrcx.db; // Ensure Config.vrcx is defined

  const databaseFilePath = vrcxPath;
  const displayNameToRetrieve = cleanedString;

  const db = new Sequelize("database", "username", "password", {
    host: "localhost",
    dialect: "sqlite",
    storage: databaseFilePath,
    logging: false // Set to true to see SQL queries in console
  });

  try {
    const result = await db.query(
      `SELECT user_id, "type", display_name 
            FROM gamelog_join_leave 
            WHERE display_name = :displayName AND "type" = 'OnPlayerJoined' 
            ORDER BY id DESC 
            LIMIT 1`,
      {
        replacements: { displayName: displayNameToRetrieve }
      }
    );

    if (result) {
      result[0].forEach(row => {
        const userId = row.user_id;
        const displayName = row.display_name;

        const timestamp = Date.now() / 1000;
        formattedLogMessage = `<t:${Math.round(
          timestamp
        )}:f> vrcx - User ${displayName} and ${userId} connected`;

        PlayerClass.writeplayerToFile(formattedLogMessage);

        blacklistvrcgajoined(displayName, userId);
        automoduservrcgajoined(displayName, userId);
        usercacheuservrcgajoined(displayName, userId);

        if (Config.Toggle.globaltoggle) {
          blacklistvrcgajoinedGlobal(displayName, userId);
          automoduservrcgajoinedGlobal(displayName, userId);
          usercacheuservrcgajoinedGlobal(displayName, userId);
        }

        if (userId) {
          const userIdString = userId.toString(); // Keep userId as string

          main.log(
            `vrcx - User ${displayName} and ${userIdString} connected and Not in Logger System`,
            "info",
            "joinleavelog"
          );
        } else {
        }
      });
    } else {
    }
    main.log(
      `vrcx - User ${displayName} connected and Not in Logger System`,
      "info",
      "joinleavelog"
    );
  } catch (error) {
    logError(error);
  } finally {
    db.close();
  }
}

async function checkUserConnectionleft(cleanedString) {
  const Config = await initializeConfig(); // Fetch config settings from the database

  let vrcxPath = Config.vrcx.db; // Ensure Config.vrcx is defined
  const databaseFilePath = vrcxPath;
  const displayNameToRetrieve = cleanedString;

  const db = new Sequelize("database", "username", "password", {
    host: "localhost",
    dialect: "sqlite",
    storage: databaseFilePath,
    logging: false // Set to true to see SQL queries in console
  });

  try {
    const result = await db.query(
      `SELECT user_id, "type", display_name 
            FROM gamelog_join_leave 
            WHERE display_name = :displayName AND "type" = 'OnPlayerLeft' 
            ORDER BY id DESC 
            LIMIT 1`,
      {
        replacements: { displayName: displayNameToRetrieve }
      }
    );

    if (result) {
      result[0].forEach(row => {
        const userId = row.user_id;
        const displayName = row.display_name;

        checkUserwatchlistleft(displayName, userId);

        const timestamp = Date.now() / 1000;
        formattedLogMessage = `<t:${Math.round(
          timestamp
        )}:f> vrcx - User ${displayName} and ${userId} disconnected`;

        PlayerClass.writeplayerToFile(formattedLogMessage);

        main.log(
          `User ID: ${userId}, Display Name: ${displayName} disconnected`,
          "info",
          "joinleavelog"
        );

        const message = `vrcx - ${displayName} and ${userId} disconnected`;

        sendToWebhook(message);
      });
    }
  } catch (error) {
    logError(error);
  } finally {
    db.close();
  }
}

function logError(error) {
  LOGSCLASS.writeErrorToFile(error.message);
  LOGSCLASS.writeErrorToFile(error.stack);
}

module.exports = {
  checkUserConnectionleft,
  checkUserConnection
};
