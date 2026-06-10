const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const master = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'master-resume.json'), 'utf8'));

const SUMMARY = `Hands-on developer experienced in building and shipping production applications. Proficient in React, TypeScript, React Native, and full-stack development. Comfortable across mobile, frontend, and backend systems. Interested in roles that leverage multiple disciplines.`;

const VISIBLE_PROJECTS = ['HifdhTrack — Quran Memorisation App'];

function boldToHtml(text) {
  return text.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
}

const SKILL_LABELS = {
  languages_programming: 'Programming Languages',
  languages_spoken: 'Spoken Languages',
  mobile: 'Mobile',
  frontend: 'Frontend',
  infrastructure: 'Infrastructure / CI-CD',
  databases: 'Databases',
  ai_apis: 'AI & APIs',
  tools: 'Tools',
  hardware: 'Hardware',
};

function generateHtml() {
  const { personal, education, experience, projects, skills } = master;

  const educationHtml = education.map(e => `
<div class="entry">
  <div class="entry-header">
    <div><b>${e.institution}</b></div>
    <div class="entry-date">${e.period}</div>
  </div>
  <div><i>${e.degree}</i></div>
</div>`).join('\n');

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

  const projectsHtml = projects.filter(p => VISIBLE_PROJECTS.includes(p.name)).map(p => `
<div class="entry">
  <div class="project-header">
    <div class="project-left"><b>${p.name}</b> / <span class="project-tech">${p.tech}</span>${p.link ? ` / <a href="${p.link}" style="color: #000; text-decoration: underline; font-size: 9pt;">${p.link.replace('https://', '')}</a>` : ''}</div>
    <div class="entry-date">${p.period}</div>
  </div>
  <ul>
    ${p.bullets.map(b => `<li>${boldToHtml(b)}</li>`).join('\n    ')}
  </ul>
</div>`).join('\n');

  const skillsHtml = Object.entries(skills).map(([key, value]) => {
    const label = SKILL_LABELS[key] || key;
    const val = Array.isArray(value) ? value.join(', ') : value;
    return `<div class="skills-row"><span class="skills-label">${label}:</span> ${val}</div>`;
  }).join('\n');

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
  .summary { font-size: 10pt; line-height: 1.4; text-align: justify; margin-bottom: 2px; }
</style>
</head>
<body>

<div class="name">${personal.name}</div>
<div class="contact">${personal.phone} | <a href="mailto:${personal.email}">${personal.email}</a> | <a href="${personal.portfolio}">${personal.portfolio.replace('https://', '')}</a> | <a href="${personal.linkedin}">${personal.linkedin.replace('https://', '')}</a> | <a href="${personal.github}">${personal.github.replace('https://', '')}</a></div>

<div class="section-title">Professional Summary</div>
<div class="summary">${SUMMARY}</div>

<div class="section-title">Experience</div>
${experienceHtml}

<div class="section-title">Education</div>
${educationHtml}

<div class="section-title">Projects</div>
${projectsHtml}

<div class="section-title">Skills</div>
<div class="skills-section">
${skillsHtml}
</div>

</body>
</html>`;
}

(async () => {
  const html = generateHtml();
  const htmlPath = path.join(__dirname, '..', 'output', 'master-resume.html');
  const pdfPath = path.join(__dirname, '..', 'output', 'master-resume.pdf');

  fs.writeFileSync(htmlPath, html);

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
  console.log(`Master resume PDF saved to: ${pdfPath}`);
})();
