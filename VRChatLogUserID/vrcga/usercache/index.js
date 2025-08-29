const fetch = require("node-fetch");
const {
  LOGSCLASS,
  VRCGAPICheckUsersBLPLClass
} = require("../../../Configfiles/logsclass.js");
const { sendToWebhook } = require("../../../webhook/index.js");
const main = require("../../../main.js");

const getConfig = require("../../../functions/getConfig"); // Import the getConfig function

const {
  fetchWithRetry
} = require("../../../functions/funct-short"); // Import the getConfig function

async function initializeConfig() {
  const Config = {
    Toggle: {
      CheckUserCache: await getConfig("Toggle.CheckUserCache"),
    },
    ApiKeys: {
      Auto_Mod_Check: await getConfig("ApiKeys.Auto_Mod_Check"),
      Auto_Mod_Check_Global: await getConfig("ApiKeys.Auto_Mod_Check_Global"),
      ApiEndpointUrL: await getConfig("ApiKeys.ApiEndpointUrL")
    }
  };
  return Config;
}

async function usercacheuservrcgajoined(displayName, userId) {
  const Config = await initializeConfig(); // Fetch config settings from the database

  if (Config.Toggle.CheckUserCache == true) {
    let apiUrl;
    let apireq;
    let apimethod;

    if (Config.ApiKeys.Auto_Mod_Check == "ENTERYOURAUTOMODKEY")
      return main.log(
        "Enter your AutoMod ApiKey in Settings",
        "info",
        "blacklistlog"
      );

    if (userId) {
      apiUrl = `${Config.ApiKeys
        .ApiEndpointUrL}/v5/games/api/vrchat/yoinker/list/usercache/userid`;
      apimethod = `GET`;
      apireq = `${userId}`;
    } else {
      return; // or throw an error, depending on your requirements
    }

    switch (apimethod) {
      case "GET":
        const mytwoHeaders = {
          "vrclogger-api-key": `${Config.ApiKeys.Auto_Mod_Check}`,
          Accept: "application/json",
          "User-Agent": `VRCLogger-Project-Darkstar-Client/${getVersion.version}`
        };

        fetchWithRetry(`${apiUrl}/${apireq}`, {
          method: "GET",
          headers: mytwoHeaders // also, it should be 'headers' instead of 'mytwoHeaders'
        })
          .then(handleResponse)
          .then(handleData)
          .catch(handleError);
        break;
      case "POST":
        const myHeaders = new Headers();
        myHeaders.append(
          "vrclogger-api-key",
          `${Config.ApiKeys.Auto_Mod_Check}`
        );
        myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
        myHeaders.append("Accept", "application/json");
        myHeaders.append("User-Agent", `VRCLogger-Project-Darkstar-Client/${getVersion.version}`)

        const urlencoded = new URLSearchParams();
        urlencoded.append("username", `${apireq}`);

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
        if (response.status === 403) {
          return {
            status: 403,
            error: `API vrclogger user cache - Requires ApiKey, Please Contact NekoSuneVR for ApiKey Access`
          };
        } else if (response.status === 401) {
          return {
            status: 401,
            error: `API vrclogger user cache - Invalid ApiKey, Please check or contact NekoSuneVR`
          };
        } else if (response.status === 404) {
          console.log(
            `API vrclogger user cache - Warning User ${displayName} not found in banned users list`
          );
        } else {
          console.log(
            `API vrclogger user cache Failed to fetch data: ${response.status}`
          );
          throw new Error(
            `API vrclogger user cache  Failed to fetch data: ${response.status}`
          );
        }
      }
      return response.json();
    }

    function handleData(data) {
      if (data.status == 429) {
        main.log(
          `API vrclogger user cache - ${data.message}`,
          "info",
          "blacklistlog"
        );
        const message = `API vrclogger user cache - ${data.message}`;
        VRCGAPICheckUsersBLPLClass.writeModerationToFile(message);
        return; // or send a message to the webhook saying the user is not found
      }
      if (data.status == 404) {
        const message = `API vrclogger user cache - Warning User ${userId} not found in any database`;
        VRCGAPICheckUsersBLPLClass.writeModerationToFile(message);
        return; // or send a message to the webhook saying the user is not found
      }

      if (data.status == 403) {
        main.log(
          `API vrclogger user cache - Invalid API key, Please Check APIKEY Correct`,
          "info",
          "blacklistlog"
        );
        const message = `API vrclogger user cache - Invalid API key, Please Check APIKEY Correct`;
        VRCGAPICheckUsersBLPLClass.writeModerationToFile(message);
        return; // or send a message to the webhook saying the user is not found
      }

      if (data.status == 401) {
        main.log(
          `API vrclogger user cache - Please enter Your API key, To Get APIKEY, Contact NekoSuneVR`,
          "info",
          "blacklistlog"
        );
        const message = `API vrclogger user cache - Please enter Your API key, To Get APIKEY, Contact NekoSuneVR`;
        VRCGAPICheckUsersBLPLClass.writeModerationToFile(message);
        return; // or send a message to the webhook saying the user is not found
      }

      if (data.status == 200) {
        let message;

        if (data.bio) {
          message = `API vrclogger user cache - Cached User Found ${data.displayName} connected userID: ${data.userID} and Bio: ${data.bio} and Date-joined: ${data.dateJoined} and Last-Platform: ${data.lastPlatform}`;
        } else {
          message = `API vrclogger user cache - Cached User Found ${data.displayName} connected userID: ${data.userID} and Date-joined: ${data.dateJoined} and Last-Platform: ${data.lastPlatform}`;
        }

        main.log(
          message,
          "info",
          "blacklistlog"
        );
        VRCGAPICheckUsersBLPLClass.writeModerationToFile(message);
        sendToWebhook(message);
      }
    }

    function handleError(error) {
      console.error(error);
      const message = `API vrclogger user cache ${error}`;
      LOGSCLASS.writeErrorToFile(message);
    }
  }
}

async function usercacheuservrcgajoinedGlobal(displayName, userId) {
  const Config = await initializeConfig(); // Fetch config settings from the database

  if (Config.Toggle.CheckUserCache == true) {
    let apiUrl;
    let apireq;
    let apimethod;

    if (Config.ApiKeys.Auto_Mod_Check_Global == "ENTERYOURAUTOMODKEY")
      return main.log(
        "Global API Enter your AutoMod ApiKey in Settings",
        "info",
        "blacklistlog"
      );

    if (userId) {
      apiUrl = `https://vrcloggerpub.nekosunevr.co.uk/v5/games/api/vrchat/yoinker/list/usercache/userid`;
      apimethod = `GET`;
      apireq = `${userId}`;
    } else {
      return; // or throw an error, depending on your requirements
    }

    switch (apimethod) {
      case "GET":
        const mytwoHeaders = {
          "vrclogger-api-key": `${Config.ApiKeys.Auto_Mod_Check_Global}`,
          Accept: "application/json",
          "User-Agent": `VRCLogger-Project-Darkstar-Client/${getVersion.version}`
        };

        fetchWithRetry(`${apiUrl}/${apireq}`, {
          method: "GET",
          headers: mytwoHeaders // also, it should be 'headers' instead of 'mytwoHeaders'
        })
          .then(handleResponse)
          .then(handleData)
          .catch(handleError);
        break;
      case "POST":
        const myHeaders = new Headers();
        myHeaders.append(
          "vrclogger-api-key",
          `${Config.ApiKeys.Auto_Mod_Check_Global}`
        );
        myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
        myHeaders.append("Accept", "application/json");
        myHeaders.append("User-Agent", `VRCLogger-Project-Darkstar-Client/${getVersion.version}`)

        const urlencoded = new URLSearchParams();
        urlencoded.append("username", `${apireq}`);

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
        if (response.status === 403) {
          return {
            status: 403,
            error: `Global API vrclogger user cache - Requires ApiKey, Please Contact NekoSuneVR for ApiKey Access`
          };
        } else if (response.status === 401) {
          return {
            status: 401,
            error: `Global API vrclogger user cache - Invalid ApiKey, Please check or contact NekoSuneVR`
          };
        } else if (response.status === 404) {
          console.log(
            `Global API vrclogger user cache - Warning User ${displayName} not found in banned users list`
          );
        } else {
          console.log(
            `Global API vrclogger user cache Failed to fetch data: ${response.status}`
          );
          throw new Error(
            `Global API vrclogger user cache  Failed to fetch data: ${response.status}`
          );
        }
      }
      return response.json();
    }

    function handleData(data) {
      if (data.status == 429) {
        main.log(
          `Global API vrclogger user cache - ${data.message}`,
          "info",
          "blacklistlog"
        );
        const message = `Global API vrclogger user cache - ${data.message}`;
        VRCGAPICheckUsersBLPLClass.writeModerationToFile(message);
        return; // or send a message to the webhook saying the user is not found
      }
      if (data.status == 404) {
        const message = `Global API vrclogger user cache - Warning User ${displayName} not found in any database`;
        VRCGAPICheckUsersBLPLClass.writeModerationToFile(message);
        return; // or send a message to the webhook saying the user is not found
      }

      if (data.status == 403) {
        main.log(
          `Global API vrclogger user cache - Invalid API key, Please Check APIKEY Correct`,
          "info",
          "blacklistlog"
        );
        const message = `Global API vrclogger user cache - Invalid API key, Please Check APIKEY Correct`;
        VRCGAPICheckUsersBLPLClass.writeModerationToFile(message);
        return; // or send a message to the webhook saying the user is not found
      }

      if (data.status == 401) {
        main.log(
          `Global API vrclogger user cache - Please enter Your API key, To Get APIKEY, Contact NekoSuneVR`,
          "info",
          "blacklistlog"
        );
        const message = `Global API vrclogger user cache - Please enter Your API key, To Get APIKEY, Contact NekoSuneVR`;
        VRCGAPICheckUsersBLPLClass.writeModerationToFile(message);
        return; // or send a message to the webhook saying the user is not found
      }

      if (data.status == 200) {
        let message;

        if (data.bio) {
          message = `API vrclogger user cache - Cached User Found ${data.displayName} connected userID: ${data.userID} and Bio: ${data.bio} and Date-joined: ${data.dateJoined} and Last-Platform: ${data.lastPlatform}`;
        } else {
          message = `API vrclogger user cache - Cached User Found ${data.displayName} connected userID: ${data.userID} and Date-joined: ${data.dateJoined} and Last-Platform: ${data.lastPlatform}`;
        }

        main.log(
          message,
          "info",
          "blacklistlog"
        );
        VRCGAPICheckUsersBLPLClass.writeModerationToFile(message);
        sendToWebhook(message);
      }
    }

    function handleError(error) {
      console.error(error);
      const message = `Global API vrclogger user cache ${error}`;
      LOGSCLASS.writeErrorToFile(message);
    }
  }
}

module.exports = {
  usercacheuservrcgajoined,
  usercacheuservrcgajoinedGlobal
};
