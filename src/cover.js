require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  console.error('Missing ANTHROPIC_API_KEY. Set it in a .env file or your shell environment.');
  process.exit(1);
}

const jobDescription = process.argv.slice(2).join(' ');
if (!jobDescription) {
  console.error('Usage: node cover.js "<job description>"');
  console.error('Or:    node cover.js "$(cat jd.txt)"');
  console.error('You will then be prompted to paste a short blurb about the company.');
  process.exit(1);
}

const masterResume = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'master-resume.json'), 'utf8'));

// Read the company blurb from stdin so long, multi-line pastes work cleanly.
function readCompanyBlurb() {
  return new Promise(resolve => {
    if (process.stdin.isTTY) {
      console.log('\nPaste a short blurb about the company (their values / mission / what they do).');
      console.log('Press Ctrl-D (Ctrl-Z then Enter on Windows) when done. Leave empty to skip:\n');
    }
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => (data += chunk));
    process.stdin.on('end', () => resolve(data.trim()));
  });
}

async function generateCoverLetter(companyBlurb) {
  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  console.log('\nAsking Claude to draft your cover letter...');

  const prompt = `You are an expert cover letter writer. Write a concise, one-page cover letter for this candidate, tailored to this specific job. It must read like a real human wrote it — warm and specific, never robotic or generic.

## Candidate's Master Resume (the ONLY source of facts about the candidate)
${JSON.stringify(masterResume, null, 2)}

## Job Description
${jobDescription}

## About the Company
${companyBlurb || '(none provided — keep the company paragraph brief and only reference what the job description itself reveals about the company)'}

## Structure (a funnel — follow these 4 beats in order, as flowing paragraphs)
1. HOOK (1–2 sentences): who the candidate is + the exact role they're applying for. Mention a referral only if one appears in the job description.
2. PROOF (the core — 1–2 paragraphs): Pick the 2–3 most important responsibilities/requirements from the job description. For EACH, prove the candidate can do it with a real story from the master resume, told using the STAR method (Situation, Task, Action, Result) COMPRESSED into a single natural sentence — e.g. "At X, where the team did Y manually, I built Z, which cut release time." Map each job requirement to concrete past experience. Never label the parts "Situation/Task/Action/Result" — weave them into prose.
3. GENUINE INTEREST (1 paragraph): why THIS company specifically. Tie the company's actual values/mission (from the "About the Company" section above) to who the candidate is. Be sincere and specific, not flattery.
4. CLOSE (1–2 sentences): a forward-looking call to action.

## Hard rules
- Use ONLY facts found in the master resume. Never invent experience, metrics, employers, or skills.
- Keep it to roughly 250–350 words — it must fit on one page.
- Open with "Dear Hiring Team," and sign off with "Yours sincerely," on its own line followed by the candidate's name on the next line.
- Output ONLY the letter text as plain markdown. No preamble, no explanation, no surrounding code fences.`;

  const response = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });

  let letter = response.content[0].text.trim();
  // Strip accidental code fences if the model wraps the output.
  letter = letter.replace(/^```(?:markdown)?\s*/i, '').replace(/\s*```$/, '').trim();

  const slug = jobDescription.slice(0, 60).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const outPath = path.join(__dirname, '..', 'output', `cover-letter-${slug}.md`);
  fs.writeFileSync(outPath, letter + '\n');

  console.log(`Done! Cover letter saved to: ${outPath}`);
}

readCompanyBlurb()
  .then(generateCoverLetter)
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
