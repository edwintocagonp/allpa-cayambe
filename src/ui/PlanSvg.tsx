import { LOTS, PARK, SITE, STREETS, matches, type Filter, type Lot } from "../lots";
import { STATUS_COLOR } from "../scene/state";

const fmt = (n: number) => n.toFixed(n % 1 ? 1 : 0).replace(".", ",");

export function LotShape({ lot, className }: { lot: Lot; className?: string }) {
  const W = 220;
  const H = 180;
  const pad = 34;
  const s = Math.min((W - pad * 2) / lot.frente, (H - pad * 2 - 18) / lot.fondo);
  const w = lot.frente * s;
  const h = lot.fondo * s;
  const x = (W - w) / 2;
  const front = lot.faces === "norte";
  const y = front ? pad + 18 : pad + 6;
  const street = front ? y - 18 : y + h + 2;
  const dimY = front ? y + h + 12 : y - 12;
  return (
    <svg className={className} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Lote de ${fmt(lot.frente)} por ${lot.fondo} metros`}>
      <rect x={x - 14} y={street} width={w + 28} height={16} rx={3} className="shape__street" />
      <text x={W / 2} y={street + 11.5} className="shape__street-label">
        calle
      </text>
      <rect x={x} y={y} width={w} height={h} rx={2} className="shape__lot" />
      <rect x={x + w * 0.16} y={front ? y + 3.2 * s : y + h - 3.2 * s - Math.min(lot.fondo - 9, 12) * s} width={w * 0.68} height={Math.min(lot.fondo - 9, 12) * s} rx={1.5} className="shape__house" />
      <line x1={x} y1={dimY} x2={x + w} y2={dimY} className="shape__dim" />
      <text x={W / 2} y={front ? dimY + 14 : dimY - 6} className="shape__dim-label">
        {fmt(lot.frente)} m
      </text>
      <line x1={x + w + 12} y1={y} x2={x + w + 12} y2={y + h} className="shape__dim" />
      <text x={x + w + 18} y={y + h / 2 + 4} className="shape__dim-label shape__dim-label--side">
        {lot.fondo} m
      </text>
      <g transform={`translate(${x - 22} ${y + 10})`} className="shape__north">
        <path d="M0 10l4-10 4 10-4-2.5z" />
        <text x={4} y={21}>
          N
        </text>
      </g>
    </svg>
  );
}

const PX = (x: number) => x - SITE[0];
const PZ = (z: number) => z - SITE[1];

export function MasterPlan({ selected, filter, onPick, className }: { selected: string | null; filter: Filter; onPick: (id: string) => void; className?: string }) {
  const W = SITE[2] - SITE[0];
  const H = SITE[3] - SITE[1];
  return (
    <svg className={className} viewBox={`-6 -6 ${W + 12} ${H + 26}`} role="img" aria-label="Plano de la urbanización">
      <rect x={-6} y={-6} width={W + 12} height={H + 12} rx={8} className="plan__bg" />
      {STREETS.map((s, i) => (
        <rect key={i} x={PX(s.rect[0])} y={PZ(s.rect[1])} width={s.rect[2] - s.rect[0]} height={s.rect[3] - s.rect[1]} className="plan__street" />
      ))}
      <rect x={PX(PARK[0])} y={PZ(PARK[1])} width={PARK[2] - PARK[0]} height={PARK[3] - PARK[1]} rx={3} className="plan__park" />
      <text x={PX(0)} y={PZ(-17)} className="plan__label">
        parque
      </text>
      {LOTS.map((lot) => {
        const [x0, z0, x1, z1] = lot.rect;
        const on = matches(lot, filter);
        return (
          <rect
            key={lot.id}
            x={PX(x0) + 0.6}
            y={PZ(z0) + 0.6}
            width={x1 - x0 - 1.2}
            height={z1 - z0 - 1.2}
            rx={1}
            fill={STATUS_COLOR[lot.status]}
            className={`plan__lot${on ? "" : " is-off"}${selected === lot.id ? " is-picked" : ""}`}
            onClick={() => onPick(lot.id)}
          >
            <title>{`${lot.id} · ${lot.area} m²`}</title>
          </rect>
        );
      })}
      <path d={`M${PX(-7)} ${H} h14`} className="plan__gate" />
      <text x={PX(0)} y={H + 15} className="plan__label">
        acceso
      </text>
    </svg>
  );
}
