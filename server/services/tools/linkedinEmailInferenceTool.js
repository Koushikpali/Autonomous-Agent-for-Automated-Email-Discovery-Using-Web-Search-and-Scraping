import puppeteer from "puppeteer";

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

/* ================= LOGIN ================= */
async function loginLinkedIn(page, email, password) {
  console.log("\n=== LOGIN START ===");
  console.log("📧 Using email:", email);

  await page.goto("https://www.linkedin.com/login", {
    waitUntil: "domcontentloaded",
  });
  console.log("🌐 Login page loaded");

  await page.type("#username", email, { delay: 50 });
  await page.type("#password", password, { delay: 50 });
  console.log("⌨️ Credentials typed");

  await page.click("button[type=submit]");
  console.log("🔘 Submit clicked");

  await page.waitForNavigation({ waitUntil: "domcontentloaded" });
  console.log("⏳ Navigation after login...");

  if (page.url().includes("/feed")) {
    console.log("✅ Logged in to LinkedIn successfully");
    console.log("=== LOGIN END ===\n");
    return true;
  }

  throw new Error("❌ Login failed — check credentials");
}

/* ================= COMPANY EMPLOYEES ================= */
async function getCompanyEmployeeProfiles(page, companyUrl, limit = 20) {
  console.log("\n=== COMPANY EMPLOYEES START ===");
  console.log("🏢 Company URL:", companyUrl);

  await page.goto(`${companyUrl}people/`, {
    waitUntil: "domcontentloaded",
  });
  console.log("🌐 Company people page loaded");

  await page.waitForTimeout(3000);

  const profiles = await page.evaluate(() =>
    Array.from(document.querySelectorAll("a"))
      .map((a) => a.href)
      .filter((h) => h.includes("linkedin.com/in"))
  );

  const uniqueProfiles = [...new Set(profiles)].slice(0, limit);
  console.log("👥 Profiles discovered:", uniqueProfiles.length);
  uniqueProfiles.forEach((p, i) => console.log(`➡️ [${i}] ${p}`));

  console.log("=== COMPANY EMPLOYEES END ===\n");
  return uniqueProfiles;
}

/* ================= PROFILE EMAIL SCAN ================= */
async function scanProfile(profileUrl, page) {
  console.log("\n=== PROFILE SCAN START ===");
  console.log("🔗 Profile URL:", profileUrl);

  if (!profileUrl.includes("linkedin.com/in")) {
    throw new Error("❌ Not a LinkedIn profile URL");
  }

  const contactUrl = `${profileUrl}/overlay/contact-info/`;
  console.log("📂 Contact info URL:", contactUrl);

  try {
    await page.goto(contactUrl, { waitUntil: "domcontentloaded" });
    console.log("🌐 Contact info page loaded");

   await new Promise((resolve) => setTimeout(resolve, 2000));


    const text = await page.evaluate(() => document.body.innerText);
    const emails = text.match(EMAIL_REGEX) || [];

    if (emails.length) {
      console.log("✅ Emails found:", emails);
    } else {
      console.log("⛔ No email found");
    }

    console.log("=== PROFILE SCAN END ===\n");
    return emails;
  } catch (err) {
    console.error("❌ Profile error:", err.message);
    return [];
  }
}

/* ================= BULK SCAN ================= */
async function bulkRun(profiles, page) {
  console.log("\n=== BULK SCAN START ===");
  const allEmails = [];

  for (const [i, profile] of profiles.entries()) {
    console.log(`\n➡️ Bulk scan profile [${i}]`);
    const emails = await scanProfile(profile, page);
    allEmails.push(...emails);
  }

  const uniqueEmails = [...new Set(allEmails)];
  console.log("\n🎯 Unique emails collected:", uniqueEmails.length);
  uniqueEmails.forEach((e, i) => console.log(`📧 [${i}] ${e}`));

  console.log("=== BULK SCAN END ===\n");
  return uniqueEmails;
}

/* ================= MAIN ================= */
export default async function linkedinInferenceRun({ url }) {
  console.log("\n================ MAIN START ================");

  const LINKEDIN_EMAIL = "palikoushikg@gmail.com";
  const LINKEDIN_PASSWORD = "9425872154";

  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(0);

  try {
    await loginLinkedIn(page, LINKEDIN_EMAIL, LINKEDIN_PASSWORD);

    if (url.includes("linkedin.com/in/")) {
      console.log("🔍 Detected LinkedIn personal profile");

      const emails = await scanProfile(url, page);
      if (emails.length > 0) {
        console.log("📧 Emails found on profile:", emails);
      } else {
        console.log(
          "⛔ No email found — you can now call your inference tool here"
        );
      }
    } else if (url.includes("linkedin.com/company/")) {
      console.log("🏢 Detected LinkedIn company page");

      const profiles = await getCompanyEmployeeProfiles(page, url, 10);
      console.log("👥 Employee profiles:", profiles);

      const emails = await bulkRun(profiles, page);
      console.log("📧 Emails from employees:", emails);
    } else {
      console.log("❌ Unsupported LinkedIn URL:", url);
    }
  } catch (err) {
    console.error("🔥 Fatal error:", err.message);
  } finally {
    await browser.close();
    console.log("🧯 Browser closed");
    console.log("================ MAIN END ================\n");
  }
}

// Example usage
// linkedinInferenceRun({
//   url: "https://www.linkedin.com/in/paras-khandelwal/",
// });
