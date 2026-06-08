// Rasteriza un <svg> del DOM a un PNG (dataURL) para incrustarlo en el PDF.
//
// Las gráficas usan colores con CSS custom properties (var(--primary), clases de
// Tailwind, etc.). Al serializar el SVG fuera del documento esas variables no se
// resuelven, así que antes de serializar copiamos los estilos *computados* —ya
// resueltos por el navegador— como estilo inline en cada nodo del clon.

export interface RasterImage {
  dataUrl: string
  width: number
  height: number
}

// Propiedades de presentación que afectan al render del SVG. Se excluye
// `transform` a propósito: el atributo del clon ya lo conserva y copiar la
// matriz computada puede desplazar los nodos.
const SVG_STYLE_PROPS = [
  'fill',
  'fill-opacity',
  'stroke',
  'stroke-width',
  'stroke-opacity',
  'stroke-dasharray',
  'stroke-dashoffset',
  'stroke-linecap',
  'stroke-linejoin',
  'opacity',
  'stop-color',
  'stop-opacity',
  'color',
  'font-family',
  'font-size',
  'font-weight',
  'text-anchor',
]

function inlineComputedStyles(source: Element, target: Element) {
  const computed = window.getComputedStyle(source)
  let style = target.getAttribute('style') ?? ''
  for (const prop of SVG_STYLE_PROPS) {
    const value = computed.getPropertyValue(prop)
    if (value) style += `${prop}:${value};`
  }
  target.setAttribute('style', style)

  const sourceChildren = source.children
  const targetChildren = target.children
  for (let i = 0; i < sourceChildren.length; i += 1) {
    const targetChild = targetChildren[i]
    if (targetChild) inlineComputedStyles(sourceChildren[i], targetChild)
  }
}

export async function svgToPng(svg: SVGSVGElement, scale = 2): Promise<RasterImage> {
  const rect = svg.getBoundingClientRect()
  const width = Math.max(1, Math.round(rect.width || svg.clientWidth || 300))
  const height = Math.max(1, Math.round(rect.height || svg.clientHeight || 200))

  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', String(width))
  clone.setAttribute('height', String(height))
  if (!clone.getAttribute('viewBox')) {
    clone.setAttribute('viewBox', `0 0 ${width} ${height}`)
  }

  // El PDF tiene fondo blanco; forzamos el tema claro mientras leemos los
  // estilos computados para que ejes y textos salgan en tonos oscuros legibles
  // aunque la app esté en tema oscuro. El cambio es síncrono (sin repintado
  // intermedio), así que no produce parpadeo visible.
  const root = document.documentElement
  const hadLight = root.classList.contains('light')
  root.classList.add('light')
  try {
    inlineComputedStyles(svg, clone)
  } finally {
    if (!hadLight) root.classList.remove('light')
  }

  const serialized = new XMLSerializer().serializeToString(clone)
  const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(serialized)}`

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('No se pudo rasterizar la gráfica'))
    img.src = svgUrl
  })

  const canvas = document.createElement('canvas')
  canvas.width = width * scale
  canvas.height = height * scale
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D no disponible')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

  return { dataUrl: canvas.toDataURL('image/png'), width, height }
}
