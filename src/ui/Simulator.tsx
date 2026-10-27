import { useMemo, useState } from "react";

import { CASH_DISCOUNT, FREE_MONTHS, MIN_DOWN, RATE, RESERVE, TERMS, addMonths, decimal, money, monthLabel, simulate } from "../finance";
import { LOTS, LOT_BY_ID, TYPES, type LotType } from "../lots";
import { useToday } from "../today";
import { planMessage, waLink } from "../whatsapp";
import { Icon } from "./icons";

const GROUPS: LotType[] = ["estandar", "amplio", "parque", "mirador"];

export function Simulator({ lotId, onLot }: { lotId: string; onLot: (id: string) => void }) {
  const lot = LOT_BY_ID.get(lotId) ?? LOTS[0];
  const [downPct, setDownPct] = useState(30);
  const [months, setMonths] = useState<number>(24);
  const [cash, setCash] = useState(false);
  const today = useToday();
  const sim = useMemo(() => simulate(lot.price, downPct / 100, months, cash), [lot.price, downPct, months, cash]);
  const options = useMemo(() => GROUPS.map((type) => ({ type, lots: LOTS.filter((l) => l.type === type && (l.status === "disponible" || l.id === lotId)).sort((a, b) => a.price - b.price) })), [lotId]);

  return (
    <div className="sim">
      <div className="sim__controls">
        <label className="field">
          <span>Lote</span>
          <select value={lot.id} onChange={(e) => onLot(e.target.value)}>
            {options.map((group) => (
              <optgroup key={group.type} label={TYPES[group.type].name}>
                {group.lots.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.id} · {l.area} m²{l.corner ? " · esquinero" : ""} · {money(l.price)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        <label className="check">
          <input type="checkbox" checked={cash} onChange={(e) => setCash(e.target.checked)} />
          <span className="check__box" aria-hidden="true">
            <Icon name="check" size={14} />
          </span>
          Pago de contado <small>{decimal(CASH_DISCOUNT * 100)} % de descuento</small>
        </label>

        <fieldset className="field" disabled={cash}>
          <legend>
            Entrada <output>{downPct} %</output>
          </legend>
          <input type="range" min={MIN_DOWN} max={60} step={5} value={downPct} onChange={(e) => setDownPct(Number(e.target.value))} aria-label="Porcentaje de entrada" />
          <div className="field__scale">
            <span>{MIN_DOWN} %</span>
            <span>60 %</span>
          </div>
        </fieldset>

        <fieldset className="field" disabled={cash}>
          <legend>Plazo para el saldo</legend>
          <div className="segmented" role="radiogroup" aria-label="Plazo en meses">
            {TERMS.map((m) => (
              <button key={m} type="button" role="radio" aria-checked={months === m} className={months === m ? "is-on" : ""} onClick={() => setMonths(m)}>
                {m} <small>meses</small>
              </button>
            ))}
          </div>
          <p className="field__note">
            Hasta {FREE_MONTHS} meses sin intereses. De 36 a 60 meses, {RATE} % anual.
          </p>
        </fieldset>
      </div>

      <div className="sim__result" aria-live="polite">
        <p className="sim__lot">
          Lote {lot.id} · {lot.area} m² · {money(lot.price)}
        </p>
        {cash ? (
          <div className="sim__big">
            <span>Pagas una sola vez</span>
            <strong>{money(sim.total)}</strong>
            <small>Ahorras {money(sim.discount)} y firmas la escritura de inmediato.</small>
          </div>
        ) : (
          <div className="sim__big">
            <span>Tu cuota mensual</span>
            <strong>{money(sim.monthly)}</strong>
            <small>
              {sim.months} cuotas fijas {sim.rate ? `al ${sim.rate} % anual` : "sin intereses"}
              {today ? `, la última en ${monthLabel(addMonths(today, sim.months + 1))}` : ""}
            </small>
          </div>
        )}
        <ol className="sim__steps">
          <li>
            <span>Hoy</span>
            <strong>{money(RESERVE)}</strong>
            <em>Separas el lote por 15 días</em>
          </li>
          <li>
            <span>{cash ? "Al firmar" : "En 15 días"}</span>
            <strong>{money((cash ? sim.total : sim.down) - RESERVE)}</strong>
            <em>{cash ? "El resto del pago de contado" : `Completas la entrada de ${money(sim.down)}`}</em>
          </li>
          {!cash && (
            <li>
              <span>Cada mes</span>
              <strong>{money(sim.monthly)}</strong>
              <em>
                Saldo de {money(sim.financed)}
                {sim.interest > 0 ? `, ${money(sim.interest)} de interés en total` : ""}
              </em>
            </li>
          )}
        </ol>
        <a className="btn btn--terra btn--wide" href={waLink(planMessage(lot, sim))} target="_blank" rel="noopener">
          <Icon name="whatsapp" size={18} /> Enviar este plan por WhatsApp
        </a>
        <p className="fine">Financiamiento directo con la urbanizadora, sin banco ni garante. Valores referenciales sujetos a la firma de la promesa de compraventa.</p>
      </div>
    </div>
  );
}
