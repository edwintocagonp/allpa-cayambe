import { motion } from "motion/react";

import { BRAND } from "../content";
import { DELIVERY, RESERVE, TERMS, money, monthLabel } from "../finance";
import { LOTS, STATUS_LABEL, TYPES, available, fromPrice, matches, type Filter, type Lot, type LotType } from "../lots";
import type { SceneView } from "../scene/state";
import { reserveMessage, waLink } from "../whatsapp";
import { Icon } from "./icons";
import { LotShape, MasterPlan } from "./PlanSvg";

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero({ onExplore, onSimulate }: { onExplore: () => void; onSimulate: () => void }) {
  return (
    <div className="hero">
      <div className="hero__top" data-inset="left" data-inset-mobile="bottom">
        <p className="hero__kicker">
          <Icon name="mountain" size={16} /> Lotes urbanizados · {BRAND.sector}
        </p>
        <h1>
          Tu tierra <span>frente al Cayambe</span>
        </h1>
        <p className="hero__lead">
          {LOTS.length} lotes desde 263 m² con escritura, servicios bajo tierra y el nevado de frente. A 7 minutos del centro de Cayambe y a una hora de Quito.
        </p>
      </div>
      <div className="hero__bottom" data-inset="left" data-inset-mobile="bottom">
        <div className="hero__actions">
          <button className="btn btn--terra" onClick={onExplore}>
            Elige tu lote <Icon name="arrow" size={18} />
          </button>
          <button className="btn btn--ghost" onClick={onSimulate}>
            <Icon name="calc" size={18} /> Calcula tu cuota
          </button>
        </div>
        <dl className="hero__stats">
          <div>
            <dt>Desde</dt>
            <dd>{money(fromPrice())}</dd>
          </div>
          <div>
            <dt>Separa con</dt>
            <dd>{money(RESERVE)}</dd>
          </div>
          <div>
            <dt>Hasta</dt>
            <dd>
              {TERMS[TERMS.length - 1]} <small>meses</small>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

const TYPE_FILTERS: { id: LotType | "todos"; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "estandar", label: "Estándar" },
  { id: "amplio", label: "Amplio" },
  { id: "parque", label: "Frente al parque" },
  { id: "mirador", label: "Mirador" },
];

type ExplorerProps = {
  view: SceneView;
  onLot: (id: string) => void;
  onBack: () => void;
  onFilter: (filter: Filter) => void;
};

export function Explorer({ view, onLot, onBack, onFilter }: ExplorerProps) {
  const f = view.filter;
  const list = LOTS.filter((l) => matches(l, f)).sort((a, b) => (a.status === "disponible" ? 0 : 1) - (b.status === "disponible" ? 0 : 1) || a.price - b.price);
  const set = (patch: Partial<Filter>) => onFilter({ ...f, ...patch });
  return (
    <motion.aside
      className={`explorer${view.lot ? " has-lot" : ""}`}
      data-inset="left"
      data-inset-mobile="bottom"
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease }}
    >
      <div className="explorer__head">
        <button className="icon-btn" onClick={onBack} aria-label="Volver">
          <Icon name="back" size={18} />
        </button>
        <div>
          <h2>Elige tu lote</h2>
          <p>
            {available().length} disponibles de {LOTS.length}
          </p>
        </div>
      </div>
      <div className="explorer__filters">
        <div className="segmented" role="radiogroup" aria-label="Etapa">
          {([0, 1, 2] as const).map((e) => (
            <button key={e} role="radio" aria-checked={f.etapa === e} className={f.etapa === e ? "is-on" : ""} onClick={() => set({ etapa: e })}>
              {e === 0 ? "Todas" : `Etapa ${e}`}
            </button>
          ))}
        </div>
        <div className="chips" role="radiogroup" aria-label="Tipo de lote">
          {TYPE_FILTERS.map((t) => (
            <button key={t.id} role="radio" aria-checked={f.type === t.id} className={`chip${f.type === t.id ? " is-on" : ""}`} onClick={() => set({ type: t.id })}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="toggles">
          <label className="switch">
            <input type="checkbox" checked={f.onlyAvailable} onChange={(e) => set({ onlyAvailable: e.target.checked })} />
            <span aria-hidden="true" />
            Solo disponibles
          </label>
          <label className="switch">
            <input type="checkbox" checked={f.corner} onChange={(e) => set({ corner: e.target.checked })} />
            <span aria-hidden="true" />
            Esquineros
          </label>
        </div>
      </div>
      <MasterPlan className="explorer__plan" selected={view.lot} filter={f} onPick={onLot} />
      <ul className="legend" aria-label="Estado de los lotes">
        {(["disponible", "reservado", "vendido"] as const).map((s) => (
          <li key={s}>
            <span className={`dot dot--${s}`} /> {STATUS_LABEL[s]}
          </li>
        ))}
      </ul>
      <ul className="lot-list">
        {list.map((lot) => (
          <li key={lot.id}>
            <button className={`lot-row${view.lot === lot.id ? " is-active" : ""}`} onClick={() => onLot(lot.id)}>
              <span className={`dot dot--${lot.status}`} />
              <strong>{lot.id}</strong>
              <span className="lot-row__type">
                {TYPES[lot.type].short}
                {lot.corner ? " · esquinero" : ""} · {lot.area} m²
              </span>
              <span className="lot-row__price">{lot.status === "vendido" ? "Vendido" : money(lot.price)}</span>
            </button>
          </li>
        ))}
        {!list.length && <li className="lot-list__empty">No hay lotes con estos filtros.</li>}
      </ul>
    </motion.aside>
  );
}

type CardProps = { lot: Lot; onClose: () => void; onVista: () => void; onSimulate: (id: string) => void; onSimilar: (lot: Lot) => void };

export function LotCard({ lot, onClose, onVista, onSimulate, onSimilar }: CardProps) {
  const open = lot.status === "disponible";
  return (
    <motion.aside
      className="lot-card"
      data-inset="right"
      data-inset-mobile="bottom"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      transition={{ duration: 0.45, ease }}
      aria-label={`Lote ${lot.id}`}
    >
      <button className="icon-btn lot-card__close" onClick={onClose} aria-label="Cerrar">
        <Icon name="close" size={18} />
      </button>
      <p className="lot-card__eyebrow">
        {TYPES[lot.type].name} · Etapa {lot.etapa}
      </p>
      <h2>
        Lote {lot.id} <span className={`badge badge--${lot.status}`}>{STATUS_LABEL[lot.status]}</span>
      </h2>
      <div className="lot-card__price">
        <strong>{lot.status === "vendido" ? "Vendido" : money(lot.price)}</strong>
        {lot.status !== "vendido" && <span>{money(lot.perM2)} el m²</span>}
      </div>
      <LotShape lot={lot} className="lot-card__shape" />
      <dl className="facts">
        <div>
          <dt>Área</dt>
          <dd>{lot.area} m²</dd>
        </div>
        <div>
          <dt>Frente × fondo</dt>
          <dd>
            {lot.frente.toFixed(1).replace(".", ",")} × {lot.fondo} m
          </dd>
        </div>
        <div>
          <dt>Da a la calle</dt>
          <dd>Al {lot.faces}</dd>
        </div>
        <div>
          <dt>Entrega</dt>
          <dd>{monthLabel(DELIVERY[lot.etapa])}</dd>
        </div>
      </dl>
      <ul className="tags">
        {lot.corner && <li>Esquinero</li>}
        {lot.type === "mirador" && <li>Vista libre al nevado</li>}
        {lot.type === "parque" && <li>Frente al parque</li>}
        {lot.etapa === 2 && lot.type !== "mirador" && <li>Precio de preventa</li>}
      </ul>
      <div className="lot-card__actions">
        <button className="btn btn--line" onClick={onVista}>
          <Icon name="eye" size={18} /> Ver la vista desde aquí
        </button>
        {open ? (
          <>
            <button className="btn btn--line" onClick={() => onSimulate(lot.id)}>
              <Icon name="calc" size={18} /> Calcular mi cuota
            </button>
            <a className="btn btn--terra" href={waLink(reserveMessage(lot))} target="_blank" rel="noopener">
              <Icon name="whatsapp" size={18} /> Separar con {money(RESERVE)}
            </a>
          </>
        ) : (
          <button className="btn btn--terra" onClick={() => onSimilar(lot)}>
            Ver lotes parecidos disponibles <Icon name="arrow" size={18} />
          </button>
        )}
      </div>
    </motion.aside>
  );
}

export function ViewOverlay({ lot, onBack }: { lot: Lot; onBack: () => void }) {
  return (
    <motion.div className="vista" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
      <button className="btn btn--glass vista__back" onClick={onBack}>
        <Icon name="back" size={18} /> Volver al lote
      </button>
      <div className="vista__caption">
        <p>Vista desde el lote {lot.id}, de pie en tu terreno</p>
        <strong>El Cayambe, 5.790 m, a 12 km</strong>
        <span>
          <Icon name="drag" size={16} /> Arrastra para mirar alrededor
        </span>
      </div>
    </motion.div>
  );
}

export function FutureToggle({ future, onChange }: { future: boolean; onChange: (future: boolean) => void }) {
  return (
    <div className="future" role="radiogroup" aria-label="Cómo se ve la urbanización">
      <button role="radio" aria-checked={!future} className={!future ? "is-on" : ""} onClick={() => onChange(false)}>
        <Icon name="sprout" size={16} /> Hoy
      </button>
      <button role="radio" aria-checked={future} className={future ? "is-on" : ""} onClick={() => onChange(true)}>
        <Icon name="houses" size={16} /> Así será
      </button>
    </div>
  );
}

export function DragHint() {
  return (
    <p className="drag-hint">
      <Icon name="drag" size={16} /> Arrastra para girar
    </p>
  );
}

export function Poster({ hidden }: { hidden: boolean }) {
  return <div className={`stage__poster${hidden ? " is-hidden" : ""}`} aria-hidden="true" />;
}

export function Loading({ show }: { show: boolean }) {
  return (
    <div className={`loading${show ? " is-on" : ""}`} role="status" aria-live="polite">
      {show && (
        <>
          <span className="loading__spin" aria-hidden="true" /> Cargando la urbanización en 3D
        </>
      )}
    </div>
  );
}
