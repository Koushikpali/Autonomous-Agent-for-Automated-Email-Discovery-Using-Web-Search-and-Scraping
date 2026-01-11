// server/services/tools/search.js
import puppeteer from "puppeteer";

export default async function search(query, maxResults = 10, headless = true) {
  console.log("\n[SEARCH] DuckDuckGo tool start");
  console.log("📥 Query:", query);

  if (!query) throw new Error("query is required");

  const start = Date.now();
  const browser = await puppeteer.launch({
    headless,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  try {
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
    );
    await page.setViewport({ width: 1366, height: 768 });

    const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(
      query
    )}&kl=in-en&ia=web`;
    await page.goto(searchUrl, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.waitForSelector("a[data-testid='result-title-a']", {
      timeout: 20000,
    });

    const rawResults = await page.evaluate(() => {
      return Array.from(
        document.querySelectorAll("article[data-testid='result']")
      ).map((el) => {
        const a = el.querySelector("a[data-testid='result-title-a']");
        const title = a?.innerText || "";
        const url = a?.href || "";
        const snippet =
          el.querySelector("[data-result='snippet']")?.innerText || "";
        return { title, url, snippet };
      });
    });

    // Normalize into your system’s expected data format
    const data = rawResults
      .filter((r) => r.url && r.url.startsWith("http"))
      .slice(0, maxResults)
      .map((r) => ({
        url: r.url,
        title: r.title,
        snippet: r.snippet,
        source: "duckduckgo",
      }));

    const envelope = {
      ok: true,
      tool: "search",
      data,
      meta: {
        latency_ms: Date.now() - start,
        retries: 0,
      },
    };

    console.log("[SEARCH] Envelope:", JSON.stringify(envelope, null, 2));
    return envelope;
  } catch (err) {
    console.error("[SEARCH] Error:", err.message);
    return {
      ok: false,
      tool: "search",
      data: [],
      meta: { latency_ms: Date.now() - start, retries: 0 },
      error: err.message,
    };
  } finally {
    await browser.close();
    console.log("[SEARCH] Browser closed");
  }
}
