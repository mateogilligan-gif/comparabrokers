'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Fragment } from 'react'

// Tabla de costos ocultos por broker · 7 brokers · misma columna que el Portfolio Builder
// Estilos: good=verde (positivo), bad=rojo (negativo), neut=normal, hide=N/A grisado

interface Row {
  label: string
  values: string[]
  styles: ('good' | 'bad' | 'neut' | 'hide')[]
  bold?: boolean
}

interface Category {
  name: string
  rows: Row[]
}

const COST_DATA: { categories: Category[]; brokers: { name: string; color: string }[] } = {
  categories: [
    {
      name: 'Apertura, mantenimiento y accesos',
      rows: [
        {
          label: 'Apertura de cuenta',
          values: ['Sin cargo', 'Sin cargo', 'Sin cargo', 'Sin cargo', 'Sin cargo', 'Sin cargo', 'Sin cargo'],
          styles: ['good', 'good', 'good', 'good', 'good', 'good', 'good'],
        },
        {
          label: 'Mantenimiento de cuenta',
          values: ['Sin cargo', 'Sin cargo', 'Sin cargo', 'Sin cargo', 'Sin cargo', 'Sin cargo', 'Sin cargo'],
          styles: ['good', 'good', 'good', 'good', 'good', 'good', 'good'],
        },
      ],
    },
    {
      name: 'Comisión operativa',
      rows: [
        {
          label: 'Comisión por compra/venta',
          values: ['Hasta 0,50%', '0,50%', '0,45%', '0%', '0,40%', '0,35%', '0,30%'],
          styles: ['neut', 'neut', 'neut', 'good', 'neut', 'neut', 'neut'],
        },
        {
          label: 'IVA sobre comisión',
          values: ['+21%†', '+21%', '+21%', '—', '—', '—', '—'],
          styles: ['bad', 'bad', 'bad', 'hide', 'good', 'good', 'good'],
        },
        {
          label: 'Comisión efectiva (c/IVA)',
          values: ['0,605%', '0,605%', '0,545%', '0%', '0,40%', '0,35%', '0,30%'],
          styles: ['neut', 'neut', 'neut', 'good', 'neut', 'neut', 'neut'],
          bold: true,
        },
        {
          label: 'Tope por operación',
          values: ['sin tope', 'sin tope', 'sin tope', 'sin tope', 'sin tope', 'sin tope', 'USD 10'],
          styles: ['bad', 'bad', 'bad', 'bad', 'bad', 'bad', 'good'],
        },
      ],
    },
    {
      name: 'Cargos de mercado y regulatorios',
      rows: [
        {
          label: 'Derechos BYMA (hasta)',
          values: ['0,01%', '0,01%*', '0,01%', '0,01%', 'incluido', 'incluido', 'incluido'],
          styles: ['neut', 'neut', 'neut', 'neut', 'hide', 'hide', 'hide'],
        },
        {
          label: 'Gastos conversión CEDEAR',
          values: ['USD 0,03/CEDEAR + IVA', 'USD 0,10/ADR + $20 fijo', 'aplica conversión', 'aplica conversión', 'N/A', 'N/A', 'N/A'],
          styles: ['bad', 'bad', 'bad', 'bad', 'good', 'good', 'good'],
        },
        {
          label: 'Renta/dividendos CEDEAR',
          values: ['Hasta 0,35% + IVA', '2% + IVA', '0,25% + IVA', '0,25% + IVA', 'neto al saldo', 'neto al saldo', 'neto al saldo'],
          styles: ['bad', 'bad', 'neut', 'neut', 'good', 'good', 'good'],
        },
      ],
    },
    {
      name: 'Custodia y abonos',
      rows: [
        {
          label: 'Custodia mensual',
          values: ['$0', '$35 ARS + IVA', '$0 (saldo < USD 200k)', '$0 (saldo < USD 200k)', '$0', '$0', '$0'],
          styles: ['good', 'bad', 'good', 'good', 'good', 'good', 'good'],
        },
        {
          label: 'Abono mensual (plan)',
          values: ['$0', '$0', '$0', 'desde USD 150 + IVA', '$0', 'USD 9,99', 'USD 19,99'],
          styles: ['good', 'good', 'good', 'bad', 'good', 'neut', 'neut'],
        },
      ],
    },
    {
      name: 'Ingreso y egreso de fondos',
      rows: [
        {
          label: 'Fondeo USD local',
          values: ['transferencia gratis', 'transferencia gratis', 'transferencia gratis', 'transferencia gratis', 'no aplica', 'no aplica', 'no aplica'],
          styles: ['good', 'good', 'good', 'good', 'hide', 'hide', 'hide'],
        },
        {
          label: 'Fondeo USD desde exterior (cable entrante)',
          values: ['gratis', 'según plaza', 'USD 10', 'USD 10', 'OUR 24,20 + 0,21%', 'OUR 24,20 + 0,21%', 'OUR 24,20 + 0,21%'],
          styles: ['good', 'neut', 'bad', 'bad', 'bad', 'bad', 'bad'],
        },
        {
          label: 'Fondeo ARS local',
          values: ['gratis', 'gratis', 'gratis', 'gratis', '4,5%', '4,5%', '4,5%'],
          styles: ['good', 'good', 'good', 'good', 'bad', 'bad', 'bad'],
        },
        {
          label: 'Spread cambiario al comprar',
          values: ['precio CEDEAR (CCL+spread)', 'precio CEDEAR (CCL+spread)', 'precio CEDEAR (CCL+spread)', 'precio CEDEAR (CCL+spread)', 'precio NYSE real', 'precio NYSE real', 'precio NYSE real'],
          styles: ['neut', 'neut', 'neut', 'neut', 'good', 'good', 'good'],
        },
        {
          label: 'Retiro USD (cable saliente)',
          values: ['USD 10 + IVA', 'según plaza', 'gratis', 'gratis', 'gratis', 'gratis', 'gratis'],
          styles: ['bad', 'neut', 'good', 'good', 'good', 'good', 'good'],
        },
      ],
    },
    {
      name: 'Rendimiento sobre saldo',
      rows: [
        {
          label: 'APR sobre USD ocioso',
          values: ['—', '—', '—', '—', '3,00%', '3,35%', '3,75%'],
          styles: ['hide', 'hide', 'hide', 'hide', 'good', 'good', 'good'],
        },
      ],
    },
    {
      name: 'Alternativa: comprar acción en exterior directa',
      rows: [
        {
          label: 'Mesa asistida',
          values: ['1,50% + IVA', '1,50% + IVA · mín USD 10', '1% + IVA', '1% + IVA', 'incluido', 'incluido', 'incluido'],
          styles: ['bad', 'bad', 'bad', 'bad', 'good', 'good', 'good'],
        },
        {
          label: 'Mandato exterior (autogestión)',
          values: ['0,50% + IVA', 'no documentado', '0,20% + IVA', '0,20% + IVA', 'no aplica', 'no aplica', 'no aplica'],
          styles: ['neut', 'hide', 'good', 'good', 'hide', 'hide', 'hide'],
        },
      ],
    },
  ],
  brokers: [
    { name: 'Balanz', color: '#7c3aed' },
    { name: 'Allaria', color: '#0ea5e9' },
    { name: 'Cocos Hum.', color: '#f59e0b' },
    { name: 'Cocos Pro', color: '#ca8a04' },
    { name: 'WB Classic', color: '#3b82f6' },
    { name: 'WB Pro', color: '#1d4ed8' },
    { name: 'WB Max', color: '#1e3a8a' },
  ],
}

function getCellStyle(style: string): string {
  switch (style) {
    case 'good':
      return 'text-primary'
    case 'bad':
      return 'text-destructive'
    case 'hide':
      return 'text-muted-foreground italic'
    default:
      return 'text-foreground'
  }
}

export function HiddenCostsTable() {
  const cols = COST_DATA.brokers.length + 1 // +1 for "Concepto" column

  return (
    <Card className="border border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold text-foreground uppercase tracking-wider">
          Costos ocultos · Desglose línea por línea
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Todos los cargos, abonos, spreads y fees — los obvios y los que no aparecen hasta que llega la liquidación.
          Fuente: PDF oficial Allaria, tarifario oficial Balanz (balanz.com/comisiones), tarifario oficial Cocos Capital (cocos.capital/tarifario) y condiciones públicas Wallbit. ‡Balanz documenta sólo "mandato exterior" sin distinguir modalidad asistida vs autogestión.
        </p>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto border border-border rounded-lg">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-secondary">
                <th className="text-left py-3 px-3 font-semibold text-muted-foreground uppercase tracking-wider min-w-[180px]">
                  Concepto
                </th>
                {COST_DATA.brokers.map((broker) => (
                  <th key={broker.name} className="text-center py-3 px-2">
                    <Badge
                      className="text-white text-[10px] font-bold whitespace-nowrap"
                      style={{ backgroundColor: broker.color }}
                    >
                      {broker.name}
                    </Badge>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COST_DATA.categories.map((category, catIdx) => (
                <Fragment key={`cat-${catIdx}`}>
                  <tr className="bg-muted">
                    <td
                      colSpan={cols}
                      className="py-2 px-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground"
                    >
                      {category.name}
                    </td>
                  </tr>
                  {category.rows.map((row, rowIdx) => (
                    <tr
                      key={`row-${catIdx}-${rowIdx}`}
                      className="border-b border-border hover:bg-secondary/50 transition-colors"
                    >
                      <td className={`py-2 px-3 text-foreground ${row.bold ? 'font-semibold' : ''}`}>
                        {row.label}
                      </td>
                      {row.values.map((value, valIdx) => (
                        <td
                          key={valIdx}
                          className={`py-2 px-2 text-center text-[11px] num ${getCellStyle(
                            row.styles[valIdx],
                          )} ${row.bold ? 'font-semibold' : ''}`}
                        >
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Notes */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-secondary border border-border rounded-lg p-3">
            <strong className="uppercase tracking-wider text-xs text-foreground">* Derechos BYMA</strong>
            <p className="mt-1 text-muted-foreground">
              Operaciones en Rueda Continua No Garantizada no pagan derechos de Bolsa (incluido en precio).
              Si operás en PPT se suma 0,01%.
            </p>
          </div>
          <div className="bg-secondary border border-border rounded-lg p-3">
            <strong className="uppercase tracking-wider text-xs text-foreground">† IVA en Balanz</strong>
            <p className="mt-1 text-muted-foreground">
              El tarifario público no detalla "+ IVA" explícitamente para comisiones operativas. En la práctica
              suele liquidarse con 21%; confirmá en tu primera liquidación.
            </p>
          </div>
          <div className="bg-secondary border border-border rounded-lg p-3">
            <strong className="uppercase tracking-wider text-xs text-foreground">Hidden cost más grande</strong>
            <p className="mt-1 text-muted-foreground">
              El spread CEDEAR. Si cotiza con prima vs. el implícito ya perdiste antes de sumar comisiones.
              Wallbit compra la acción en NYSE/NASDAQ al precio real.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
