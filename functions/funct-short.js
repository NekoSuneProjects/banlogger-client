const fetch = require("node-fetch");

async function fetchWithRetry(url, options, retries = 10, delayMs =  5 * 1000) {
  try {
    const response = await fetch(url, options);
    if (response.status === 503 && response.status === 500 && response.status === 504 && retries > 0) {
      // Optionally log the 503 response
      console.warn(`Received ${response.status}. Retrying in ${delayMs} ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return fetchWithRetry(url, options, retries - 1, delayMs * 2); // Exponential backoff
    }
    return response;
  } catch (error) {
    if (retries > 0) {
      console.warn(`Fetch error. Retrying in ${delayMs} ms...`, error);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return fetchWithRetry(url, options, retries - 1, delayMs * 2);
    }
    throw error;
  }
}

module.exports = {
    fetchWithRetry
};
