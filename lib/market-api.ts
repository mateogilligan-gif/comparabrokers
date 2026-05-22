// API Fetchers for live market data
import { TICKER_OVERRIDES, NON_US_MARKETS } from './cedears-data'

interface FetchResult {
  value: number
  src: string
  time?: string
}

// Fetch CCL rate
export async function fetchCCL(): Promise<FetchResult | null> {
  // dolarapi directo (tiene CORS)
  try {
    const r = await fetch('https://dolarapi.com/v1/dolares/contadoconliqui', { cache: 'no-store' })
    if (r.ok) {
      const d = await r.json()
      if (d.venta || d.compra) {
        return { value: d.venta || d.compra, src: 'dolarapi', time: d.fechaActualizacion }
      }
    }
  } catch (e) {
    console.warn('dolarapi fail', e)
  }
  
  // Fallback: criptoya
  try {
    const r = await fetch('https://criptoya.com/api/dolar', { cache: 'no-store' })
    if (r.ok) {
      const d = await r.json()
      if (d?.ccl?.al30?.['24hs']) {
        return { value: d.ccl.al30['24hs'].price, src: 'criptoya', time: undefined }
      }
    }
  } catch (e) {
    console.warn('criptoya fail', e)
  }
  
  return null
}

// Fetch CEDEAR price in ARS via API route (server-side to avoid CORS)
export async function fetchCedearPriceARS(bymaTicker: string): Promise<FetchResult | null> {
  try {
    const r = await fetch(`/api/price?ticker=${encodeURIComponent(bymaTicker)}&market=ar`, { cache: 'no-store' })
    if (!r.ok) return null
    const data = await r.json()
    if (data.value > 0) {
      return { value: data.value, src: data.src, time: data.time }
    }
    return null
  } catch (e) {
    console.warn('fetchCedearPriceARS fail', bymaTicker, e)
    return null
  }
}

// Fetch US stock price via API route (server-side to avoid CORS)
export async function fetchUSPrice(bymaTickerOrUsTicker: string): Promise<FetchResult | null> {
  const usTicker = TICKER_OVERRIDES[bymaTickerOrUsTicker] || bymaTickerOrUsTicker
  
  try {
    const r = await fetch(`/api/price?ticker=${encodeURIComponent(usTicker)}&market=us`, { cache: 'no-store' })
    if (!r.ok) return null
    const data = await r.json()
    if (data.value > 0) {
      return { value: data.value, src: data.src, time: data.time }
    }
    return null
  } catch (e) {
    console.warn('fetchUSPrice fail', bymaTickerOrUsTicker, e)
    return null
  }
}

// Check if a market is non-US (no real price available)
export function isNonUSMarket(market: string): boolean {
  return NON_US_MARKETS.includes(market)
}
