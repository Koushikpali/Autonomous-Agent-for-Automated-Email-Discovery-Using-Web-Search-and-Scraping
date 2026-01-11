// server/services/tools/scrape.js
import puppeteer from "puppeteer";
import linkedinInferenceRun from "./linkedinEmailInferenceTool.js";
import StepHistory from "../../models/StepHistory.js";

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

/**
 * Extract pending search URLs from step history until a scrape action is found.
 */
export function getPendingSearchUrls(stepHistory) {
  console.log("[getPendingSearchUrls] Extracting URLs from step history...");
  const urls = [];

for (const step of [...stepHistory].reverse()) {
  console.log("↳ Step:", step.action);

  // if (step.action === "scrape") {
  //   console.log("⛔ Found 'scrape' action, stopping URL extraction.");
  //   break;
  // }

  if (step.action === "search" && Array.isArray(step.tool_result)) {
    console.log("✅ Found search results, extracting URLs...");
    for (const item of step.tool_result) {
      if (item?.url) {
        console.log("➕ URL added:", item.url);
        urls.push(item.url);
      }
    }
  }
}

  const uniqueUrls = [...new Set(urls)];
  console.log("[getPendingSearchUrls] Final unique URLs:", uniqueUrls);
  return uniqueUrls;
}

/**
 * Main scrape function: orchestrates scraping of all pending URLs.
 */
export default async function scrape(headless = false) {
  console.log("\n[SCRAPE] Starting scrape process...");

  // 1️⃣ Fetch all history, sorted oldest → newest
  console.log("[SCRAPE] Fetching step history from DB...");
  const stepHistory = await StepHistory.find({}).sort({ timestamp: 1 }).lean();
  console.log("[SCRAPE] Total steps fetched:", stepHistory.length);

  // 2️⃣ Slice until last scrape
  const lastScrapeIndex = stepHistory.findIndex((s) => s.action === "scrape");
  const relevantHistory =
    lastScrapeIndex >= 0
      ? stepHistory.slice(0, lastScrapeIndex + 1)
      : stepHistory;
  console.log("[SCRAPE] Last scrape index:", lastScrapeIndex);
  // console.log("[SCRAPE] Relevant history length:", relevantHistory.length);
   console.log("[SCRAPE] Relevant history", stepHistory);
  // 3️⃣ Extract URLs
  const urls = getPendingSearchUrls(stepHistory);
  console.log("[SCRAPE] URLs to scrape:", urls);

  const results = [];

  // 4️⃣ Scrape EACH url
  for (const url of urls) {
    console.log("\n[SCRAPE] Processing URL:", url);
    const result = await run(url, headless);
    results.push({ url, result });
    console.log("[SCRAPE] Finished scraping:", url);
  }

  console.log(
    "\n[SCRAPE] All scraping complete. Results count:",
    results.length
  );
  return results;
}

/**
 * Run scraper for a single URL.
 */
async function run(url, headless = true) {
  if (!url) throw new Error("URL is required");

  console.log("\n[RUN] Launching browser for URL:", url);

  const browser = await puppeteer.launch({
    headless,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(30000);

  let emails = new Set();
  let forms = [];
  let pagesVisited = 0;

  try {
    // LinkedIn special inference
    if (url.includes("linkedin.com/in")) {
      console.log("[RUN] LinkedIn profile detected, running inference...");
      const inferred = await linkedinInferenceRun({
        recruiterProfiles: [{ name: "Unknown Recruiter", url }],
        companyDomain: new URL(url).hostname.replace(/^www\./, ""),
        emailPattern: "first.last",
      });
      inferred.forEach((i) => {
        console.log("  ➕ Inferred email:", i.email);
        emails.add(i.email);
      });
    }

    console.log("[RUN] Navigating to page...");
    await page.goto(url, { waitUntil: "domcontentloaded" });
    pagesVisited++;
    console.log("[RUN] Page loaded. Pages visited:", pagesVisited);

    const html = await page.content();
    const foundEmails = html.match(EMAIL_REGEX) || [];
    console.log("[RUN] Emails found in HTML:", foundEmails);
    foundEmails.forEach((e) => emails.add(e));

    forms = await page.evaluate(() =>
      Array.from(document.querySelectorAll("form")).map((f) => ({
        url: location.href,
        type: f.getAttribute("id") || "contact",
      }))
    );
    console.log("[RUN] Forms detected:", forms);

    return {
      ok: true,
      emails: [...emails],
      forms,
      pagesVisited,
    };
  } catch (err) {
    console.error("[RUN] Error scraping URL:", url, "→", err.message);
    return {
      ok: false,
      error: err.message,
    };
  } finally {
    console.log("[RUN] Closing browser for URL:", url);
    await browser.close();
  }
}
