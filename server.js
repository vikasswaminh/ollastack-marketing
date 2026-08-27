import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 5173;
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.webp': 'image/webp'
};

const server = http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  let safePath = path.normalize(urlPath).replace(/^(\.\.[\/\\])+/, '');
  if (safePath.startsWith('/') || safePath.startsWith('\\')) {
    safePath = safePath.slice(1);
  }

  // Candidate paths to check in order
  const candidates = [];
  
  if (!safePath || safePath === '.') {
    candidates.push(path.join(__dirname, 'dist', 'index.html'));
    candidates.push(path.join(__dirname, 'index.html'));
  } else {
    // 1. Direct dist file
    candidates.push(path.join(__dirname, 'dist', safePath));
    // 2. dist directory index.html
    candidates.push(path.join(__dirname, 'dist', safePath, 'index.html'));
    // 3. dist html file
    candidates.push(path.join(__dirname, 'dist', safePath + '.html'));
    // 4. public file
    candidates.push(path.join(__dirname, 'public', safePath));
    // 5. root directory file
    candidates.push(path.join(__dirname, safePath));
    // 6. root directory index.html
    candidates.push(path.join(__dirname, safePath, 'index.html'));
  }

  let finalPath = null;
  for (const cand of candidates) {
    if (fs.existsSync(cand) && fs.statSync(cand).isFile()) {
      finalPath = cand;
      break;
    }
  }

  if (!finalPath) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>404 Not Found</h1><p>Route ' + req.url + ' not found.</p><a href="/">Return Home</a>');
    return;
  }

  const extname = String(path.extname(finalPath)).toLowerCase();
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  fs.readFile(finalPath, (error, content) => {
    if (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Server Error: ' + error.code);
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
