// Cloudflare Worker: Yahoo Finance 시세를 받아 CORS 허용 JSON으로 돌려주는 작은 프록시.
// 사용: GET https://<worker>.workers.dev/?symbols=^KS11,^IXIC,NQ=F
// 허용된 심볼만 조회하도록 제한해 남용을 막는다.

const ALLOWED = new Set(["^KS11", "^IXIC", "^GSPC", "NQ=F", "SOXX", "DRAM", "^KQ11", "ES=F", "^SOX", "KRW=X"]);
const CACHE_SECONDS = 10;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

async function fetchQuote(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=5m&range=1d&includePrePost=false`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
    cf: { cacheTtl: CACHE_SECONDS, cacheEverything: true },
  });
  if (!res.ok) throw new Error(`Yahoo ${res.status}`);
  const data = await res.json();
  const r = data?.chart?.result?.[0];
  if (!r) throw new Error("no result");
  const m = r.meta;
  const closes = r.indicators?.quote?.[0]?.close ?? [];
  const points = [];
  (r.timestamp ?? []).forEach((t, i) => {
    if (closes[i] != null) points.push([t, Math.round(closes[i] * 100) / 100]);
  });
  return {
    symbol,
    price: m.regularMarketPrice,
    prevClose: m.chartPreviousClose ?? m.previousClose,
    time: m.regularMarketTime,
    currency: m.currency,
    tz: m.exchangeTimezoneName,
    tradingPeriod: m.currentTradingPeriod?.regular ?? null,
    points,
  };
}

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

    const url = new URL(request.url);
    const symbols = (url.searchParams.get("symbols") || "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => ALLOWED.has(s))
      .slice(0, 12);

    if (symbols.length === 0) {
      return Response.json({ error: "symbols 파라미터가 필요합니다", allowed: [...ALLOWED] }, { status: 400, headers: CORS });
    }

    const results = await Promise.all(
      symbols.map((s) => fetchQuote(s).catch((e) => ({ symbol: s, error: String(e.message || e) })))
    );

    return Response.json(
      { updated: Math.floor(Date.now() / 1000), quotes: results },
      { headers: { ...CORS, "Cache-Control": `public, max-age=${CACHE_SECONDS}` } }
    );
  },
};
