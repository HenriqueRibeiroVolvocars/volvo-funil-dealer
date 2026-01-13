const express = require('express');
const fetch = require('node-fetch');
require('dotenv').config();
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

async function proxyToEnv(req, res, envVar) {
  const target = process.env[envVar];
  if (!target) {
    console.error(`Missing env var: ${envVar}`);
    return res.status(500).json({ error: `${envVar} not configured on server` });
  }

  try {
    console.log(`Proxying to ${envVar} -> ${target}`);
    const response = await fetch(target, { method: req.method });
    const contentType = response.headers.get('content-type') || '';
    if (!response.ok) {
      const text = await response.text();
      console.error(`Upstream ${envVar} returned ${response.status}: ${text}`);
      return res.status(502).json({ error: `Upstream ${envVar} returned ${response.status}`, details: text });
    }

    if (contentType.includes('application/json')) {
      const data = await response.json();
      return res.json(data);
    }
    const text = await response.text();
    res.type('text/plain').send(text);
  } catch (err) {
    console.error(`Error proxying ${envVar}:`, err && err.stack ? err.stack : err);
    res.status(500).json({ error: 'Error fetching upstream', details: String(err && err.message ? err.message : err) });
  }
}

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.get('/api/sheet1', (req, res) => proxyToEnv(req, res, 'SHEET1_URL'));
app.get('/api/sheet2', (req, res) => proxyToEnv(req, res, 'SHEET2_URL'));
app.get('/api/sheet3', (req, res) => proxyToEnv(req, res, 'SHEET3_URL'));
app.get('/api/sheet4', (req, res) => proxyToEnv(req, res, 'SHEET4_URL'));

const port = process.env.PORT || 7070;
app.listen(port, () => console.log(`API proxy running on port ${port}`));
