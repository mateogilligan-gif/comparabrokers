'use client'

import { useState } from 'react'
import { PortfolioBuilder } from '@/components/portfolio-builder'
import { ArbitrageComparator } from '@/components/arbitrage-comparator'
import { HiddenCostsTable } from '@/components/hidden-costs-table'
import { MarketDataSection } from '@/components/market-data-section'
import { DEFAULT_MARKET, type MarketParams } from '@/lib/broker-calculations'

export default function HomePage() {
  const [market, setMarket] = useState<MarketParams>(DEFAULT_MARKET)

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                CEDEAR vs Wallbit - Calculadora
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Comparador de costos para inversor minorista autogestionador - Datos en vivo
              </p>
            </div>
          </div>
        </header>

        {/* Main content */}
        <div className="space-y-6">
          {/* Portfolio Builder - Main Feature */}
          <PortfolioBuilder market={market} onMarketUpdate={setMarket} />

          {/* Market Data Section */}
          <MarketDataSection market={market} onMarketUpdate={setMarket} />

          {/* Arbitrage Comparator */}
          <ArbitrageComparator />

          {/* Hidden Costs Table */}
          <HiddenCostsTable />

          {/* Footer */}
          <footer className="text-xs text-muted-foreground text-center pb-6 space-y-2 pt-4 border-t border-border">
            <p>Datos BYMA - CCL en vivo via dolarapi.com - Precios CEDEAR/USA via stooq.com</p>
            <p>Calculadora educativa - No constituye asesoramiento financiero</p>
            <div className="mt-3 bg-secondary border border-border rounded-lg p-3 max-w-2xl mx-auto text-left">
              <details>
                <summary className="cursor-pointer font-semibold text-foreground">
                  ¿Los precios aparecen "no data"? Tips
                </summary>
                <div className="mt-2 space-y-1.5 text-muted-foreground text-xs leading-relaxed">
                  <p>El fetch corre server-side vía <code>/api/price</code> (no hay problemas de CORS).
                    Si igual falla, son los proveedores upstream:</p>
                  <p>1. <strong>Stooq</strong> a veces tarda 10-30s o devuelve N/D en horario de apertura.</p>
                  <p>2. <strong>Yahoo Finance</strong> a veces rate-limitea con 429 cuando hay mucho tráfico.</p>
                  <p>3. <strong>Input manual</strong>: dejá los valores a mano en los campos CEDEAR ARS / Precio NYSE
                    — toda la lógica de cálculo sigue funcionando.</p>
                </div>
              </details>
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}
