// Vercel Serverless Function: GET /api/ohlcv?symbol=BBCA  (atau ^JKSE untuk indeks)
// Mengembalikan data harian OHLCV (harga sudah disesuaikan stock split oleh Yahoo) + faktor penyesuaian dividen + daftar dividen.
module.exports = async (req, res) => {
  const sym = String(req.query.symbol || '').toUpperCase().replace(/[^A-Z0-9.^-]/g, '');
  if (!sym) return res.status(400).json({ error: 'symbol wajib diisi' });
  const ticker = (sym.startsWith('^') || sym.includes('.')) ? sym : sym + '.JK';
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?period1=1262304000&period2=${Math.floor(Date.now() / 1000)}&interval=1d&events=div%2Csplits`;
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!r.ok) return res.status(502).json({ error: 'Yahoo HTTP ' + r.status });
    const q = (await r.json()).chart.result[0];
    const z = q.indicators.quote[0], adj = q.indicators.adjclose && q.indicators.adjclose[0].adjclose;
    const out = { d: [], o: [], h: [], l: [], c: [], v: [], a: [] };
    q.timestamp.forEach((t, i) => {
      if (z.close[i] == null || z.open[i] == null) return;
      out.d.push(new Date(t * 1000).toISOString().slice(0, 10));
      out.o.push(+z.open[i].toFixed(2)); out.h.push(+z.high[i].toFixed(2)); out.l.push(+z.low[i].toFixed(2)); out.c.push(+z.close[i].toFixed(2));
      out.v.push(z.volume[i] || 0);
      out.a.push(adj && adj[i] != null ? +(adj[i] / z.close[i]).toFixed(6) : 1);
    });
    const dv = q.events && q.events.dividends ? Object.values(q.events.dividends).map(x => [new Date(x.date * 1000).toISOString().slice(0, 10), x.amount]) : [];
    const sp = q.events && q.events.splits ? Object.values(q.events.splits).map(x => [new Date(x.date * 1000).toISOString().slice(0, 10), x.splitRatio]) : [];
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json({ ...out, dv, sp });
  } catch (e) { res.status(500).json({ error: String(e) }); }
};
