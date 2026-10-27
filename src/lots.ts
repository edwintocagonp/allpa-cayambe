export type Status = "disponible" | "reservado" | "vendido";
export type LotType = "estandar" | "amplio" | "parque" | "mirador";
export type Rect = [number, number, number, number];

export type Lot = {
  id: string;
  block: string;
  number: number;
  etapa: 1 | 2;
  rect: Rect;
  frente: number;
  fondo: number;
  area: number;
  type: LotType;
  corner: boolean;
  faces: "norte" | "sur";
  status: Status;
  perM2: number;
  price: number;
};

export const SITE: Rect = [-150, -110, 150, 110];
export const PARK: Rect = [-71, -44, 71, 6];
export const GATE = { x: 0, z: 110 };
export const VOLCANO = { x: 2600, z: -11800, summit: 2960 };

export type Street = { rect: Rect; kind: "calle" | "bulevar" };

const H_STREETS = [-106, -48, 10, 68, 106];
const V_STREETS = [-146, -75, 75, 146];

export const STREETS: Street[] = [
  ...H_STREETS.map((z): Street => ({ rect: [-150, z - 4, 150, z + 4], kind: "calle" })),
  ...V_STREETS.map((x): Street => ({ rect: [x - 4, -110, x + 4, 110], kind: "calle" })),
  { rect: [-4, -110, 4, -52], kind: "calle" },
  { rect: [-7, 6, 7, 110], kind: "bulevar" },
];

type Side = { z0: number; z1: number; faces: "norte" | "sur"; count: number; type: (inner: boolean) => LotType };

type Row = { etapa: 1 | 2; blocks: { name: string; x0: number; x1: number; inner: boolean }[]; sides: Side[] };

const OUTER_W = { west: [-142, -79], east: [79, 142] } as const;

const ROWS: Row[] = [
  {
    etapa: 2,
    blocks: [
      { name: "A", x0: OUTER_W.west[0], x1: OUTER_W.west[1], inner: false },
      { name: "B", x0: -71, x1: -4, inner: true },
      { name: "C", x0: 4, x1: 71, inner: true },
      { name: "D", x0: OUTER_W.east[0], x1: OUTER_W.east[1], inner: false },
    ],
    sides: [
      { z0: -102, z1: -77, faces: "norte", count: 4, type: () => "mirador" },
      { z0: -77, z1: -52, faces: "sur", count: 5, type: (inner) => (inner ? "parque" : "amplio") },
    ],
  },
  {
    etapa: 2,
    blocks: [
      { name: "E", x0: OUTER_W.west[0], x1: OUTER_W.west[1], inner: false },
      { name: "F", x0: OUTER_W.east[0], x1: OUTER_W.east[1], inner: false },
    ],
    sides: [
      { z0: -44, z1: -19, faces: "norte", count: 6, type: () => "estandar" },
      { z0: -19, z1: 6, faces: "sur", count: 6, type: () => "estandar" },
    ],
  },
  {
    etapa: 1,
    blocks: [
      { name: "G", x0: OUTER_W.west[0], x1: OUTER_W.west[1], inner: false },
      { name: "H", x0: -71, x1: -7, inner: true },
      { name: "I", x0: 7, x1: 71, inner: true },
      { name: "J", x0: OUTER_W.east[0], x1: OUTER_W.east[1], inner: false },
    ],
    sides: [
      { z0: 14, z1: 39, faces: "norte", count: 5, type: (inner) => (inner ? "parque" : "amplio") },
      { z0: 39, z1: 64, faces: "sur", count: 6, type: () => "estandar" },
    ],
  },
  {
    etapa: 1,
    blocks: [
      { name: "K", x0: OUTER_W.west[0], x1: OUTER_W.west[1], inner: false },
      { name: "L", x0: -71, x1: -7, inner: true },
      { name: "M", x0: 7, x1: 71, inner: true },
      { name: "N", x0: OUTER_W.east[0], x1: OUTER_W.east[1], inner: false },
    ],
    sides: [{ z0: 72, z1: 102, faces: "norte", count: 7, type: () => "estandar" }],
  },
];

export const PRICE_M2: Record<LotType, number> = { estandar: 30, amplio: 31, parque: 34, mirador: 37 };
export const CORNER_M2 = 2;
export const ETAPA2_M2 = -2;

function rng(seed: number) {
  return () => ((seed = (seed * 48271) % 2147483647) - 1) / 2147483646;
}

function build(): Lot[] {
  const random = rng(5790);
  const out: Lot[] = [];
  for (const row of ROWS) {
    for (const block of row.blocks) {
      let number = 0;
      for (const side of row.sides) {
        const width = (block.x1 - block.x0) / side.count;
        for (let i = 0; i < side.count; i++) {
          number += 1;
          const x0 = block.x0 + i * width;
          const rect: Rect = [x0, side.z0, x0 + width, side.z1];
          const fondo = side.z1 - side.z0;
          const area = Math.round(width * fondo);
          const type = side.type(block.inner);
          const corner = i === 0 || i === side.count - 1;
          const perM2 = PRICE_M2[type] + (corner ? CORNER_M2 : 0) + (row.etapa === 2 && type !== "mirador" ? ETAPA2_M2 : 0);
          const roll = random();
          const sold = type === "mirador" ? 0.55 : row.etapa === 1 ? 0.42 : 0.18;
          const held = row.etapa === 1 ? 0.14 : 0.1;
          const status: Status = roll < sold ? "vendido" : roll < sold + held ? "reservado" : "disponible";
          out.push({
            id: `${block.name}-${String(number).padStart(2, "0")}`,
            block: block.name,
            number,
            etapa: row.etapa,
            rect,
            frente: Math.round(width * 100) / 100,
            fondo,
            area,
            type,
            corner,
            faces: side.faces,
            status,
            perM2,
            price: Math.round((area * perM2) / 10) * 10,
          });
        }
      }
    }
  }
  const fix = (id: string, status: Status) => {
    const lot = out.find((l) => l.id === id);
    if (lot) lot.status = status;
  };
  fix("I-03", "disponible");
  fix("B-02", "disponible");
  fix("C-03", "disponible");
  return out;
}

export const LOTS = build();
export const LOT_BY_ID = new Map(LOTS.map((l) => [l.id, l]));

export const TYPES: Record<LotType, { name: string; short: string; text: string }> = {
  estandar: { name: "Lote estándar", short: "Estándar", text: "La medida justa para una casa de dos pisos con patio y garaje." },
  amplio: { name: "Lote amplio", short: "Amplio", text: "Más frente para una casa ancha, un huerto o un taller." },
  parque: { name: "Frente al parque", short: "Frente al parque", text: "Al cruzar la calle, el parque central, la cancha y la casa comunal." },
  mirador: { name: "Lote mirador", short: "Mirador", text: "La fila más alta, sin nada entre tu terraza y el nevado." },
};

export const STATUS_LABEL: Record<Status, string> = { disponible: "Disponible", reservado: "Reservado", vendido: "Vendido" };

export type Filter = { etapa: 0 | 1 | 2; type: LotType | "todos"; onlyAvailable: boolean; corner: boolean };

export const DEFAULT_FILTER: Filter = { etapa: 0, type: "todos", onlyAvailable: false, corner: false };

export const matches = (lot: Lot, f: Filter) =>
  (f.etapa === 0 || lot.etapa === f.etapa) && (f.type === "todos" || lot.type === f.type) && (!f.onlyAvailable || lot.status === "disponible") && (!f.corner || lot.corner);

export const available = (list: Lot[] = LOTS) => list.filter((l) => l.status === "disponible");

export const cheapest = (type?: LotType) => available(type ? LOTS.filter((l) => l.type === type) : LOTS).sort((a, b) => a.price - b.price)[0];

export const fromPrice = (type?: LotType) => cheapest(type)?.price ?? 0;

export const areaRange = (type: LotType) => {
  const list = LOTS.filter((l) => l.type === type).map((l) => l.area);
  return [Math.min(...list), Math.max(...list)] as const;
};

export const lotCenter = (lot: Lot): [number, number] => [(lot.rect[0] + lot.rect[2]) / 2, (lot.rect[1] + lot.rect[3]) / 2];

export const lotTitle = (lot: Lot) => `Lote ${lot.id}`;
