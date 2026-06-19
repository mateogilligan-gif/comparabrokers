// Default market parameters
export interface MarketParams {
  ccl: number
  cedearPriceARS: number
  cedearRatio: number
  cedearTicker: string
  usPrice: number
  balanzCommission: number
  allariaCommission: number
  balanzCommissionOperador: number
  allariaCommissionOperador: number
  wallbitCommission: number
  wallbitCommissionPro: number
  wallbitCommissionMax: number
  wallbitFeeClassic: number
  wallbitFeePro: number
  wallbitFeeMax: number
  wallbitCapMax: number
  wallbitAPRClassic: number
  wallbitAPRPro: number
  wallbitAPRMax: number
  cocosCommissionHumanas: number
  cocosCommissionOperador: number
  cocosProMonthly: number
  cocosCustodyThreshold: number
  cocosCustodyARS: number
  iva: number
  fondeoWallbit: number
  bymaDerechos: number
  allariaCustodiaARS: number
  swiftOurLow: number
  swiftOurHigh: number
  swiftBankPct: number
  swiftBankThreshold: number
  dividendYield: number
  irsWithhold: number
  comafiDivTier1: number
  comafiDivTier2: number
  comafiDivTier3: number
  comafiTier1Max: number
  comafiTier2Max: number
  divFeeAllaria: number
  divFeeBalanz: number
  divFeeCocos: number
  lemonCommission: number
  arqStandardCommission: number
  arqStandardMinPerTrade: number
  arqStandardAUM: number
  arqStandardDepositFee: number
}

export const DEFAULT_MARKET: MarketParams = {
  ccl: 1467,
  cedearPriceARS: 38380,
  cedearRatio: 15,
  cedearTicker: 'TSLA',
  usPrice: 391.71,
  balanzCommission: 0.50,
  allariaCommission: 0.50,
  balanzCommissionOperador: 1.50,
  allariaCommissionOperador: 1.50,
  // Wallbit 3 planes
  wallbitCommission: 0.40,    // Classic
  wallbitCommissionPro: 0.35, // Pro
  wallbitCommissionMax: 0.30, // Max
  wallbitFeeClassic: 0,       // USD/mes
  wallbitFeePro: 9.99,
  wallbitFeeMax: 19.99,
  wallbitCapMax: 10,          // cap USD por trade (Max)
  wallbitAPRClassic: 3.00,
  wallbitAPRPro: 3.35,
  wallbitAPRMax: 3.75,
  // Cocos Capital
  cocosCommissionHumanas: 0.45,
  cocosCommissionOperador: 1.00,
  cocosProMonthly: 150,
  cocosCustodyThreshold: 200000,
  cocosCustodyARS: 1000,
  iva: 21,
  fondeoWallbit: 4.5,
  bymaDerechos: 0.01,
  allariaCustodiaARS: 35,
  // SWIFT bancario
  swiftOurLow: 12.10,
  swiftOurHigh: 24.20,
  swiftBankPct: 0.175,
  swiftBankThreshold: 1000,
  // Dividend drag
  dividendYield: 0,
  irsWithhold: 30,
  comafiDivTier1: 8,
  comafiDivTier2: 7,
  comafiDivTier3: 6,
  comafiTier1Max: 20000,
  comafiTier2Max: 80000,
  divFeeAllaria: 2.00,
  divFeeBalanz: 0.35,
  divFeeCocos: 0.25,
  // Lemon Stocks: 0,50% comisión vía Alpaca backend, sin IVA (es vía Quaestus AAGI / Alpaca USA)
  lemonCommission: 0.50,
  // ARQ Standard (vigente desde 20-jul-2026): 0,2% mín $1, $3/depósito, 1% AUM anual
  // Pier 5 S.A. de C.V. (PSAV México) — conversión USDc/USD, no es intermediación de valores
  arqStandardCommission: 0.20,
  arqStandardMinPerTrade: 1.00,
  arqStandardAUM: 1.00,
  arqStandardDepositFee: 3.00,
}

export interface PortfolioStrategy {
  id: string
  label: string
  color: string
}

export const PORTFOLIO_STRATEGIES: PortfolioStrategy[] = [
  { id: 'balanz', label: 'Balanz', color: '#7c3aed' },
  { id: 'allaria', label: 'Allaria', color: '#0ea5e9' },
  { id: 'cocosHumanas', label: 'Cocos Humanas', color: '#f59e0b' },
  { id: 'cocosPro', label: 'Cocos Pro', color: '#ca8a04' },
  { id: 'lemon', label: 'Lemon Stocks', color: '#a3e635' },
  { id: 'arqStandard', label: 'ARQ Standard', color: '#14b8a6' },
  { id: 'wbClassic', label: 'Wallbit Classic', color: '#3b82f6' },
  { id: 'wbPro', label: 'Wallbit Pro', color: '#1d4ed8' },
  { id: 'wbMax', label: 'Wallbit Max', color: '#1e3a8a' },
]

export interface PortfolioConfig {
  capital: number
  tickers: string[]
  rotations: number
  meses: number
  origen: 'usd_local' | 'usd_exterior' | 'ars_local'
  operatorMode: 'home_broker' | 'operador'
}

export interface CostResult {
  id: string
  label: string
  color: string
  commissions: number
  subscription: number
  fondeo: number
  subscriptionFondeo: number
  custodia: number
  divDrag: number
  total: number
  numTrades: number
  tradesPerTicker: number
  perTicket: number
  commPerTrade: number
}

// Utility functions
export function parseRatio(r: string): number | null {
  const [a, b] = r.split(':').map(Number)
  if (!b || !a) return null
  return a / b
}

export function ratioLabel(r: string): string {
  const v = parseRatio(r)
  if (!v) return '--'
  if (v >= 1) return `${v} CEDEAR(s) = 1 accion`
  return `1 CEDEAR = ${1 / v} acciones`
}

export function fmtUSD(v: number): string {
  return isFinite(v) ? '$' + v.toFixed(2) : '--'
}

export function fmtARS(v: number): string {
  return isFinite(v) ? '$' + v.toLocaleString('es-AR', { maximumFractionDigits: 0 }) : '--'
}

export function fmtPct(v: number): string {
  return isFinite(v) ? v.toFixed(3) + '%' : '--'
}

export function fmtNumber(v: number, decimals = 2): string {
  return isFinite(v) ? v.toLocaleString('es-AR', { maximumFractionDigits: decimals, minimumFractionDigits: decimals }) : '--'
}

// SWIFT cost calculation
function computeSwiftCost(amountUSD: number, market: MarketParams): number {
  if (!isFinite(amountUSD) || amountUSD <= 0) return 0
  const our = amountUSD < 500 ? market.swiftOurLow : market.swiftOurHigh
  const bankPct = amountUSD < market.swiftBankThreshold ? 0 : market.swiftBankPct
  const bankFee = amountUSD * (bankPct / 100) * (1 + market.iva / 100)
  return our + bankFee
}

// Dividend drag calculation
function computeDividendDrag(m: MarketParams, capital: number, meses: number, alycDivFeePct: number): number {
  const y = (m.dividendYield || 0) / 100
  if (y <= 0 || capital <= 0) return 0
  const grossAnnual = capital * y
  const afterIrs = grossAnnual * (1 - (m.irsWithhold || 30) / 100)
  
  let comafiPct: number
  if (afterIrs < (m.comafiTier1Max || 20000)) comafiPct = m.comafiDivTier1 || 8
  else if (afterIrs < (m.comafiTier2Max || 80000)) comafiPct = m.comafiDivTier2 || 7
  else comafiPct = m.comafiDivTier3 || 6
  
  const ivaMult = 1 + (m.iva || 21) / 100
  const comafiFee = afterIrs * (comafiPct / 100) * ivaMult
  const alycFee = afterIrs * ((alycDivFeePct || 0) / 100) * ivaMult
  const annualDrag = comafiFee + alycFee
  return annualDrag * (meses / 12)
}

// Main cost calculation function
export function computePortfolioCost(cfg: PortfolioConfig, strategyId: string, market: MarketParams): CostResult {
  const K = Math.max(cfg.tickers.length, 1)
  const perTicket = cfg.capital / K
  const tradesPerTicker = 1 + 2 * cfg.rotations
  const numTrades = K * tradesPerTicker

  let commPct = 0
  let feeMonthly = 0
  let capPerTrade = Infinity
  let floorPerTrade = 0
  let custodia = 0
  let fondeo = 0
  let divDrag = 0

  const isOp = cfg.operatorMode === 'operador'
  const strategy = PORTFOLIO_STRATEGIES.find(s => s.id === strategyId)!

  if (strategyId === 'balanz') {
    const rate = isOp ? market.balanzCommissionOperador : market.balanzCommission
    commPct = rate * (1 + market.iva / 100) + market.bymaDerechos
    divDrag = computeDividendDrag(market, cfg.capital, cfg.meses, market.divFeeBalanz)
  } else if (strategyId === 'allaria') {
    const rate = isOp ? market.allariaCommissionOperador : market.allariaCommission
    commPct = rate * (1 + market.iva / 100) + market.bymaDerechos
    custodia = market.allariaCustodiaARS * (1 + market.iva / 100) * cfg.meses / market.ccl
    divDrag = computeDividendDrag(market, cfg.capital, cfg.meses, market.divFeeAllaria)
  } else if (strategyId === 'cocosHumanas') {
    const rate = isOp ? market.cocosCommissionOperador : market.cocosCommissionHumanas
    commPct = rate * (1 + market.iva / 100) + market.bymaDerechos
    if (cfg.capital > market.cocosCustodyThreshold) {
      custodia = market.cocosCustodyARS * (1 + market.iva / 100) * cfg.meses / market.ccl
    }
    divDrag = computeDividendDrag(market, cfg.capital, cfg.meses, market.divFeeCocos)
  } else if (strategyId === 'cocosPro') {
    commPct = 0 + market.bymaDerechos
    // Cocos Pro abono USD 150/mes + IVA (tarifario oficial confirma "precios no incluyen IVA")
    feeMonthly = market.cocosProMonthly * (1 + market.iva / 100)
    if (cfg.capital > market.cocosCustodyThreshold) {
      custodia = market.cocosCustodyARS * (1 + market.iva / 100) * cfg.meses / market.ccl
    }
    divDrag = computeDividendDrag(market, cfg.capital, cfg.meses, market.divFeeCocos)
  } else if (strategyId === 'lemon') {
    // Lemon Stocks: 0,50% comisión, sin IVA (vía Alpaca USA), sin BYMA, sin sub, sin custodia
    // Sin APR confirmado sobre USD ocioso (a verificar — actualmente 0)
    commPct = market.lemonCommission
  } else if (strategyId === 'arqStandard') {
    // ARQ Standard: 0,2% comisión por trade, mín $1 USDc (vía Pier 5 PSAV México)
    // + $3 fondeo one-time + 1% AUM anual modelado como custodia prorrateada
    // Sin IVA argentino, sin BYMA, sin APR sobre USD ocioso
    commPct = market.arqStandardCommission
    floorPerTrade = market.arqStandardMinPerTrade
    // AUM 1% anual sobre el NAV, prorrateado al horizonte
    custodia = cfg.capital * (market.arqStandardAUM / 100) * (cfg.meses / 12)
    // Fondeo $3 one-time (1 depósito inicial)
    fondeo = market.arqStandardDepositFee
  } else if (strategyId.startsWith('wb')) {
    const plan = strategyId === 'wbClassic' ? 'classic' : strategyId === 'wbPro' ? 'pro' : 'max'
    commPct = plan === 'pro' ? market.wallbitCommissionPro
            : plan === 'max' ? market.wallbitCommissionMax
            : market.wallbitCommission
    feeMonthly = plan === 'pro' ? market.wallbitFeePro
               : plan === 'max' ? market.wallbitFeeMax
               : market.wallbitFeeClassic
    capPerTrade = plan === 'max' ? (market.wallbitCapMax || Infinity) : Infinity
    
    // Fondeo one-time
    if (cfg.origen === 'ars_local') {
      fondeo = cfg.capital * market.fondeoWallbit / (100 - market.fondeoWallbit)
    } else if (cfg.origen === 'usd_local') {
      fondeo = computeSwiftCost(cfg.capital, market)
    }
  }

  // commPerTrade = max(floor, min(pct × ticket, cap))
  // - floor: ARQ tiene mín $1 USDc por trade
  // - cap: Wallbit Max tiene cap $10 por trade
  const rawCommPerTrade = perTicket * (commPct / 100)
  const commPerTrade = Math.max(floorPerTrade, Math.min(rawCommPerTrade, capPerTrade))
  const commissions = numTrades * commPerTrade
  const subscription = feeMonthly * cfg.meses
  const total = commissions + subscription + fondeo + custodia + divDrag

  return {
    id: strategyId,
    label: strategy.label,
    color: strategy.color,
    commissions,
    subscription,
    fondeo,
    subscriptionFondeo: subscription + fondeo,
    custodia,
    divDrag,
    total,
    numTrades,
    tradesPerTicker,
    perTicket,
    commPerTrade,
  }
}
