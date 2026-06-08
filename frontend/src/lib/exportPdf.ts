import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { RasterImage } from './svgToPng'

export interface ReportSection {
  titulo: string
  headers: string[]
  rows: (string | number)[][]
  vacioMsg?: string
}

export interface KpiHighlight {
  label: string
  value: string
}

export interface BarChartSpec {
  titulo: string
  data: { label: string; value: number; unit?: string }[]
}

export interface RasterChart {
  titulo: string
  image: RasterImage
  maxHeightMm?: number
}

export interface PdfReportInput {
  rango: number
  generado: string
  kpis: KpiHighlight[]
  rasterCharts: RasterChart[]
  barCharts: BarChartSpec[]
  sections: ReportSection[]
}

type Rgb = [number, number, number]

// Paleta de marca alineada con los colores de impresión de index.css.
const BRAND: Rgb = [15, 118, 110] // --primary #0f766e
const INK: Rgb = [17, 24, 39] // --foreground #111827
const MUTED: Rgb = [75, 85, 99] // --muted-foreground #4b5563
const BORDER: Rgb = [209, 213, 219] // --border #d1d5db
const TRACK: Rgb = [243, 244, 246] // --secondary #f3f4f6
const BAR_PALETTE: Rgb[] = [
  [15, 118, 110],
  [31, 95, 133],
  [146, 64, 14],
  [4, 120, 87],
  [109, 40, 217],
]

const PAGE_W = 210
const PAGE_H = 297
const MARGIN = 14
const CONTENT_W = PAGE_W - MARGIN * 2

export function exportPdf(input: PdfReportInput) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  let y = MARGIN

  const ensure = (needed: number) => {
    if (y + needed > PAGE_H - MARGIN) {
      doc.addPage()
      y = MARGIN
    }
  }

  const truncate = (text: string, maxWidth: number) => {
    if (doc.getTextWidth(text) <= maxWidth) return text
    let result = text
    while (result.length > 1 && doc.getTextWidth(`${result}…`) > maxWidth) {
      result = result.slice(0, -1)
    }
    return `${result}…`
  }

  // ── Encabezado ────────────────────────────────────────────────────
  doc.setFillColor(...BRAND)
  doc.rect(0, 0, PAGE_W, 4, 'F')
  y = 20
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(...BRAND)
  doc.text('Reporte de Análisis de Flota', MARGIN, y)
  y += 7
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...MUTED)
  doc.text(`Sistema de Paquetería · Últimos ${input.rango} días`, MARGIN, y)
  y += 5
  doc.text(`Generado: ${input.generado}`, MARGIN, y)
  y += 4
  doc.setDrawColor(...BORDER)
  doc.line(MARGIN, y, PAGE_W - MARGIN, y)
  y += 8

  // ── Resumen de KPIs ───────────────────────────────────────────────
  if (input.kpis.length > 0) {
    sectionTitle(doc, 'Resumen ejecutivo', y)
    y += 8
    const perRow = 3
    const gap = 4
    const cardW = (CONTENT_W - gap * (perRow - 1)) / perRow
    const cardH = 18
    input.kpis.forEach((kpi, index) => {
      const col = index % perRow
      if (col === 0 && index > 0) y += cardH + gap
      if (col === 0) ensure(cardH)
      const x = MARGIN + col * (cardW + gap)
      doc.setDrawColor(...BORDER)
      doc.setFillColor(...TRACK)
      doc.roundedRect(x, y, cardW, cardH, 1.5, 1.5, 'FD')
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...MUTED)
      doc.text(truncate(kpi.label.toUpperCase(), cardW - 6), x + 4, y + 6)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(15)
      doc.setTextColor(...INK)
      doc.text(truncate(kpi.value, cardW - 6), x + 4, y + 14)
    })
    y += cardH + 10
  }

  // ── Gráficas rasterizadas (área, dona) ────────────────────────────
  for (const chart of input.rasterCharts) {
    const aspect = chart.image.height / chart.image.width
    const drawW = CONTENT_W
    let drawH = drawW * aspect
    const maxH = chart.maxHeightMm ?? 90
    let finalW = drawW
    if (drawH > maxH) {
      drawH = maxH
      finalW = drawH / aspect
    }
    ensure(drawH + 12)
    sectionTitle(doc, chart.titulo, y)
    y += 8
    const x = MARGIN + (CONTENT_W - finalW) / 2
    doc.addImage(chart.image.dataUrl, 'PNG', x, y, finalW, drawH)
    y += drawH + 8
  }

  // ── Gráficas de barras nativas ────────────────────────────────────
  for (const bar of input.barCharts) {
    y = drawBarChart(doc, bar, y, ensure, truncate)
    y += 6
  }

  // ── Tablas ────────────────────────────────────────────────────────
  for (const section of input.sections) {
    ensure(20)
    sectionTitle(doc, section.titulo, y)
    y += 6
    if (section.rows.length === 0) {
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(9)
      doc.setTextColor(...MUTED)
      doc.text(section.vacioMsg ?? 'Sin datos disponibles', MARGIN, y + 4)
      y += 10
      continue
    }
    autoTable(doc, {
      startY: y,
      head: [section.headers],
      body: section.rows.map((row) => row.map((cell) => String(cell))),
      margin: { left: MARGIN, right: MARGIN },
      styles: { fontSize: 9, cellPadding: 2, textColor: INK, lineColor: BORDER, lineWidth: 0.1 },
      headStyles: { fillColor: BRAND, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: TRACK },
      theme: 'striped',
    })
    const lastAutoTable = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
    y = (lastAutoTable?.finalY ?? y) + 10
  }

  // ── Pie de página con numeración ──────────────────────────────────
  const pageCount = doc.getNumberOfPages()
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...MUTED)
    doc.text('Sistema de Paquetería · Equipo 6B', MARGIN, PAGE_H - 8)
    doc.text(`Página ${page} de ${pageCount}`, PAGE_W - MARGIN, PAGE_H - 8, { align: 'right' })
  }

  doc.save(`analisis-${new Date().toISOString().slice(0, 10)}.pdf`)
}

function sectionTitle(doc: jsPDF, text: string, y: number) {
  doc.setFillColor(...BRAND)
  doc.rect(MARGIN, y - 3.5, 1.4, 4.5, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...INK)
  doc.text(text, MARGIN + 4, y)
}

function drawBarChart(
  doc: jsPDF,
  spec: BarChartSpec,
  startY: number,
  ensure: (needed: number) => void,
  truncate: (text: string, maxWidth: number) => string,
): number {
  const rowH = 7
  const labelW = 42
  const valueW = 26
  const trackX = MARGIN + labelW + 2
  const trackW = CONTENT_W - labelW - valueW - 4

  ensure(12)
  sectionTitle(doc, spec.titulo, startY)
  let y = startY + 6

  if (spec.data.length === 0) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(...MUTED)
    doc.text('Sin datos disponibles', MARGIN, y + 4)
    return y + 10
  }

  const ordered = [...spec.data].sort((a, b) => b.value - a.value)
  const maxValue = Math.max(...ordered.map((d) => d.value), 1)

  for (let i = 0; i < ordered.length; i += 1) {
    const datum = ordered[i]
    ensure(rowH + 2)
    if (y + rowH + 2 > PAGE_H - MARGIN) y = MARGIN
    const cy = y + rowH / 2

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...INK)
    doc.text(truncate(datum.label, labelW), MARGIN, cy + 1.2)

    doc.setFillColor(...TRACK)
    doc.setDrawColor(...BORDER)
    doc.roundedRect(trackX, y + 1, trackW, rowH - 2, 0.8, 0.8, 'FD')

    const ratio = Math.max(0, datum.value) / maxValue
    const fillW = Math.max(datum.value > 0 ? 1.5 : 0, trackW * ratio)
    if (fillW > 0) {
      const color = BAR_PALETTE[i % BAR_PALETTE.length]
      doc.setFillColor(...color)
      doc.roundedRect(trackX, y + 1, fillW, rowH - 2, 0.8, 0.8, 'F')
    }

    const valueText = `${Number.isInteger(datum.value) ? datum.value : datum.value.toFixed(1)} ${datum.unit ?? ''}`.trim()
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(...MUTED)
    doc.text(valueText, PAGE_W - MARGIN, cy + 1.2, { align: 'right' })

    y += rowH
  }

  return y + 2
}
