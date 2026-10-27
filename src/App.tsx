import { Suspense, lazy, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import { AnimatePresence } from "motion/react";

import { forceStart, useEngaged } from "./engage";
import { DEFAULT_FILTER, LOT_BY_ID, cheapest, type Filter, type Lot, type LotType } from "./lots";
import { stage, type Insets, type SceneView } from "./scene/state";
import { Faq, Footer, Includes, Location, Progress, SectionHead, TopBar, Typologies, Visit } from "./ui/Sections";
import { Simulator } from "./ui/Simulator";
import { DragHint, Explorer, FutureToggle, Hero, Loading, LotCard, Poster, ViewOverlay } from "./ui/StageUI";

const Stage = lazy(() => import("./scene/Stage"));

const MOBILE = "(max-width: 959px)";
const ZERO: Insets = { left: 0, right: 0, top: 0, bottom: 0 };

function useInsets(stage: RefObject<HTMLElement | null>, deps: unknown[]) {
  const [insets, setInsets] = useState<Insets>(ZERO);
  useLayoutEffect(() => {
    const el = stage.current;
    if (!el) return;
    const measure = () => {
      const box = el.getBoundingClientRect();
      const mobile = window.matchMedia(MOBILE).matches;
      const next = { left: 0, right: 0, top: mobile ? 64 : 80, bottom: 0 };
      el.querySelectorAll<HTMLElement>("[data-inset], [data-inset-mobile]").forEach((node) => {
        const r = node.getBoundingClientRect();
        if (!r.width || !r.height) return;
        const side = (mobile && node.dataset.insetMobile) || node.dataset.inset;
        if (side === "left") next.left = Math.max(next.left, r.right - box.left + 8);
        if (side === "right") next.right = Math.max(next.right, box.right - r.left + 8);
        if (side === "top") next.top = Math.max(next.top, r.bottom - box.top + 8);
        if (side === "bottom") next.bottom = Math.max(next.bottom, box.bottom - r.top + 8);
      });
      setInsets((prev) => (Object.keys(next).every((k) => Math.abs(prev[k as keyof Insets] - next[k as keyof Insets]) < 2) ? prev : next));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    el.querySelectorAll("[data-inset], [data-inset-mobile]").forEach((n) => ro.observe(n));
    const late = window.setTimeout(measure, 700);
    return () => {
      ro.disconnect();
      window.clearTimeout(late);
    };
  }, deps);
  return insets;
}

export default function App() {
  const [mode, setMode] = useState<"intro" | "explore">("intro");
  const [lotId, setLotId] = useState<string | null>(null);
  const [vista, setVista] = useState(false);
  const [filter, setFilter] = useState<Filter>(DEFAULT_FILTER);
  const [future, setFuture] = useState(false);
  const [simId, setSimId] = useState(() => cheapest("estandar")?.id ?? "K-01");
  const [ready, setReady] = useState(false);
  const [solid, setSolid] = useState(false);
  const engaged = useEngaged();
  const stageRef = useRef<HTMLElement>(null);

  const view: SceneView = useMemo(() => ({ mode, lot: lotId, vista, filter, future }), [mode, lotId, vista, filter, future]);
  const insets = useInsets(stageRef, [mode, lotId, vista]);
  const lot = lotId ? LOT_BY_ID.get(lotId) : undefined;

  const toTop = () => stageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const selectLot = useCallback((id: string) => {
    setMode("explore");
    setLotId(id);
    setVista(false);
  }, []);

  const back = useCallback(() => {
    if (vista) setVista(false);
    else if (lotId) setLotId(null);
    else setMode("intro");
  }, [vista, lotId]);

  const explore = (type?: LotType) => {
    setFilter({ ...DEFAULT_FILTER, type: type ?? "todos" });
    setMode("explore");
    setLotId(null);
    setVista(false);
    toTop();
  };

  const similar = (l: Lot) => {
    setFilter({ ...DEFAULT_FILTER, type: l.type, onlyAvailable: true });
    setLotId(null);
  };

  const simulate = (id?: string) => {
    if (id) setSimId(id);
    document.getElementById("financiamiento")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mode === "explore") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [back, mode]);

  useEffect(() => {
    if (mode === "explore" || future) forceStart();
  }, [mode, future]);

  useEffect(() => {
    if (import.meta.env.DEV && new URLSearchParams(location.search).has("poster")) {
      stage.touched = 1e9;
      forceStart();
    }
  }, []);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > (stageRef.current?.offsetHeight ?? 600) - 90);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <TopBar solid={solid} />
      <section id="inicio" ref={stageRef} className={`stage stage--${mode}${vista ? " stage--vista" : ""}`}>
        <Poster hidden={ready} />
        {engaged && (
          <Suspense fallback={null}>
            <Stage view={view} insets={insets} onLot={selectLot} onReady={() => setReady(true)} />
          </Suspense>
        )}
        <div className="stage__scrim" aria-hidden="true" />
        {mode === "intro" && <Hero onExplore={() => explore()} onSimulate={() => simulate()} />}
        {mode === "explore" && !vista && <Explorer view={view} onLot={selectLot} onBack={back} onFilter={setFilter} />}
        <AnimatePresence>{lot && !vista && <LotCard key={lot.id} lot={lot} onClose={() => setLotId(null)} onVista={() => setVista(true)} onSimulate={simulate} onSimilar={similar} />}</AnimatePresence>
        <AnimatePresence>{lot && vista && <ViewOverlay lot={lot} onBack={() => setVista(false)} />}</AnimatePresence>
        <div className="stage__tools">
          {!vista && <DragHint />}
          {!vista && <FutureToggle future={future} onChange={setFuture} />}
        </div>
        <Loading show={engaged && !ready} />
      </section>
      <main>
        <Typologies onExplore={explore} />
        <section id="financiamiento" className="section section--indigo">
          <SectionHead
            dark
            index="02"
            label="Financiamiento"
            title={
              <>
                Paga tu lote <em>a tu ritmo</em>
              </>
            }
            text="Financiamiento directo con nosotros, sin banco ni garante: entrada desde el 20 % y el saldo en cuotas fijas. Hasta 24 meses, sin intereses."
          />
          <Simulator lotId={simId} onLot={setSimId} />
        </section>
        <Includes />
        <Location />
        <Progress />
        <Faq />
        <Visit />
      </main>
      <Footer />
    </>
  );
}
