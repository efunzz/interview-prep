🎯 Interview Prep – AI-Powered Resume Tailoring Tool
Interview Prep is a Node.js CLI tool that tailors your master resume to any job description using Claude (Anthropic API).
It selects the most relevant experience and projects, rewrites bullet points to match the job's language and keywords, then renders the result as a clean PDF using Puppeteer. Built as a personal project to cut down the time spent rewriting resumes for every application.

📦 Technologies
Node.js
Anthropic SDK (@anthropic-ai/sdk) – Claude API
Puppeteer
dotenv
Vanilla HTML/CSS (resume template)

✨ Features
AI-Powered Resume Tailoring
Takes a job description and selects the most relevant experience entries (max 4) from your master resume.
Picks 3–4 most relevant projects, dropping unrelated ones.
Rewrites bullet points using the job description's keywords and framing — content stays truthful, emphasis shifts.
Bolds important keywords and technologies inline in each bullet.
Generates a tailored skills section based only on what's relevant to the role.
PDF Generation
Renders the tailored resume to a single-page A4 PDF via Puppeteer.
Clean Times New Roman typography, designed to pass ATS scanners.
Auto-named output file based on the job description slug.
Master Resume as Single Source of Truth
One master-resume.json file holds every role, project, and skill.
Each application generates a tailored subset — no more maintaining a dozen resume variants.

🎯 User Interactions
Run node tailor.js "<job description>" from the command line
Pipe a JD from a file: node tailor.js "$(cat jd.txt)"
Open the resulting PDF (named after the job description) in any viewer
Edit master-resume.json to add or update entries — tailored runs always pull the latest

👩🏽‍🍳 Development Process
Designed master-resume.json as a structured data source for personal info, experience, projects, and skills.
Built the Claude prompt in tailor.js to enforce strict JSON output describing the tailored selection and rewrites.
Wrote an HTML generator that turns Claude's JSON into a print-ready resume document.
Used Puppeteer to render the HTML to a single-page A4 PDF with controlled margins and typography.
Added a separate generate-pdf.js script to render the static resume-template.html directly when no tailoring is needed.
Set up dotenv for API key handling so the secret never lives in code.

🚦 Running the Project
To run the project locally, follow these steps:

Clone the repository to your machine.
Install dependencies: npm install
Create a .env file with your Anthropic API key (see .env.example for the format):
ANTHROPIC_API_KEY=sk-ant-...
Edit master-resume.json with your personal info, experience, projects, and skills.
Run the tailor with a job description:
node tailor.js "Software Engineer at Example Corp. Looking for someone with React and TypeScript experience..."
Find the generated PDF in the project root: resume-<job-slug>.pdf
