# Allpa · Lotes urbanizados frente al Cayambe

Página de venta de una urbanización de 132 lotes en Cayambe, con el nevado de frente. La urbanización se recorre en 3D: se elige un lote en el plano, se ve su ficha con medidas, precio y estado (disponible, reservado o vendido), y la vista real desde el terreno hacia el nevado. Un botón muestra cómo se verá el barrio con las casas construidas.

El simulador calcula el financiamiento directo con la urbanizadora: reserva, entrada desde el 20 % y cuotas fijas de 12 a 60 meses, sin intereses hasta 24 meses, o el precio de contado con descuento. El plan se envía como mensaje de WhatsApp, igual que la reserva de un lote y la visita al terreno.

Allpa es un proyecto demostrativo: la urbanización, los lotes, los precios, la disponibilidad y el avance de obra son ficticios, y el número de WhatsApp es de prueba (593000000000). Los lugares de Cayambe y sus distancias son referenciales.

## Tecnología

- React 19, TypeScript y Vite
- three.js con React Three Fiber, drei y postprocessing (sombreado ambiental N8AO, efecto maqueta y bloom)
- Motion para las animaciones de la interfaz
- Nada descargado: terreno, nevado, urbanización, casas, árboles y texturas se generan por código

## Cómo está hecho

- **Plano**: los lotes se calculan por manzanas y filas. Del mismo dato salen el 3D, el plano 2D, el dibujo de cada lote con sus medidas, los filtros y los precios por m² (tipo de lote, esquinero y etapa).
- **Nevado Cayambe**: un macizo ancho con tres cumbres, glaciares que bajan por las quebradas, roca y páramo según la altura, a 12 km de la urbanización.
- **Alrededores**: campos en parcelas, filas de eucaliptos, invernaderos de flores, casas de campo y la Panamericana.
- **Así será**: las casas aparecen en los lotes vendidos y en parte de los disponibles, y los árboles crecen.
- **Rendimiento**: al compilar, la página se genera como HTML (`scripts/prerender.mjs`) y React la retoma sin volver a dibujarla. El inicio muestra una imagen fija sacada de la misma escena y el 3D arranca solo si el equipo tiene tarjeta gráfica, o al elegir un lote.

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # revisa los tipos y genera dist/
npm run preview  # sirve dist/
```

Con `npm run dev`, abrir `/?poster` arranca el 3D sin esperar y sin girar, para sacar las imágenes fijas del inicio.

## Estructura

| Archivo | Contenido |
|---|---|
| `src/lots.ts` | Plano de la urbanización, lotes, precios y disponibilidad |
| `src/finance.ts` | Reserva, entrada, cuotas y pago de contado |
| `src/content.ts` | Obras incluidas, lugares cercanos, avance y preguntas |
| `src/scene/` | Terreno, nevado, urbanización, cámara y escena |
| `src/ui/` | Panel de lotes, ficha del lote, simulador y secciones |
| `public/poster*.webp` | Imagen fija del inicio, de escritorio y de celular |
| `scripts/prerender.mjs` | Genera el HTML de la página al compilar |

## Despliegue en Cloudflare Pages

- Comando de build: `npm run build`
- Directorio de salida: `dist`
- Versión de Node: la indica `.node-version` (22)
