const puppeteer = require('puppeteer');
const path = require('path');

const jobName = process.argv[2];

if (!jobName) {
  console.error('Usage: node generate-pdf.js <job-name>');
  console.error('Example: node generate-pdf.js csit-collaboration-platform-engineer');
  process.exit(1);
}

const slug = jobName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const templatePath = path.resolve(__dirname, '..', 'templates', 'resume-template.html');
const outputPath = path.resolve(__dirname, '..', 'output', `resume-${slug}.pdf`);

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('file://' + templatePath, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '0', bottom: '0', left: '0', right: '0' },
  });
  await browser.close();
  console.log(`Generated: ${outputPath}`);
})();
