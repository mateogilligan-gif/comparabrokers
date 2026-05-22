import { NextResponse } from 'next/server'

/**
 * Price API route — server-side fetcher para esquivar CORS.
 * Estrategia: race entre Stooq y Yahoo, gana el primero. Si ambos fallan, 404.
 *
 * IMPORTANTE: NO usamos fallback prices hardcodeados. Inventar precios genera
 * cálculos de premium/discount erróneos contra el ratio×CCL real. Mejor fallar
 * limpio y dejar que la UI muestre "no data" para que el usuario meta el valor a mano.
 */

// ------------------------------------------------------------
// Stooq — CSV simple, sin auth. Formato: us=AAPL.us, byma=aapl.ar
// ------------------------------------------------------------
async function fetchStooq(symbol: string) {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4000)

    const url = `https://stooq.com/q/l/?s=${symbol.toLowerCase()}&f=sd2t2ohlcv&h&e=csv`
    const r = await fetch(url, { cache: 'no-store', signal: controller.signal })
    clearTimeout(timeoutId)

    if (!r.ok) return null
    const csv = await r.text()
    const lines = csv.trim().split('\n')
    if (lines.length < 2) return null
    const cols = lines[1].split(',')
    // cols: symbol, date, time, open, high, low, close, volume
    const close = parseFloat(cols[6])
    if (!close || isNaN(close)) return null
    // Stooq devuelve "N/D" cuando no tiene data
    if (cols[6].toUpperCase().includes('N/D')) return null
    return { value: close, src: `stooq ${symbol}`, time: `${cols[1]} ${cols[2]}` }
  } catch {
    return null
  }
}

// ------------------------------------------------------------
// Yahoo Finance — solo US tickers, usa el endpoint chart v8
// ------------------------------------------------------------
async function fetchYahoo(symbol: string) {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4000)

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`
    const r = await fetch(url, {
      cache: 'no-store',
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })
    clearTimeout(timeoutId)

    if (!r.ok) return null
    const data = await r.json()
    const quote = data?.chart?.result?.[0]?.meta?.regularMarketPrice
    if (!quote || isNaN(quote)) return null
    return { value: quote, src: `yahoo ${symbol}`, time: new Date().toISOString() }
  } catch {
    return null
  }
}

// ------------------------------------------------------------
// GET /api/price?ticker=AAPL&market=us
// GET /api/price?ticker=AAPL&market=ar   (BYMA local price)
// ------------------------------------------------------------
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const ticker = searchParams.get('ticker')?.toUpperCase()
  const market = searchParams.get('market') || 'us'

  if (!ticker) {
    return NextResponse.json({ error: 'Missing ticker parameter' }, { status: 400 })
  }

  // Sanitizar — Stooq quiere ticker base sin .us / .ar
  const baseTicker = ticker.replace(/\..*$/, '').toUpperCase()

  // Para BYMA usamos sufijo .ar, para US el ticker pelado (Yahoo) y .us (Stooq)
  const stooqSymbol = market === 'ar'
    ? `${baseTicker.toLowerCase()}.ar`
    : `${baseTicker.toLowerCase()}.us`

  // Race: primero el que responda con data válida
  const candidates: Promise<{ value: number; src: string; time: string } | null>[] = [
    fetchStooq(stooqSymbol),
  ]

  // Yahoo solo para US (no soporta tickers BYMA)
  if (market === 'us') {
    candidates.push(fetchYahoo(baseTicker))
  }

  // Timeout global de seguridad
  const timeoutPromise: Promise<null> = new Promise((resolve) =>
    setTimeout(() => resolve(null), 5000),
  )

  // Promise.any espera al primero que resuelva con un valor truthy
  // Si todos fallan o devuelven null, caemos al timeout
  let liveResult: { value: number; src: string; time: string } | null = null
  try {
    const results = await Promise.race([
      Promise.all(candidates).then(arr => arr.find(r => r && r.value > 0) || null),
      timeoutPromise,
    ])
    liveResult = results || null
  } catch {
    liveResult = null
  }

  if (liveResult && liveResult.value > 0) {
    return NextResponse.json(liveResult)
  }

  // No fallback — fail clean. UI debe mostrar "no data" y permitir input manual.
  return NextResponse.json(
    { error: 'No live data available', ticker: baseTicker, market },
    { status: 404 },
  )
}
