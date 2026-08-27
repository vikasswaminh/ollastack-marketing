import fs from 'fs';

fs.copyFileSync('style.css', 'src/styles/style.css');
fs.copyFileSync('style.css', 'public/style.css');
fs.copyFileSync('script.js', 'public/script.js');

const html = fs.readFileSync('index.html', 'utf8');
const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
if (!bodyMatch) {
  console.error('Could not find body');
  process.exit(1);
}

let bodyContent = bodyMatch[1];
bodyContent = bodyContent.replace(/src="script\.js"/g, 'src="/script.js" defer');
bodyContent = bodyContent.replace(/\{/g, '&#123;');
bodyContent = bodyContent.replace(/\}/g, '&#125;');

const astroContent = `---
import '../styles/style.css';

const HOME_TITLE = "Ollastack — Forms, mailboxes & email testing, built for your AI agents";
const HOME_DESC =
  "Forms, mailboxes & email testing, built for your AI agents. Three things your agents need, one backend: form endpoints they POST to and sail past the bot defenses, real mailboxes they send, receive, reply, and read OTP codes from, and disposable inboxes for testing email in CI.";
---

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{HOME_TITLE}</title>
  <meta name="description" content={HOME_DESC} />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
</head>
<body>
${bodyContent}
</body>
</html>
`;

fs.writeFileSync('src/pages/index.astro', astroContent, 'utf8');
console.log('Build sync completed successfully.');
