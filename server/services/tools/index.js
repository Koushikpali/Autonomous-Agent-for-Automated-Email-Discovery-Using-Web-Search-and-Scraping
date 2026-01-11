import search from "./search.js";
import scrape from "./scrape.js";

const registry = { search,scrape};

export default {
  getTool(action) {
    console.log("[TOOLS] Registry lookup:", action);
    return registry[action];
  },
  
};

