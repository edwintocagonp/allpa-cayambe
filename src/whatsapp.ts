import { BRAND } from "./content";
import { RESERVE, money, type Simulation } from "./finance";
import { TYPES, lotTitle, type Lot } from "./lots";

export const waLink = (text: string) => `https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(text)}`;

const describe = (lot: Lot) => `${lotTitle(lot)} · ${TYPES[lot.type].name.toLowerCase()}${lot.corner ? " esquinero" : ""} · etapa ${lot.etapa} · ${lot.area} m² (${lot.frente.toFixed(1).replace(".", ",")} × ${lot.fondo} m)`;

export function reserveMessage(lot: Lot) {
  return [`Hola, Allpa 👋 Quiero separar este lote:`, `• ${describe(lot)}`, `• Precio: ${money(lot.price)}`, `¿Me ayudan con la reserva de ${money(RESERVE)}?`].join("\n");
}

export function planMessage(lot: Lot, sim: Simulation) {
  const lines = sim.months
    ? [`• Entrada: ${money(sim.down)}`, `• Saldo: ${sim.months} cuotas de ${money(sim.monthly)}${sim.rate ? ` (${sim.rate} % anual)` : " sin intereses"}`]
    : [`• De contado con descuento: ${money(sim.total)}`];
  return [`Hola, Allpa 👋 Me interesa este plan:`, `• ${describe(lot)}`, `• Precio: ${money(sim.price)}`, `• Reserva: ${money(RESERVE)}`, ...lines, `¿Me confirman el plan?`].join("\n");
}

export function visitMessage(name: string, day: string, slot: string, interest: string) {
  return [`Hola, Allpa 👋 Soy ${name || "un interesado"}.`, `Quiero visitar el terreno el ${day} en la ${slot}.`, `Me interesa: ${interest}.`].join("\n");
}

export const infoMessage = () => `Hola, Allpa 👋 Quiero más información sobre los lotes en Cayambe.`;
