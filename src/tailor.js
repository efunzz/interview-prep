require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  console.error('Missing ANTHROPIC_API_KEY. Set it in a .env file or your shell environment.');
  process.exit(1);
}

const jobDescription = process.argv.slice(2).join(' ');
if (!jobDescription) {
  console.error('Usage: node tailor.js "<job description>"');
  console.error('Or:    node tailor.js "$(cat jd.txt)"');
  process.exit(1);
}

const masterResume = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'master-resume.json'), 'utf8'));

function boldToHtml(text) {
  return text.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
}

function generateHtml(tailored) {
  const { experience, projects, skills } = tailored;
  const { personal, education } = masterResume;

  const experienceHtml = experience.map(e => `
<div class="entry">
  <div class="entry-header">
    <div class="entry-role">${e.role}</div>
    <div class="entry-date">${e.period}</div>
  </div>
  <div class="entry-company">${e.company}</div>
  <ul>
    ${e.bullets.map(b => `<li>${boldToHtml(b)}</li>`).join('\n    ')}
  </ul>
</div>`).join('\n');

  const projectsHtml = projects.map(p => `
<div class="entry">
  <div class="project-header">
    <div class="project-left"><b>${p.name}</b> / <span class="project-tech">${p.tech}</span></div>
    <div class="entry-date">${p.period}</div>
  </div>
  <ul>
    ${p.bullets.map(b => `<li>${boldToHtml(b)}</li>`).join('\n    ')}
  </ul>
</div>`).join('\n');

  const skillsHtml = Object.entries(skills).map(([label, value]) =>
    `<div class="skills-row"><span class="skills-label">${label}:</span> ${value}</div>`
  ).join('\n');

  const educationHtml = education.map(e => `
<div class="entry">
  <div class="entry-header">
    <div><b>${e.institution}</b></div>
    <div class="entry-date">${e.period}</div>
  </div>
  <div><i>${e.degree}</i></div>
</div>`).join('\n');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page { margin: 0.4in 0.55in; size: A4; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Times New Roman', Times, serif; font-size: 10.5pt; line-height: 1.35; color: #000; }

  .name { text-align: center; font-size: 28pt; font-weight: bold; margin-bottom: 0px; }
  .contact { text-align: center; font-size: 9pt; margin-bottom: 2px; }
  .contact a { color: #000; text-decoration: underline; }

  .section-title {
    font-size: 14pt;
    border-bottom: 2px solid #000;
    padding-bottom: 1px;
    margin-top: 6px;
    margin-bottom: 4px;
  }

  .entry { margin-bottom: 6px; }
  .entry-header { display: flex; justify-content: space-between; align-items: baseline; }
  .entry-role { font-weight: bold; font-size: 10.5pt; }
  .entry-date { font-size: 10.5pt; white-space: nowrap; text-align: right; }
  .entry-company { font-style: italic; font-size: 10.5pt; }

  .project-header { display: flex; justify-content: space-between; align-items: baseline; }
  .project-left { font-size: 10.5pt; margin-right: 8px; }
  .project-tech { font-style: italic; }

  ul { list-style: none; margin-left: 6px; margin-bottom: 0; padding-left: 0; }
  li { margin-bottom: 0.5px; font-size: 10pt; line-height: 1.35; padding-left: 14px; text-indent: -14px; }
  li::before { content: "• "; }

  .skills-section { margin-top: 1px; }
  .skills-row { font-size: 9.5pt; margin-bottom: 0px; line-height: 1.3; }
  .skills-label { font-weight: bold; }
</style>
</head>
<body>

<div class="name">${personal.name}</div>
<div class="contact">${personal.phone} | <a href="mailto:${personal.email}">${personal.email}</a> | <a href="${personal.linkedin}">${personal.linkedin.replace('https://', '')}</a> | <a href="${personal.github}">${personal.github.replace('https://', '')}</a></div>

<div class="section-title">Education</div>
${educationHtml}

<div class="section-title">Experience</div>
${experienceHtml}

<div class="section-title">Projects</div>
${projectsHtml}

<div class="section-title">Skills</div>
<div class="skills-section">
${skillsHtml}
</div>

</body>
</html>`;
}

async function tailorResume() {
  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  console.log('Asking Claude to tailor your resume...');

  const prompt = `You are an expert resume writer. Given a master resume and a job description, produce a tailored resume in JSON.

## Master Resume
${JSON.stringify(masterResume, null, 2)}

## Job Description
${jobDescription}

## Instructions
- Select the most relevant experience entries (max 4). Drop irrelevant ones — e.g. don't include customer service roles for a pure technical job, don't include repair technician for a non-technical role.
- Select the most relevant projects (max 3-4).
- Rewrite bullet points to be tailored to this specific job — use language, keywords, and framing from the JD. Keep them truthful but reposition what's emphasised.
- Use **bold** markdown around important keywords and technologies in bullet points.
- For skills, only include skills relevant to this job. Format as key: value pairs where key is a category label and value is a comma-separated string.
- Keep bullets concise and impactful (1-2 lines max each).

Return ONLY valid JSON in this exact shape, no explanation:
{
  "experience": [
    {
      "role": "...",
      "company": "...",
      "period": "...",
      "bullets": ["bullet with **bold keywords**", "..."]
    }
  ],
  "projects": [
    {
      "name": "...",
      "tech": "...",
      "period": "...",
      "bullets": ["..."]
    }
  ],
  "skills": {
    "Category Label": "skill1, skill2, skill3"
  }
}`;

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = response.content[0].text.trim();
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Claude did not return valid JSON');

  const tailored = JSON.parse(jsonMatch[0]);

  console.log('Generating HTML...');
  const html = generateHtml(tailored);

  const slug = jobDescription.slice(0, 60).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const htmlPath = path.join(__dirname, '..', 'output', `resume-${slug}.html`);
  const pdfPath = path.join(__dirname, '..', 'output', `resume-${slug}.pdf`);

  fs.writeFileSync(htmlPath, html);

  console.log('Generating PDF...');
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('file://' + htmlPath, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '0', bottom: '0', left: '0', right: '0' },
  });
  await browser.close();

  fs.unlinkSync(htmlPath);
  console.log(`Done! Resume saved to: ${pdfPath}`);
}

tailorResume().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
