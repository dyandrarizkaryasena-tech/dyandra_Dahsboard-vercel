// Vercel Serverless Function: GET /api/yahoo?symbol=BBCA  ->  { d: [tanggal], c: [harga adj close] }
module.exports = async (req, res) => {
  const sym = String(req.query.symbol || '').toUpperCase().replace(/[^A-Z0-9.^-]/g, '');
  if (!sym) return res.status(400).json({ error: 'symbol wajib diisi' });
  const ticker = sym.includes('.') ? sym : sym + '.JK';
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?period1=946684800&period2=${Math.floor(Date.now() / 1000)}&interval=1d`;
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!r.ok) return res.status(502).json({ error: 'Yahoo HTTP ' + r.status });
    const q = (await r.json()).chart.result[0];
    const cl = (q.indicators.adjclose && q.indicators.adjclose[0].adjclose) || q.indicators.quote[0].close;
    const d = [], c = [];
    q.timestamp.forEach((t, i) => { if (cl[i] != null) { d.push(new Date(t * 1000).toISOString().slice(0, 10)); c.push(cl[i]); } });
    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=3600'); // cache 15 menit di CDN Vercel
    res.status(200).json({ d, c });
  } catch (e) { res.status(500).json({ error: String(e) }); }
};
