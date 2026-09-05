const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3001;
const PUBLIC_DIR = path.join(__dirname, 'public');
const chatHandler = require('./api/chat.js');
const ttsHandler = require('./api/tts.js');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  let reqUrl = req.url.split('?')[0];

  // Router API Chat
  if (reqUrl === '/api/chat') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        req.body = body ? JSON.parse(body) : {};
      } catch (e) {
        req.body = {};
      }

      // Mock helpers para compatibilidad con Vercel Serverless
      res.status = (code) => {
        res.statusCode = code;
        return res;
      };
      res.json = (data) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(data));
      };

      await chatHandler(req, res);
    });
    return;
  }

  // Router API TTS
  if (reqUrl === '/api/tts') {
    const urlObj = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
    req.query = Object.fromEntries(urlObj.searchParams);
    res.status = (code) => { res.statusCode = code; return res; };
    res.send = (data) => { res.end(data); };
    await ttsHandler(req, res);
    return;
  }

  if (reqUrl === '/') reqUrl = '/index.html';

  let filePath = path.join(PUBLIC_DIR, reqUrl);

  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, reqUrl);
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`Búnker Web Fundación Valle de Luz activo en http://localhost:${PORT}`);
});