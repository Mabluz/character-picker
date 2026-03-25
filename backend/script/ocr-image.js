#!/usr/bin/env node
'use strict';

const { createWorker } = require('tesseract.js');

const url = process.argv[2];

if (!url) {
  console.error('Usage: node scripts/ocr-image.js <image-url>');
  process.exit(1);
}

(async () => {
  const worker = await createWorker('eng');
  const { data: { text } } = await worker.recognize(url);
  await worker.terminate();
  console.log(text.trim());
})();
