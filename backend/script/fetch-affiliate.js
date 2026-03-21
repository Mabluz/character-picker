#!/usr/bin/env node
"use strict";

/**
 * fetch-affiliate.js <affiliate-link> <path-to-load.json> [--limit N]
 *
 * Fetches an Amazon affiliate/search page, extracts the first N products
 * (default 6), and writes an "affiliate" block into the given load.json.
 *
 * Usage:
 *   node script/fetch-affiliate.js "https://amzn.to/..." backend/games/my-game/load.json
 *   node script/fetch-affiliate.js "https://amzn.to/..." backend/games/my-game/load.json --limit 3
 */

const fs = require("fs");
const path = require("path");

async function main() {
  const args = process.argv.slice(2);

  const limitIndex = args.indexOf("--limit");
  let limit = 6;
  if (limitIndex !== -1) {
    limit = parseInt(args[limitIndex + 1], 10);
    if (isNaN(limit) || limit < 1) {
      console.error("--limit must be a positive number");
      process.exit(1);
    }
    args.splice(limitIndex, 2);
  }

  const [affiliateLink, loadJsonPath] = args;

  if (!affiliateLink || !loadJsonPath) {
    console.error(
      "Usage: node fetch-affiliate.js <affiliate-link> <path-to-load.json> [--limit N]"
    );
    process.exit(1);
  }

  const resolvedPath = path.resolve(
    loadJsonPath.replace(/^[/\\]*backend[/\\]/, "")
  );
  if (!fs.existsSync(resolvedPath)) {
    console.error(`load.json not found: ${resolvedPath}`);
    process.exit(1);
  }

  let puppeteer;
  try {
    puppeteer = require("puppeteer");
  } catch {
    console.error("puppeteer is not installed. Run: npm install puppeteer");
    process.exit(1);
  }

  console.log(`Fetching: ${affiliateLink} (limit: ${limit})`);

  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  );
  await page.setViewport({ width: 1280, height: 900 });

  await page.goto(affiliateLink, { waitUntil: "networkidle2", timeout: 30000 });

  // Wait a moment for lazy-loaded images
  await new Promise(r => setTimeout(r, 2000));

  const products = await page.evaluate(() => {
    const results = [];

    // Amazon search results — each result is [data-component-type="s-search-result"]
    const searchItems = document.querySelectorAll(
      '[data-component-type="s-search-result"]'
    );

    if (searchItems.length > 0) {
      for (const item of searchItems) {
        const brandEl = item.querySelector(
          "h2.a-size-mini span, h2.a-color-secondary span"
        );
        const productEl =
          item.querySelector("h2.a-color-base.a-text-normal span") ||
          item.querySelector("h2[aria-label]") ||
          item.querySelector("h2 a span");
        const imgEl = item.querySelector("img.s-image");

        const brand = brandEl ? brandEl.textContent.trim() : null;
        const product = productEl
          ? (
              productEl.getAttribute("aria-label") || productEl.textContent
            ).trim()
          : null;
        const title =
          brand && product ? `${brand} - ${product}` : product || brand;
        const image = imgEl
          ? imgEl.getAttribute("src") || imgEl.getAttribute("data-src")
          : null;

        if (title && image) {
          results.push({ title, image });
        }
      }
    }

    // Amazon idea lists / curated lists
    if (results.length === 0) {
      const listItems = document.querySelectorAll(".a-cardui, [data-asin]");
      for (const item of listItems) {
        const titleEl = item.querySelector(".a-text-normal, [class*='title']");
        const imgEl = item.querySelector("img");

        const title = titleEl
          ? (titleEl.getAttribute("aria-label") || titleEl.textContent).trim()
          : null;
        const image = imgEl
          ? imgEl.getAttribute("src") ||
            imgEl.getAttribute("data-src") ||
            imgEl.getAttribute("data-a-dynamic-image")
          : null;

        // data-a-dynamic-image is a JSON object {"url": size} — extract first key
        let resolvedImage = image;
        if (image && image.startsWith("{")) {
          try {
            resolvedImage = Object.keys(JSON.parse(image))[0];
          } catch {
            resolvedImage = null;
          }
        }

        if (title && resolvedImage) {
          results.push({ title, image: resolvedImage });
        }
      }
    }

    return results;
  });

  await browser.close();

  if (products.length === 0) {
    console.error(
      "No products found on the page. The page structure may have changed or access was blocked."
    );
    process.exit(1);
  }

  console.log(`Found ${products.length} product(s).`);

  const getType = title => {
    const words = (title || "").toLowerCase().split(/\W+/);
    for (const word of words) {
      if (word === "sleeve" || word === "sleeves") return "sleeves";
      if (word === "expansion" || word === "expansions") return "expansion";
      if (word === "pack" || word === "packs") return "expansion";
      if (word === "organizer" || word === "organizers") return "other";
      if (word === "insert" || word === "inserts") return "other";
      if (word === "dice") return "other";
      if (word === "coin" || word === "coins") return "other";
    }
    return "game";
  };

  const ads = products.slice(0, limit).map(({ title, image }) => ({
    partner: "amazon",
    title,
    link: affiliateLink,
    image,
    type: getType(title)
  }));

  // Read and update load.json
  const loadJson = JSON.parse(fs.readFileSync(resolvedPath, "utf8"));
  loadJson.affiliate = { ads };
  fs.writeFileSync(resolvedPath, JSON.stringify(loadJson, null, 2), "utf8");

  console.log(`Written ${ads.length} affiliate ad(s) to ${resolvedPath}`);
  ads.forEach((ad, i) => console.log(`  [${i + 1}] ${ad.title}`));
}

main().catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});
