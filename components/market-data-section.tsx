'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CEDEARS } from '@/lib/cedears-data'
import { fetchCCL, fetchCedearPriceARS, fetchUSPrice } from '@/lib/market-api'
import { parseRatio, ratioLabel, fmtNumber, type MarketParams } from '@/lib/broker-calculations'
import { RefreshCw, Search } from 'lucide-react'

interface MarketDataSectionProps {
  market: MarketParams
  onMarketUpdate: (market: MarketParams) => void
}

export function MarketDataSection({ market, onMarketUpdate }: MarketDataSectionProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedCedear, setSelectedCedear] = useState<{
    ticker: string
    name: string
    ratio: string
    market: string
  } | null>(CEDEARS.find(c => c.ticker === 'TSLA') || null)
  
  const [cedearPrice, setCedearPrice] = useState(0)
  const [usPrice, setUsPrice] = useState(0)
  const [cclSrc, setCclSrc] = useState('--')
  const [cedearSrc, setCedearSrc] = useState('--')
  const [usSrc, setUsSrc] = useState('--')
  const [loading, setLoading] = useState(false)

  // Load initial data on mount
  useEffect(() => {
    const loadInitialData = async () => {
      // Load CCL
      const ccl = await fetchCCL()
      if (ccl) {
        onMarketUpdate({ ...market, ccl: ccl.value })
        setCclSrc(`${ccl.src} OK`)
      }
      
      // Load CEDEAR and US prices for default ticker (TSLA)
      if (selectedCedear) {
        const [ced, us] = await Promise.all([
          fetchCedearPriceARS(selectedCedear.ticker),
          fetchUSPrice(selectedCedear.ticker)
        ])
        
        if (ced) {
          setCedearPrice(ced.value)
          setCedearSrc(`${ced.src} OK`)
        }
        
        if (us) {
          setUsPrice(us.value)
          setUsSrc(`${us.src} OK`)
        }
      }
    }
    
    loadInitialData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredCedears = useMemo(() => {
    const q = searchQuery.trim().toUpperCase()
    let list = CEDEARS
    if (q) {
      list = list.filter(c =>
        c.ticker.toUpperCase().includes(q) ||
        c.name.toUpperCase().includes(q)
      )
    }
    return list.slice(0, 50)
  }, [searchQuery])

  const selectCedear = useCallback(async (cedear: typeof CEDEARS[0]) => {
    setSelectedCedear(cedear)
    setSearchQuery(`${cedear.ticker} - ${cedear.name}`)
    setShowDropdown(false)
    
    // Fetch prices
    setLoading(true)
    const [ced, us] = await Promise.all([
      fetchCedearPriceARS(cedear.ticker),
      fetchUSPrice(cedear.ticker)
    ])
    
    if (ced) {
      setCedearPrice(ced.value)
      setCedearSrc(`${ced.src} OK`)
    } else {
      setCedearSrc(`no data (${cedear.ticker})`)
    }
    
    if (us) {
      setUsPrice(us.value)
      setUsSrc(`${us.src} OK`)
    } else {
      setUsSrc(`no data (${cedear.ticker})`)
    }
    
    setLoading(false)
  }, [])

  const refreshCCL = async () => {
    setCclSrc('...')
    const ccl = await fetchCCL()
    if (ccl) {
      onMarketUpdate({ ...market, ccl: ccl.value })
      setCclSrc(`${ccl.src} OK`)
    } else {
      setCclSrc('offline')
    }
  }

  const refreshCedear = async () => {
    if (!selectedCedear) return
    setCedearSrc('...')
    const ced = await fetchCedearPriceARS(selectedCedear.ticker)
    if (ced) {
      setCedearPrice(ced.value)
      setCedearSrc(`${ced.src} OK`)
    } else {
      setCedearSrc(`no data`)
    }
  }

  const refreshUS = async () => {
    if (!selectedCedear) return
    setUsSrc('...')
    const us = await fetchUSPrice(selectedCedear.ticker)
    if (us) {
      setUsPrice(us.value)
      setUsSrc(`${us.src} OK`)
    } else {
      setUsSrc(`no data`)
    }
  }

  // Calculate implied USD and premium
  const ratio = selectedCedear ? parseRatio(selectedCedear.ratio) || 1 : 1
  const impliedUSD = market.ccl > 0 ? (ratio * cedearPrice) / market.ccl : 0
  const premium = usPrice > 0 ? ((impliedUSD - usPrice) / usPrice) * 100 : 0

  return (
    <Card className="border border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold text-foreground uppercase tracking-wider">
          1 - Datos de mercado
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* First row: CCL and CEDEAR selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* CCL */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">
              CCL (ARS/USD)
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={market.ccl}
                onChange={(e) => onMarketUpdate({ ...market, ccl: parseFloat(e.target.value) || 0 })}
                className="bg-input num font-semibold"
              />
              <Button variant="outline" size="icon" onClick={refreshCCL} className="shrink-0">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{cclSrc}</p>
          </div>

          {/* CEDEAR selector */}
          <div className="lg:col-span-2 relative">
            <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">
              CEDEAR
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowDropdown(true)}
                placeholder="Buscar ticker o nombre (ej. AAPL, Tesla)..."
                className="pl-10 bg-input"
              />
              {showDropdown && (
                <div className="absolute z-30 mt-1 left-0 right-0 bg-card border border-border rounded-md shadow-lg max-h-80 overflow-y-auto">
                  {filteredCedears.map((c) => (
                    <div
                      key={c.ticker}
                      onClick={() => selectCedear(c)}
                      className="px-3 py-2 hover:bg-secondary cursor-pointer border-b border-border last:border-0 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-semibold text-foreground">{c.ticker}</span>
                        <span className="text-xs text-muted-foreground ml-2">{c.name}</span>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>{c.market}</span>
                        <span className="bg-secondary px-2 py-0.5 rounded">{c.ratio}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{CEDEARS.length} CEDEARs · BYMA 16-Abr-2026</p>
          </div>

          {/* Ratio */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">
              Ratio (CEDEAR:Accion)
            </label>
            <Input
              type="text"
              value={selectedCedear?.ratio || '--'}
              readOnly
              className="bg-secondary num font-semibold"
            />
            <p className="text-xs text-muted-foreground mt-0.5">
              {selectedCedear ? ratioLabel(selectedCedear.ratio) : '--'}
            </p>
          </div>
        </div>

        {/* Prices row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-border">
          {/* CEDEAR ARS */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">
              CEDEAR ARS
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={cedearPrice}
                onChange={(e) => setCedearPrice(parseFloat(e.target.value) || 0)}
                className="bg-input num"
              />
              <Button variant="outline" size="icon" onClick={refreshCedear} className="shrink-0">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <p className={`text-xs mt-0.5 ${cedearSrc.includes('OK') ? 'text-primary' : 'text-muted-foreground'}`}>
              {cedearSrc}
            </p>
          </div>

          {/* US Price */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">
              Precio NYSE (USD)
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={usPrice}
                onChange={(e) => setUsPrice(parseFloat(e.target.value) || 0)}
                className="bg-input num"
              />
              <Button variant="outline" size="icon" onClick={refreshUS} className="shrink-0">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <p className={`text-xs mt-0.5 ${usSrc.includes('OK') ? 'text-primary' : 'text-muted-foreground'}`}>
              {usSrc}
            </p>
          </div>

          {/* Implied USD */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">
              Implicito USD
            </label>
            <Input
              type="text"
              value={impliedUSD > 0 ? `$${fmtNumber(impliedUSD, 2)}` : '--'}
              readOnly
              className="bg-secondary num font-semibold text-chart-2"
            />
            <p className="text-xs text-muted-foreground mt-0.5">(ratio x ARS) / CCL</p>
          </div>

          {/* Premium/Discount
              Prima (CEDEAR > NYSE) = malo para el comprador = rojo (text-destructive)
              Descuento (CEDEAR < NYSE) = bueno para el comprador = verde (text-primary) */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">
              Premium/Discount
            </label>
            <Input
              type="text"
              value={usPrice > 0 ? `${premium >= 0 ? '+' : ''}${fmtNumber(premium, 3)}%` : '--'}
              readOnly
              className={`bg-secondary num font-semibold ${
                premium > 0 ? 'text-destructive' : premium < 0 ? 'text-primary' : 'text-foreground'
              }`}
            />
            <p className="text-xs text-muted-foreground mt-0.5">
              CEDEAR vs NYSE · {premium > 0 ? 'prima (más caro)' : premium < 0 ? 'descuento (más barato)' : '--'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
