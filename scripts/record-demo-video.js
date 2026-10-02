/**
 * Automated Headless Browser Screen Recording Script for Raddad AI SaaS Engine
 * 
 * Requirements:
 * npx playwright install chromium
 * 
 * Usage:
 * node scripts/record-demo-video.js
 * 
 * Result:
 * Automatically launches the web app, clicks the "Auto-Play Live Demo" button,
 * records the 30-second automated walkthrough in 1080p Full HD, and saves
 * an MP4/WebM video file ready to upload to Acquire.com or Flippa!
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function runDemoRecorder() {
  const outputDir = path.resolve(__dirname, '../demo-recordings');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const targetUrl = process.env.APP_URL || 'http://localhost:3000';
  console.log(`🎬 Starting Automated Demo Recorder on: ${targetUrl}`);

  const browser = await chromium.launch({
    headless: false, // Set to true if running on a headless CI server
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: outputDir,
      size: { width: 1920, height: 1080 },
    },
  });

  const page = await context.newPage();

  console.log('🌐 Loading Raddad SaaS Dashboard...');
  await page.goto(targetUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  console.log('▶️ Triggering Auto-Play Live Demo Tour...');
  const autoDemoBtn = await page.$('button:has-text("Auto-Play Live Demo")');
  if (autoDemoBtn) {
    await autoDemoBtn.click();
  }

  console.log('⏱️ Recording automated tour sequence (35 seconds)...');
  // Allow the automated conversation tour to play through
  await page.waitForTimeout(35000);

  console.log('💾 Finalizing video recording...');
  await context.close();
  await browser.close();

  console.log(`✅ Recording complete! Video saved in: ${outputDir}`);
  console.log('👉 You can convert the .webm to MP4 using: ffmpeg -i video.webm demo.mp4');
}

runDemoRecorder().catch(console.error);
