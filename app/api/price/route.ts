import { NextResponse } from 'next/server'

/**
 * Price API route — server-side fetcher para esquivar CORS.
 *
 * Estrategia:
 * 1. data912.com como fuente primaria (mejor cobertura para BYMA y US)
 * 2. Stooq como fallback (.ar para BYMA, .us para US)
 * 3. Yahoo Finance como fallback adicional para US tickers
 *
 * Si todas las fuentes fallan → 404 limpio para que la UI muestre "no data"
 * y permita input manual.
 */

interface PriceResult {
  value: number
  src: string
  time: string
}

// ------------------------------------------------------------
// data912.com — fuente primaria. Devuelve el array entero de CEDEARs/stocks.
// Filtramos por ticker en memoria.
// ------------------------------------------------------------
async function fetchData912(market: 'ar' | 'us', ticker: string): Promise<PriceResult | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4000)

    const endpoint = market === 'ar'
      ? 'https://data912.com/live/arg_cedears'
      : 'https://data912.com/live/usa_stocks'

    const r = await fetch(endpoint, {
      cache: 'no-store',
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })
    clearTimeout(timeoutId)

    if (!r.ok) return null
    const data: unknown = await r.json()
    if (!Array.isArray(data)) return null

    const upper = ticker.toUpperCase()
    const entry = data.find((x: any) => {
      const sym = (x?.symbol || x?.ticker || '').toString().toUpperCase()
      return sym === upper
    }) as any

    if (!entry) return null
    const price = entry.c ?? entry.close ?? entry.price ?? entry.last
    const num = typeof price === 'number' ? price : parseFloat(price)
    if (!isFinite(num) || num <= 0) return null

    return {
      value: num,
      src: `data912 ${market === 'ar' ? 'BYMA' : 'US'}`,
      time: new Date().toISOString(),
    }
  } catch {
    return null
  }
}

// ------------------------------------------------------------
// Stooq — CSV simple, fallback secundario
// ------------------------------------------------------------
async function fetchStooq(symbol: string): Promise<PriceResult | null> {
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
    const close = parseFloat(cols[6])
    if (!close || isNaN(close)) return null
    if (cols[6].toUpperCase().includes('N/D')) return null
    return { value: close, src: `stooq ${symbol}`, time: `${cols[1]} ${cols[2]}` }
  } catch {
    return null
  }
}

// ------------------------------------------------------------
// Yahoo Finance — solo US tickers, fallback adicional
// ------------------------------------------------------------
async function fetchYahoo(symbol: string): Promise<PriceResult | null> {
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
  const market = (searchParams.get('market') || 'us') as 'us' | 'ar'

  if (!ticker) {
    return NextResponse.json({ error: 'Missing ticker parameter' }, { status: 400 })
  }
  if (market !== 'ar' && market !== 'us') {
    return NextResponse.json({ error: 'Invalid market — use ar or us' }, { status: 400 })
  }

  const baseTicker = ticker.replace(/\..*$/, '').toUpperCase()

  // 1) Primero data912 — mejor cobertura para BYMA y US
  const d912 = await fetchData912(market, baseTicker)
  if (d912) {
    return NextResponse.json(d912)
  }

  // 2) Fallback: Stooq + (Yahoo solo para US), race
  const stooqSymbol = market === 'ar'
    ? `${baseTicker.toLowerCase()}.ar`
    : `${baseTicker.toLowerCase()}.us`

  const candidates: Promise<PriceResult | null>[] = [fetchStooq(stooqSymbol)]
  if (market === 'us') {
    candidates.push(fetchYahoo(baseTicker))
  }

  const timeoutPromise: Promise<null> = new Promise((resolve) =>
    setTimeout(() => resolve(null), 5000),
  )

  let liveResult: PriceResult | null = null
  try {
    const result = await Promise.race([
      Promise.all(candidates).then(arr => arr.find(r => r && r.value > 0) || null),
      timeoutPromise,
    ])
    liveResult = result || null
  } catch {
    liveResult = null
  }

  if (liveResult && liveResult.value > 0) {
    return NextResponse.json(liveResult)
  }

  // No fallback hardcodeado — fail clean, la UI muestra "no data" y permite input manual.
  return NextResponse.json(
    { error: 'No live data available', ticker: baseTicker, market },
    { status: 404 },
  )
}
