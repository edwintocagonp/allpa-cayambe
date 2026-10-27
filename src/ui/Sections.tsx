import { useMemo, useState, type ReactNode } from "react";

import { BRAND, FAQ, INCLUDES, MILESTONES, OVERALL_PROGRESS, PLACES } from "../content";
import { money } from "../finance";
import { LOTS, TYPES, areaRange, available, cheapest, type LotType } from "../lots";
import { useToday } from "../today";
import { infoMessage, visitMessage, waLink } from "../whatsapp";
import { Icon, Logo, type IconKey } from "./icons";
import { LotShape } from "./PlanSvg";

const NAV = [
  ["lotes", "Lotes"],
  ["financiamiento", "Financiamiento"],
  ["incluye", "Qué incluye"],
  ["ubicacion", "Ubicación"],
  ["avance", "Avance"],
] as const;

export function TopBar({ solid }: { solid: boolean }) {
  return (
    <header className={`topbar${solid ? " is-solid" : ""}`}>
      <a href="#inicio" className="topbar__logo" aria-label="Allpa, inicio">
        <Logo />
      </a>
      <nav className="topbar__nav" aria-label="Secciones">
        {NAV.map(([id, label]) => (
          <a key={id} href={`#${id}`}>
            {label}
          </a>
        ))}
      </nav>
      <a className="btn btn--terra btn--small" href="#visita">
        Agenda tu visita
      </a>
    </header>
  );
}

export function SectionHead({ index, label, title, text, dark }: { index: string; label: string; title: ReactNode; text?: string; dark?: boolean }) {
  return (
    <header className={`section-head${dark ? " section-head--dark" : ""}`}>
      <p className="section-head__label">
        <span>{index}</span> {label}
      </p>
      <h2>{title}</h2>
      {text && <p className="section-head__text">{text}</p>}
    </header>
  );
}

const ORDER: LotType[] = ["estandar", "amplio", "parque", "mirador"];

export function Typologies({ onExplore }: { onExplore: (type: LotType) => void }) {
  return (
    <section id="lotes" className="section">
      <SectionHead
        index="01"
        label="Lotes"
        title={
          <>
            Cuatro tipos de lote, <em>una misma vista</em>
          </>
        }
        text="Todos tienen agua, alcantarillado, luz soterrada y escritura individual. Cambian el tamaño, la ubicación y lo que tienes enfrente."
      />
      <div className="types">
        {ORDER.map((type) => {
          const sample = cheapest(type) ?? LOTS.find((l) => l.type === type)!;
          const [min, max] = areaRange(type);
          const left = available(LOTS.filter((l) => l.type === type)).length;
          return (
            <article key={type} className={`type type--${type}`}>
              <LotShape lot={sample} className="type__shape" />
              <h3>{TYPES[type].name}</h3>
              <p className="type__text">{TYPES[type].text}</p>
              <dl>
                <div>
                  <dt>Área</dt>
                  <dd>{min === max ? `${min} m²` : `${min}–${max} m²`}</dd>
                </div>
                <div>
                  <dt>Desde</dt>
                  <dd>{money(sample.price)}</dd>
                </div>
                <div>
                  <dt>Disponibles</dt>
                  <dd>{left}</dd>
                </div>
              </dl>
              <button className="btn btn--line btn--wide" onClick={() => onExplore(type)}>
                Ver en el plano <Icon name="arrow" size={18} />
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function Includes() {
  return (
    <section id="incluye" className="section section--clay">
      <SectionHead
        index="03"
        label="Qué incluye"
        title={
          <>
            Llegas y <em>construyes</em>
          </>
        }
        text="Te entregamos el lote con las obras terminadas y las áreas comunales listas. Tú solo pones la casa."
      />
      <ul className="includes">
        {INCLUDES.map((item) => (
          <li key={item.title}>
            <span className="includes__icon">
              <Icon name={item.icon as IconKey} size={22} />
            </span>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function MapSvg() {
  return (
    <svg className="map" viewBox="0 0 640 460" role="img" aria-label="Mapa de la ubicación de Allpa en Cayambe">
      <rect width="640" height="460" rx="22" className="map__bg" />
      <path d="M0 300 C140 290 220 318 330 306 S520 284 640 296" className="map__equator" />
      <text x="20" y="290" className="map__equator-label">
        Línea ecuatorial 0°
      </text>
      <path d="M120 470 C150 380 196 330 232 262 S300 120 286 -10" className="map__road map__road--main" />
      <text x="64" y="420" className="map__road-label">
        Panamericana E35
      </text>
      <path d="M270 200 C330 186 382 160 452 118 S560 60 640 40" className="map__road" />
      <text x="470" y="80" className="map__road-label">
        vía a Olmedo
      </text>
      <g className="map__town">
        {[
          [236, 196],
          [254, 210],
          [272, 196],
          [246, 228],
          [266, 228],
          [284, 214],
          [228, 214],
          [258, 244],
          [292, 232],
          [240, 176],
          [262, 176],
        ].map(([x, y], i) => (
          <rect key={i} x={x} y={y} width="15" height="12" rx="2" />
        ))}
      </g>
      <text x="196" y="270" className="map__place">
        Cayambe
      </text>
      <g className="map__volcano" transform="translate(500 210)">
        <path d="M-90 70 L-28 -30 L-8 -10 L10 -48 L96 70z" />
        <path d="M-28 -30 L-16 -12 L-6 -20 L4 -8 L10 -48 L22 -22 L8 -26 L-2 -14 L-12 -22z" className="map__snow" />
        <text x="-50" y="92" className="map__place">
          Nevado Cayambe 5.790 m
        </text>
      </g>
      <g transform="translate(372 150)" className="map__pin">
        <circle r="30" className="map__pulse" />
        <path d="M0 18s-16-14-16-26a16 16 0 0 1 32 0C16 4 0 18 0 18z" />
        <circle cy="-8" r="6" className="map__pin-dot" />
        <text x="24" y="-14" className="map__place map__place--strong">
          Allpa
        </text>
      </g>
      <circle cx="300" cy="306" r="7" className="map__dot" />
      <text x="312" y="330" className="map__place">
        Quitsato
      </text>
      <circle cx="96" cy="350" r="6" className="map__dot" />
      <text x="40" y="378" className="map__place">
        Tabacundo
      </text>
      <text x="150" y="448" className="map__dir">
        ↓ Quito, 1 h 10 min
      </text>
      <text x="300" y="24" className="map__dir">
        ↑ Otavalo, 35 min
      </text>
    </svg>
  );
}

export function Location() {
  return (
    <section id="ubicacion" className="section">
      <SectionHead
        index="04"
        label="Ubicación"
        title={
          <>
            Cerca de todo, <em>lejos del ruido</em>
          </>
        }
        text={`${BRAND.sector}. Campo, aire limpio y el nevado de frente, a pocos minutos del centro y de la Panamericana.`}
      />
      <div className="location">
        <MapSvg />
        <ul className="places">
          {PLACES.map((p) => (
            <li key={p.name}>
              <strong>{p.time}</strong>
              <div>
                <h3>{p.name}</h3>
                <p>{p.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Progress() {
  return (
    <section id="avance" className="section section--indigo">
      <SectionHead
        dark
        index="05"
        label="Avance de obras"
        title={
          <>
            La etapa 1 ya <em>tiene calles</em>
          </>
        }
        text="Publicamos el avance cada mes. Puedes venir a verlo cualquier fin de semana."
      />
      <div className="progress" role="progressbar" aria-label="Avance general de la urbanización" aria-valuenow={OVERALL_PROGRESS} aria-valuemin={0} aria-valuemax={100}>
        <span style={{ width: `${OVERALL_PROGRESS}%` }} />
        <strong>{OVERALL_PROGRESS} % de avance general</strong>
      </div>
      <ol className="timeline">
        {MILESTONES.map((m) => (
          <li key={m.title} className={`timeline__item is-${m.state}`}>
            <span className="timeline__mark" aria-hidden="true">
              {m.state === "done" ? <Icon name="check" size={14} /> : null}
            </span>
            <p className="timeline__when">
              {m.when}
              {m.etapa ? ` · etapa ${m.etapa}` : ""}
            </p>
            <h3>{m.title}</h3>
            {m.state === "now" && m.progress !== undefined && (
              <p className="timeline__now">
                <span style={{ width: `${m.progress}%` }} /> En obra, {m.progress} %
              </p>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

export function Faq() {
  return (
    <section id="preguntas" className="section">
      <SectionHead
        index="06"
        label="Preguntas frecuentes"
        title={
          <>
            Lo que más <em>nos preguntan</em>
          </>
        }
      />
      <div className="faq">
        {FAQ.map((item, i) => (
          <details key={item.q} open={i === 0}>
            <summary>
              {item.q}
              <Icon name="arrow" size={18} />
            </summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

const SLOTS = ["mañana", "tarde"];
const INTERESTS = ["Un lote estándar", "Un lote amplio", "Un lote frente al parque", "Un lote mirador", "Todavía no sé"];

function weekendDays(today: Date) {
  const out: string[] = [];
  const d = new Date(today);
  d.setDate(d.getDate() + 1);
  while (out.length < 4) {
    if (d.getDay() === 6 || d.getDay() === 0) {
      const label = d.toLocaleDateString("es-EC", { weekday: "long", day: "numeric", month: "long" });
      out.push(label.charAt(0).toUpperCase() + label.slice(1));
    }
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export function Visit() {
  const today = useToday();
  const days = useMemo(() => (today ? weekendDays(today) : []), [today]);
  const [picked, setPicked] = useState("");
  const [slot, setSlot] = useState(SLOTS[0]);
  const [name, setName] = useState("");
  const [interest, setInterest] = useState(INTERESTS[0]);
  const day = picked || days[0] || "";
  return (
    <section id="visita" className="section section--paper">
      <SectionHead
        index="07"
        label="Contacto"
        title={
          <>
            Ven a pisar <em>tu terreno</em>
          </>
        }
        text="Te esperamos en la oficina de ventas, dentro de la urbanización. Te mostramos los lotes disponibles y caminamos el terreno contigo."
      />
      <div className="visit">
        <form
          className="visit__form"
          onSubmit={(e) => {
            e.preventDefault();
            window.open(waLink(visitMessage(name.trim(), day.charAt(0).toLowerCase() + day.slice(1), slot, interest.toLowerCase())), "_blank", "noopener");
          }}
        >
          <label className="field">
            <span>Tu nombre</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre y apellido" autoComplete="name" required />
          </label>
          <fieldset className="field">
            <legend>Día de la visita</legend>
            <div className="days">
              {days.map((d) => (
                <button key={d} type="button" className={`chip${d === day ? " is-on" : ""}`} aria-pressed={d === day} onClick={() => setPicked(d)}>
                  {d}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="field">
            <legend>Horario</legend>
            <div className="segmented" role="radiogroup" aria-label="Horario">
              {SLOTS.map((s) => (
                <button key={s} type="button" role="radio" aria-checked={slot === s} className={slot === s ? "is-on" : ""} onClick={() => setSlot(s)}>
                  En la {s}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="field">
            <span>Me interesa</span>
            <select value={interest} onChange={(e) => setInterest(e.target.value)}>
              {INTERESTS.map((i) => (
                <option key={i}>{i}</option>
              ))}
            </select>
          </label>
          <button type="submit" className="btn btn--terra btn--wide">
            <Icon name="whatsapp" size={18} /> Agendar mi visita por WhatsApp
          </button>
        </form>
        <aside className="contact">
          <h3>Oficina de ventas</h3>
          <ul>
            <li>
              <Icon name="pin" size={20} />
              <span>{BRAND.sector}</span>
            </li>
            <li>
              <Icon name="clock" size={20} />
              <span>{BRAND.hours}</span>
            </li>
            <li>
              <Icon name="whatsapp" size={20} />
              <span>WhatsApp {BRAND.phone}</span>
            </li>
          </ul>
          <a className="btn btn--line btn--wide" href={waLink(infoMessage())} target="_blank" rel="noopener">
            Escríbenos por WhatsApp <Icon name="arrow" size={18} />
          </a>
        </aside>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <Logo className="footer__logo" />
      <p>
        {BRAND.tagline}. {BRAND.sector}.
      </p>
      <p className="footer__note">Proyecto demostrativo: la urbanización, los lotes, los precios y el avance de obra son ficticios, y el número de WhatsApp es de prueba.</p>
    </footer>
  );
}
