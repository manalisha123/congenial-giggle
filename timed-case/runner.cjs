const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

async function main() {
  const risk = process.argv[2];
  if (!['mobile', 'promotion'].includes(risk) || process.argv.length !== 3) {
    throw new Error('Choose one: npm run check -- mobile OR npm run check -- promotion');
  }
  const check = require('./submission/Artifact/check.cjs');
  if (typeof check !== 'function') throw new Error('check.cjs must export an async check function.');
  const viewports = risk === 'mobile'
    ? [{ width: 402, height: 600 }, { width: 440, height: 600 }]
    : [{ width: 402, height: 600 }];
  const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${process.pid}`;
  const output = path.join(__dirname, 'submission', 'Execution', runId);
  fs.mkdirSync(output, { recursive: true });
  const summary = [`Risk: ${risk}`, `Command: npm run check -- ${risk}`, `Started: ${new Date().toISOString()}`];
  let browser;
  let failed = false;
  try {
    browser = await chromium.launch();
    for (const build of ['reference', 'release']) {
      for (const viewport of viewports) {
        const label = `${build}-${viewport.width}x${viewport.height}`;
        const baseURL = `http://127.0.0.1:${process.env.PORT || 4173}/${build}/`;
        const lines = [`${label} ${baseURL}`, `Started: ${new Date().toISOString()}`];
        let context;
        let page;
        let traceStarted = false;
        try {
          context = await browser.newContext({ viewport });
          page = await context.newPage();
          page.setDefaultTimeout(5000);
          await context.tracing.start({ screenshots: true, snapshots: true });
          traceStarted = true;
          await page.goto(baseURL);
          await check(page, baseURL, viewport);
          lines.push('PASS');
        } catch (error) {
          failed = true;
          lines.push('FAIL', error.stack || String(error));
          if (page) {
            try {
              await page.screenshot({ path: path.join(output, `${label}-failure.png`) });
            } catch (captureError) {
              lines.push(`Screenshot unavailable: ${captureError.message}`);
            }
          }
        } finally {
          if (traceStarted) {
            try {
              await context.tracing.stop({ path: path.join(output, `${label}-trace.zip`) });
            } catch (traceError) {
              failed = true;
              lines.push(`Trace unavailable: ${traceError.message}`);
            }
          }
          if (context) {
            try { await context.close(); }
            catch (closeError) { failed = true; lines.push(`Cleanup error: ${closeError.message}`); }
          }
          lines.push(`Finished: ${new Date().toISOString()}`);
          fs.writeFileSync(path.join(output, `${label}.log`), lines.join('\n') + '\n');
          summary.push(...lines, '');
          console.log(lines.join('\n'));
        }
      }
    }
  } catch (error) {
    failed = true;
    summary.push(`Runner error: ${error.stack || error}`);
  } finally {
    if (browser) {
      try { await browser.close(); }
      catch (error) { failed = true; summary.push(`Browser cleanup error: ${error.message}`); }
    }
    summary.push(`Finished: ${new Date().toISOString()}`);
    fs.writeFileSync(path.join(output, 'summary.log'), summary.join('\n') + '\n');
    console.log(`Evidence saved to ${output}`);
  }
  if (failed) process.exitCode = 1;
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
