import nodeHtmlToImage from 'node-html-to-image';
import { readFileSync } from 'fs';

const html = readFileSync(
  'C:/Users/PrathamKakkad(AppDBM/.gemini/antigravity/brain/49282119-c21b-471c-9d99-25ec6a0f1124/scratch/architecture_diagram.html',
  'utf8'
);

await nodeHtmlToImage({
  output: 'C:/Users/PrathamKakkad(AppDBM/.gemini/antigravity/brain/49282119-c21b-471c-9d99-25ec6a0f1124/plm_architecture_diagram.png',
  html,
  puppeteerArgs: {
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  },
  encoding: 'binary',
  transparent: false,
  waitUntil: 'networkidle0',
  beforeScreenshot: async (page) => {
    const h = await page.evaluate(() => document.body.scrollHeight);
    await page.setViewport({ width: 1100, height: h + 60 });
  },
});

console.log('Done!');
