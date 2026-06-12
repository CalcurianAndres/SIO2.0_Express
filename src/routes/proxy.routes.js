const express = require('express');
const app = express();

app.all('/api/external', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'url query param required' });
  try {
    const options = {
      method: req.method,
      headers: { 'User-Agent': 'SIO/1.0', 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(60000),
    };
    if (req.method === 'POST' && req.body && Object.keys(req.body).length > 0) {
      options.body = JSON.stringify(req.body);
    }
    const response = await fetch(url, options);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'external request failed', detail: err.message });
  }
});

module.exports = app;
