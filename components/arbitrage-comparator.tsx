'use client'

import { useState, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CEDEARS } from '@/lib/cedears-data'
import { fetchCCL, fetchCedearPriceARS, fetchUSPrice, isNonUSMarket } from '@/lib/market-api'
import { parseRatio, fmtNumber } from '@/lib/broker-calculations'
import { Search, TrendingUp, TrendingDown, Minus } from 'lucide-react'

export function ArbitrageComparator() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [result, setResult] = useState<{
    ticker: string
    name: string
    ratio: string
    market: string
    usPrice: number
    usSrc: string
    cedearPrice: number
    cedearSrc: string
    cclValue: number
    cclSrc: string
    impliedUSD: number
    pctDiff: number
    absDiff: number
  } | null>(null)

  const filteredCedears = useMemo(() => {
    const q = searchQuery.trim().toUpperCase()
    let list = CEDEARS
    if (q) {
      list = list.filter(c =>
        c.ticker.toUpperCase().startsWith(q) ||
        c.name.toUpperCase().includes(q)
      )
    }
    return list.slice(0, 30)
  }, [searchQuery])

  const runComparison = useCallback(async (ticker: string) => {
    const cedear = CEDEARS.find(c => c.ticker.toUpperCase() === ticker.toUpperCase())
    if (!cedear) {
      setError(`No encuentro el ticker "${ticker}" en la lista de CEDEARs BYMA.`)
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const [us, ced, ccl] = await Promise.all([
        fetchUSPrice(cedear.ticker),
        fetchCedearPriceARS(cedear.ticker),
        fetchCCL()
      ])

      const fails: string[] = []
      if (!us) fails.push('precio en Wall Street')
      if (!ced) fails.push('precio del CEDEAR en ARS')
      if (!ccl) fails.push('CCL')

      if (fails.length > 0) {
        setError(`No pude obtener: ${fails.join(', ')}. Proba con otro ticker.`)
        setLoading(false)
        return
      }

      const ratio = parseRatio(cedear.ratio) || 1
      const impliedUSD = (ratio * ced!.value) / ccl!.value
      const pctDiff = (impliedUSD / us!.value - 1) * 100
      const absDiff = impliedUSD - us!.value

      setResult({
        ticker: cedear.ticker,
        name: cedear.name,
        ratio: cedear.ratio,
        market: cedear.market,
        usPrice: us!.value,
        usSrc: us!.src,
        cedearPrice: ced!.value,
        cedearSrc: ced!.src,
        cclValue: ccl!.value,
        cclSrc: ccl!.src,
        impliedUSD,
        pctDiff,
        absDiff
      })
    } catch (err) {
      setError('Error al obtener datos. Intenta de nuevo.')
    }

    setLoading(false)
  }, [])

  const selectTicker = (ticker: string) => {
    setSearchQuery(ticker)
    setShowDropdown(false)
    runComparison(ticker)
  }

  // Determine spread status
  const isPrima = result && result.pctDiff > 0
  const isDescuento = result && result.pctDiff < 0
  const isNeutral = result && Math.abs(result.pctDiff) < 0.3

  // Get insight text
  const getInsight = () => {
    if (!result) return ''
    const abs = Math.abs(result.pctDiff)
    
    if (abs < 0.3) {
      return 'Arbitraje limpio: el CEDEAR cotiza practicamente al mismo precio implicito que la accion en NYSE/NASDAQ. Decision de costos: la elegis por comisiones y fees, no por el spread de cotizacion.'
    } else if (isPrima && abs < 1.5) {
      return `Pequena prima: el CEDEAR esta ${fmtNumber(abs, 2)}% arriba del spot. Comprar el stock afuera (Wallbit) sale mas barato en cotizacion que el CEDEAR local.`
    } else if (isPrima) {
      return `Prima alta (${fmtNumber(abs, 2)}%): el CEDEAR cotiza significativamente arriba del stock. Si vas a entrar ahora, comprarlo afuera (Wallbit) te da el activo mas barato de entrada.`
    } else if (abs < 1.5) {
      return `Descuento leve: el CEDEAR esta ${fmtNumber(abs, 2)}% abajo del spot. Comprar CEDEAR localmente te da el activo levemente mas barato en cotizacion.`
    } else {
      return `Descuento alto (${fmtNumber(abs, 2)}%): el CEDEAR cotiza significativamente abajo del stock. Comprar CEDEAR ahora es mas barato de entrada.`
    }
  }

  return (
    <Card className="border-2 border-chart-2/50 bg-gradient-to-br from-secondary to-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="text-sm font-bold text-foreground uppercase tracking-wider">
              CEDEAR caro o barato? <span className="text-xs font-normal text-muted-foreground normal-case tracking-normal">- live</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Compara el precio del stock en Wall Street vs el precio implicito del CEDEAR en USD: 
              <span className="text-foreground"> (ARS x ratio) / CCL</span>. 
              Si el CEDEAR cotiza arriba = <span className="text-destructive font-semibold">prima</span>. 
              Si cotiza abajo = <span className="text-primary font-semibold">descuento</span>.
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowDropdown(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setShowDropdown(false)
                  runComparison(searchQuery)
                }
                if (e.key === 'Escape') setShowDropdown(false)
              }}
              placeholder="Buscar ticker (ej: TSLA, AAPL)"
              className="bg-input"
            />
            {showDropdown && searchQuery && (
              <div className="absolute z-30 mt-1 left-0 right-0 bg-card border border-border rounded-md shadow-lg max-h-64 overflow-y-auto">
                {filteredCedears.map((c) => (
                  <div
                    key={c.ticker}
                    onClick={() => selectTicker(c.ticker)}
                    className="px-3 py-2 hover:bg-secondary cursor-pointer border-b border-border last:border-0 flex items-center justify-between"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-sm text-foreground">{c.ticker}</span>
                      <span className="text-xs text-muted-foreground truncate">{c.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono ml-2">{c.ratio}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Button 
            onClick={() => runComparison(searchQuery)} 
            disabled={loading || !searchQuery}
            className="bg-chart-2 hover:bg-chart-2/80 text-white"
          >
            {loading ? 'Cargando...' : 'Comparar'}
          </Button>
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* US Price */}
              <div className="bg-secondary rounded-lg border border-border p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Wall Street</span>
                  <span className="text-xs text-muted-foreground">{result.usSrc}</span>
                </div>
                <div className="text-2xl font-bold text-chart-5 num mt-1">
                  USD {fmtNumber(result.usPrice, 2)}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {result.ticker} - {result.market}
                </div>
              </div>

              {/* CEDEAR Implied */}
              <div className="bg-secondary rounded-lg border border-border p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">CEDEAR implicito</span>
                  <span className="text-xs text-muted-foreground">{result.cedearSrc}</span>
                </div>
                <div className="text-2xl font-bold text-chart-4 num mt-1">
                  USD {fmtNumber(result.impliedUSD, 2)}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  ARS {fmtNumber(result.cedearPrice, 2)} x {parseRatio(result.ratio)} / CCL {fmtNumber(result.cclValue, 2)}
                </div>
              </div>

              {/* Spread */}
              <div className={`rounded-lg border p-4 transition ${
                isNeutral 
                  ? 'bg-secondary border-border' 
                  : isPrima 
                    ? 'bg-destructive/10 border-destructive' 
                    : 'bg-primary/10 border-primary'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs uppercase tracking-wider ${
                    isNeutral 
                      ? 'text-muted-foreground' 
                      : isPrima 
                        ? 'text-destructive' 
                        : 'text-primary'
                  }`}>
                    {isNeutral ? 'Sin diferencia' : isPrima ? 'Prima (CEDEAR mas caro)' : 'Descuento (CEDEAR mas barato)'}
                  </span>
                </div>
                <div className={`text-2xl font-bold num mt-1 flex items-center gap-2 ${
                  isNeutral 
                    ? 'text-muted-foreground' 
                    : isPrima 
                      ? 'text-destructive' 
                      : 'text-primary'
                }`}>
                  {isPrima ? <TrendingUp className="h-5 w-5" /> : isDescuento ? <TrendingDown className="h-5 w-5" /> : <Minus className="h-5 w-5" />}
                  {result.pctDiff >= 0 ? '+' : ''}{fmtNumber(result.pctDiff, 2)}%
                </div>
                <div className={`text-xs mt-0.5 ${
                  isNeutral 
                    ? 'text-muted-foreground' 
                    : isPrima 
                      ? 'text-destructive/80' 
                      : 'text-primary/80'
                }`}>
                  {result.absDiff >= 0 ? '+' : ''}USD {fmtNumber(result.absDiff, 2)} por accion
                </div>
              </div>
            </div>

            {/* Insight */}
            <div className="p-3 rounded-lg bg-secondary border border-border text-xs text-muted-foreground">
              {getInsight()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
