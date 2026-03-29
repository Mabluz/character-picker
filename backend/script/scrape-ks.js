const puppeteerExtra = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

const URL = "https://www.kickstarter.com/projects/cmon/starcadia-quest/posts";

puppeteerExtra.use(StealthPlugin());

(async () => {
  const browser = await puppeteerExtra.launch({ headless: true, protocolTimeout: 60000 });
  const page = await browser.newPage();

  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  const allPosts = new Map();

  const extractPosts = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) { obj.forEach(extractPosts); return; }
    if (obj.__typename === 'FreeformPost' && obj.id && obj.title && obj.number) {
      const decoded = Buffer.from(obj.id, 'base64').toString('utf8');
      const numericId = decoded.split('-').pop();
      allPosts.set(numericId, {
        number: obj.number,
        title: obj.title,
        url: `${URL}/${numericId}`,
        published: obj.publishedAt ? new Date(obj.publishedAt * 1000).toISOString().split('T')[0] : null,
        body: obj.body || null,
      });
      return;
    }
    Object.values(obj).forEach(extractPosts);
  };

  page.on('response', async (response) => {
    if (response.url() === 'https://www.kickstarter.com/graph') {
      try {
        const json = await response.json();
        if (JSON.stringify(json).includes('FreeformPost')) extractPosts(json);
      } catch (e) {}
    }
  });

  await page.goto(`${URL}`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  for (let round = 0; round < 15; round++) {
    if (allPosts.size >= 82) break;

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise(r => setTimeout(r, 400));

    const buttons = await page.$$('button.kds-button');
    let clicked = false;
    for (const btn of buttons) {
      const text = await btn.evaluate(el => el.textContent.trim());
      if (text === 'Load more') { await btn.click(); clicked = true; break; }
    }
    if (!clicked) break;

    await page.waitForNetworkIdle({ idleTime: 1500, timeout: 10000 }).catch(() => {});
  }

  const results = [...allPosts.values()].sort((a, b) => b.number - a.number);
  if (results.length === 0) {
    console.error('No posts collected — Cloudflare may be blocking requests. Try again in a few minutes.');
    await browser.close();
    process.exit(1);
  }
  const outPath = path.resolve(__dirname, '../..', 'ks-scrape.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`Saved ${results.length} posts to ${outPath}`);
  await browser.close();
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
