const puppeteerExtra = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteerExtra.use(StealthPlugin());

(async () => {
  const browser = await puppeteerExtra.launch({ headless: true, protocolTimeout: 60000 });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  page.on('response', async (res) => {
    if (res.url().includes('kickstarter.com/graph')) {
      try {
        const text = await res.text();
        console.log('GRAPH len=' + text.length + ':', text.substring(0, 400));
        console.log('---');
      } catch(e) { console.log('GRAPH err:', e.message); }
    }
  });

  await page.goto('https://www.kickstarter.com/projects/cmon/rum-and-bones-second-tide/posts', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 10000));
  console.log('done');
  await browser.close();
})().catch(e => console.error(e.message));
