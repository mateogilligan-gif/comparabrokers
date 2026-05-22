'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { CEDEARS, type Cedear } from '@/lib/cedears-data'
import { 
  DEFAULT_MARKET, 
  PORTFOLIO_STRATEGIES,
  computePortfolioCost,
  fmtNumber,
  type MarketParams,
  type PortfolioConfig,
  type CostResult
} from '@/lib/broker-calculations'
import { fetchCCL } from '@/lib/market-api'
import { X, RefreshCw, Search, TrendingUp, ChevronDown, ChevronRight } from 'lucide-react'

interface PortfolioBuilderProps {
  market: MarketParams
  onMarketUpdate: (market: MarketParams) => void
}

export function PortfolioBuilder({ market, onMarketUpdate }: PortfolioBuilderProps) {
  const [capital, setCapital] = useState(1500)
  const [tickers, setTickers] = useState<string[]>(['AAPL', 'TSLA', 'MSFT'])
  const [rotations, setRotations] = useState(1)
  const [meses, setMeses] = useState(12)
  const [origen, setOrigen] = useState<'usd_local' | 'usd_exterior' | 'ars_local'>('usd_local')
  const [operatorMode, setOperatorMode] = useState<'home_broker' | 'operador'>('home_broker')
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [status, setStatus] = useState<'ok' | 'warn' | 'err'>('warn')
  const [statusText, setStatusText] = useState('Cargando...')
  const [showBrokerDetails, setShowBrokerDetails] = useState(true)
  const [showTickerBreakdown, setShowTickerBreakdown] = useState(false)
  const [showRotationScenarios, setShowRotationScenarios] = useState(false)

  // Config object
  const config: PortfolioConfig = useMemo(() => ({
    capital,
    tickers,
    rotations,
    meses,
    origen,
    operatorMode,
  }), [capital, tickers, rotations, meses, origen, operatorMode])

  // Calculate results for all strategies
  const results: CostResult[] = useMemo(() => {
    if (tickers.length === 0 || capital <= 0) return []
    
    const rows = PORTFOLIO_STRATEGIES.map(st => 
      computePortfolioCost(config, st.id, market)
    )
    rows.sort((a, b) => a.total - b.total)
    return rows
  }, [config, market, tickers.length, capital])

  const best = results[0]
  const worst = results[results.length - 1]
  const saving = worst && best ? worst.total - best.total : 0
  const savingPct = capital > 0 ? (saving / capital) * 100 : 0

  // Search filtered CEDEARs
  const filteredCedears = useMemo(() => {
    const q = searchQuery.trim().toUpperCase()
    let list = CEDEARS.filter(c => !tickers.includes(c.ticker))
    if (q) {
      list = list.filter(c =>
        c.ticker.toUpperCase().startsWith(q) ||
        c.name.toUpperCase().includes(q)
      )
    }
    return list.slice(0, 40)
  }, [searchQuery, tickers])

  // Add ticker
  const addTicker = useCallback((ticker: string) => {
    if (!tickers.includes(ticker)) {
      setTickers([...tickers, ticker])
    }
    setSearchQuery('')
    setShowDropdown(false)
  }, [tickers])

  // Remove ticker
  const removeTicker = useCallback((idx: number) => {
    setTickers(tickers.filter((_, i) => i !== idx))
  }, [tickers])

  // Fetch CCL on mount
  useEffect(() => {
    const loadCCL = async () => {
      setStatus('warn')
      setStatusText('Actualizando CCL...')
      const ccl = await fetchCCL()
      if (ccl) {
        onMarketUpdate({ ...market, ccl: ccl.value })
        setStatus('ok')
        setStatusText(`CCL ${ccl.src} - ${new Date().toLocaleTimeString('es-AR')}`)
      } else {
        setStatus('err')
        setStatusText('Error cargando CCL')
      }
    }
    loadCCL()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refreshData = async () => {
    setStatus('warn')
    setStatusText('Actualizando...')
    const ccl = await fetchCCL()
    if (ccl) {
      onMarketUpdate({ ...market, ccl: ccl.value })
      setStatus('ok')
      setStatusText(`Actualizado - ${new Date().toLocaleTimeString('es-AR')}`)
    } else {
      setStatus('err')
      setStatusText('Error')
    }
  }

  // Allocation info
  const K = tickers.length
  const perTicker = K > 0 ? capital / K : 0
  const totalTrades = K * (1 + 2 * rotations)

  // Origen label
  const origenLabels = {
    usd_local: 'USD cuenta AR (SWIFT)',
    usd_exterior: 'USD exterior',
    ars_local: 'ARS cuenta AR (4,5%)',
  }

  return (
    <Card className="border-2 border-border overflow-hidden">
      {/* Header */}
      <CardHeader className="bg-gradient-to-r from-secondary via-muted to-secondary py-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-foreground">Portfolio Builder</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Elegi cuanto vas a invertir y en que tickers. El capital se divide en partes iguales.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className={`dot-live ${status === 'ok' ? 'dot-ok' : status === 'err' ? 'dot-err' : 'dot-warn'}`} />
            <span className="text-muted-foreground">{statusText}</span>
            <Button 
              variant="default" 
              size="sm" 
              onClick={refreshData}
              className="ml-2"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Refrescar
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Capital Input */}
        <div className="flex flex-col items-center">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Capital a invertir
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl font-bold text-muted-foreground">$</span>
            <Input
              type="number"
              value={capital}
              onChange={(e) => setCapital(parseFloat(e.target.value) || 0)}
              className="text-4xl font-bold text-center pl-12 pr-20 py-6 w-80 bg-secondary border-2 border-primary/30 focus:border-primary num"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">USD</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Tu capital total. Se reparte equitativamente entre los tickers.
          </p>
        </div>

        {/* Ticker Picker */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
            Tickers en tu portfolio
          </label>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowDropdown(true)}
              placeholder="Buscar ticker (AAPL, TSLA, KO, MSFT...)"
              className="pl-10 bg-input"
            />
            {showDropdown && (
              <div className="absolute z-30 mt-1 left-0 right-0 bg-card border border-border rounded-md shadow-lg max-h-80 overflow-y-auto">
                {filteredCedears.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground">Sin resultados</div>
                ) : (
                  filteredCedears.map((c) => (
                    <div
                      key={c.ticker}
                      onClick={() => addTicker(c.ticker)}
                      className="px-3 py-2 hover:bg-secondary cursor-pointer border-b border-border last:border-0 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-semibold text-foreground">{c.ticker}</span>
                        <span className="text-xs text-muted-foreground ml-2">{c.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">{c.ratio}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          
          {/* Chips */}
          <div className="flex flex-wrap gap-2 min-h-[2.2rem] items-center">
            {tickers.length === 0 ? (
              <span className="text-xs text-muted-foreground italic">Ningun ticker agregado. Busca arriba.</span>
            ) : (
              tickers.map((t, idx) => (
                <Badge key={t} variant="secondary" className="pl-3 pr-1 py-1 text-sm font-semibold bg-primary/20 text-primary border border-primary/30">
                  {t}
                  <button
                    onClick={() => removeTicker(idx)}
                    className="ml-1 w-5 h-5 flex items-center justify-center rounded-full hover:bg-primary/30"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))
            )}
          </div>
          
          {/* Allocation info */}
          {K > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              <strong>{K}</strong> ticker{K > 1 ? 's' : ''} - 
              <strong className="num"> ${perTicker.toFixed(2)} USD</strong> por ticker - 
              <strong> {totalTrades}</strong> trades totales
            </p>
          )}
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">
              Rebalances / ano
            </label>
            <Select value={rotations.toString()} onValueChange={(v) => setRotations(parseInt(v))}>
              <SelectTrigger className="bg-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Hold puro (0)</SelectItem>
                <SelectItem value="1">Anual (1)</SelectItem>
                <SelectItem value="4">Trimestral (4)</SelectItem>
                <SelectItem value="12">Mensual (12)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">
              Horizonte (meses)
            </label>
            <Input
              type="number"
              value={meses}
              onChange={(e) => setMeses(parseInt(e.target.value) || 12)}
              className="bg-input num text-right"
            />
          </div>
          
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">
              Origen fondos
            </label>
            <Select value={origen} onValueChange={(v) => setOrigen(v as typeof origen)}>
              <SelectTrigger className="bg-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="usd_local">USD cuenta AR (SWIFT)</SelectItem>
                <SelectItem value="usd_exterior">USD exterior</SelectItem>
                <SelectItem value="ars_local">ARS cuenta AR (4,5%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">
              Modo operatoria
            </label>
            <Select value={operatorMode} onValueChange={(v) => setOperatorMode(v as typeof operatorMode)}>
              <SelectTrigger className="bg-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="home_broker">Home broker (web/app)</SelectItem>
                <SelectItem value="operador">Operador (mesa)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Headline */}
        {best && results.length > 0 ? (
          <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-background to-chart-2/10 border-2 border-primary/30 p-6 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              Capital ${capital.toLocaleString('en-US')} - {K} tickers - {rotations} rebalances/ano - {meses} meses - {origenLabels[origen]}
            </p>
            <div className="text-5xl font-extrabold text-primary mb-1 num">
              ${best.total.toFixed(2)}
              <span className="text-2xl text-muted-foreground font-bold ml-2">USD</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              costo total minimo - <strong>{((best.total / capital) * 100).toFixed(2)}%</strong> del capital
            </p>
            <p className="text-lg font-semibold text-foreground">
              Mejor opcion: <span style={{ color: best.color }}>{best.label}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-3">
              Te ahorra <strong className="text-primary num">${saving.toFixed(2)}</strong> vs la peor ({worst.label}) - {savingPct.toFixed(2)}% del capital
            </p>
          </div>
        ) : (
          <div className="rounded-2xl bg-secondary border border-border p-6 text-center">
            <p className="text-muted-foreground text-sm">Elegi capital y al menos un ticker para ver el resultado</p>
          </div>
        )}

        {/* Broker Comparison Table */}
        {results.length > 0 && (
          <div>
            <button
              onClick={() => setShowBrokerDetails(!showBrokerDetails)}
              className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 mb-2"
            >
              {showBrokerDetails ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              Comparacion completa por broker
            </button>
            
            {showBrokerDetails && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground uppercase border-b-2 border-border">
                    <tr>
                      <th className="text-left py-2 pr-3">Broker</th>
                      <th className="text-right py-2 px-3">Comisiones</th>
                      <th className="text-right py-2 px-3">Susc. + fondeo</th>
                      <th className="text-right py-2 px-3">Custodia</th>
                      <th className="text-right py-2 px-3">Div. drag</th>
                      <th className="text-right py-2 px-3">Total</th>
                      <th className="text-right py-2 pl-3">Ahorro vs. peor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => {
                      const isBest = i === 0
                      const isWorst = i === results.length - 1
                      const delta = worst.total - r.total
                      
                      return (
                        <tr 
                          key={r.id} 
                          className={`border-b border-border ${isBest ? 'bg-primary/10 font-semibold' : isWorst ? 'text-muted-foreground' : ''}`}
                        >
                          <td className="text-left py-2 pr-3 font-medium" style={{ color: r.color }}>
                            {r.label}
                            {isBest && <Badge variant="default" className="ml-2 text-xs bg-primary text-primary-foreground">MEJOR</Badge>}
                            {isWorst && <Badge variant="destructive" className="ml-2 text-xs">PEOR</Badge>}
                          </td>
                          <td className="text-right py-2 px-3 num">${r.commissions.toFixed(2)}</td>
                          <td className="text-right py-2 px-3 num">{r.subscriptionFondeo > 0.01 ? `$${r.subscriptionFondeo.toFixed(2)}` : '-'}</td>
                          <td className="text-right py-2 px-3 num">{r.custodia > 0.01 ? `$${r.custodia.toFixed(2)}` : '-'}</td>
                          <td className="text-right py-2 px-3 num">{r.divDrag > 0.01 ? `$${r.divDrag.toFixed(2)}` : '-'}</td>
                          <td className="text-right py-2 px-3 num font-semibold">${r.total.toFixed(2)}</td>
                          <td className="text-right py-2 pl-3 num">
                            {delta > 0.01 ? (
                              <span className="text-primary font-bold">-${delta.toFixed(2)}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                <p className="mt-3 text-xs text-muted-foreground">
                  <strong>Modelo:</strong> con K tickers y R rebalances al ano haces K x (1 + 2R) trades totales.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Ticker Breakdown */}
        {results.length > 0 && tickers.length > 0 && (
          <div>
            <button
              onClick={() => setShowTickerBreakdown(!showTickerBreakdown)}
              className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 mb-2"
            >
              {showTickerBreakdown ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              Desglose por ticker (comisiones)
            </button>
            
            {showTickerBreakdown && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="text-muted-foreground uppercase border-b border-border">
                    <tr>
                      <th className="text-left py-2 pr-3">Ticker</th>
                      <th className="text-right py-2 px-3">Notional</th>
                      <th className="text-right py-2 px-3">Trades</th>
                      {PORTFOLIO_STRATEGIES.map(st => (
                        <th key={st.id} className="text-right py-2 px-3" style={{ color: st.color }}>
                          {st.label.replace('Wallbit ', 'WB ').replace('Cocos ', 'C ').replace('Humanas', 'Hum')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="num">
                    {tickers.map(t => {
                      const tradesPerT = 1 + 2 * rotations
                      return (
                        <tr key={t} className="border-b border-border">
                          <td className="text-left py-2 pr-3 font-semibold text-foreground">{t}</td>
                          <td className="text-right py-2 px-3">${perTicker.toFixed(2)}</td>
                          <td className="text-right py-2 px-3">{tradesPerT}</td>
                          {PORTFOLIO_STRATEGIES.map(st => {
                            const r = results.find(x => x.id === st.id)
                            const cost = r ? r.commPerTrade * tradesPerT : 0
                            return (
                              <td key={st.id} className="text-right py-2 px-3">${cost.toFixed(2)}</td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                <p className="text-xs text-muted-foreground mt-2">
                  Solo comisiones por ticker. Susc, fondeo y custodia son costos a nivel de portfolio.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Rotation Scenarios */}
        {results.length > 0 && (
          <div>
            <button
              onClick={() => setShowRotationScenarios(!showRotationScenarios)}
              className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 mb-2"
            >
              {showRotationScenarios ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              Y si rebalancearas con otra frecuencia?
            </button>
            
            {showRotationScenarios && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="text-muted-foreground uppercase border-b border-border">
                    <tr>
                      <th className="text-left py-2 pr-3">Rebalances/ano</th>
                      {PORTFOLIO_STRATEGIES.map(st => (
                        <th key={st.id} className="text-right py-2 px-3" style={{ color: st.color }}>
                          {st.label.replace('Wallbit ', 'WB ').replace('Cocos ', 'C ').replace('Humanas', 'Hum')}
                        </th>
                      ))}
                      <th className="text-right py-2 pl-3">Ganador</th>
                    </tr>
                  </thead>
                  <tbody className="num">
                    {[0, 1, 4, 12].map(r => {
                      const scen: PortfolioConfig = { ...config, rotations: r }
                      const scenResults = PORTFOLIO_STRATEGIES.map(st => 
                        computePortfolioCost(scen, st.id, market)
                      )
                      const winner = scenResults.reduce((a, b) => a.total < b.total ? a : b)
                      const isCurrent = r === rotations
                      const labels: Record<number, string> = { 0: 'Hold (0)', 1: 'Anual (1)', 4: 'Trimestral (4)', 12: 'Mensual (12)' }
                      
                      return (
                        <tr key={r} className={`border-b border-border ${isCurrent ? 'bg-primary/10' : ''}`}>
                          <td className={`text-left py-2 pr-3 font-semibold ${isCurrent ? 'text-primary' : 'text-foreground'}`}>
                            {labels[r]}{isCurrent ? ' <-' : ''}
                          </td>
                          {scenResults.map(res => {
                            const isWin = res.id === winner.id
                            return (
                              <td 
                                key={res.id} 
                                className={`text-right py-2 px-3 ${isWin ? 'bg-primary/20 text-primary font-bold rounded' : ''}`}
                              >
                                ${res.total.toFixed(2)}
                              </td>
                            )
                          })}
                          <td className="text-right py-2 pl-3 font-bold" style={{ color: winner.color }}>
                            {winner.label.replace('Wallbit ', 'WB ').replace('Cocos ', 'C ').replace('Humanas', 'Hum')}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                <p className="text-xs text-muted-foreground mt-2">
                  Tu config actual esta marcada con {'<-'}. Cada fila recalcula para el mismo capital y tickers.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
