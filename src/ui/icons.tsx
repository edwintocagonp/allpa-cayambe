const PATHS = {
  water: "M12 3s6 6.6 6 11a6 6 0 0 1-12 0c0-4.4 6-11 6-11zM9.5 14.5a2.5 2.5 0 0 0 2.5 2.5",
  pipe: "M3 8h7v8H3M10 12h11M17 9v6M21 9v6",
  bolt: "M13 2L5 13h6l-1 9 8-11h-6z",
  road: "M8 3L4 21M16 3l4 18M12 4v3M12 10v3M12 16v3",
  wifi: "M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 19.5h.01",
  shield: "M12 3l8 3v6c0 4.5-3.5 8-8 9-4.5-1-8-4.5-8-9V6zM8.5 12l2.5 2.5 4.5-5",
  home: "M3 11l9-7 9 7M5 9.5V20h14V9.5M10 20v-6h4v6",
  ball: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7.5l3.5 2.5-1.3 4h-4.4l-1.3-4zM12 3v4.5M15.5 10l4.8-1.4M14.2 14l2.8 4.2M9.8 14L7 18.2M8.5 10L3.7 8.6",
  kid: "M12 3a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM7 11h10M12 9v6M12 15l-3 6M12 15l3 6",
  leaf: "M5 19c0-8 5-13 15-14-1 10-6 15-14 15M5 19l7-7",
  doc: "M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6",
  pencil: "M4 20l4-1 11-11-3-3L5 16zM14 6l3 3",
  arrow: "M5 12h14M13 6l6 6-6 6",
  back: "M19 12H5M11 18l-6-6 6-6",
  close: "M6 6l12 12M18 6L6 18",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  calc: "M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM8 7h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 18h.01M12 18h4",
  whatsapp: "M20.5 11.8a8.6 8.6 0 0 1-12.6 7.6L3 21l1.6-4.8A8.6 8.6 0 1 1 20.5 11.8zM9 8.4c-.3 1.8.6 3.7 2 5.2 1.5 1.5 3.4 2.4 5.2 2l.6-1.6-2-1-1 1c-1-.5-2-1.5-2.6-2.6l1-1-1-2z",
  drag: "M8 12h8M5 12l3-3M5 12l3 3M19 12l-3-3M19 12l-3 3",
  pin: "M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21zM12 7a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z",
  check: "M5 12.5l4.5 4.5L19 7.5",
  sprout: "M12 21v-8M12 13c0-4-3-6-7-6 0 4 3 6 7 6zM12 11c0-3.5 2.5-6 7-6 0 4-3 6-7 6zM6 21h12",
  houses: "M2 20V11l5-4 5 4v9M12 20v-7l5-4 5 4v7M2 20h20M5 20v-4h4v4M15 20v-3h4v3",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2",
  phone: "M5 3h3l2 5-2.5 1.5a11 11 0 0 0 7 7L16 14l5 2v3a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z",
  ruler: "M3 17L17 3l4 4L7 21zM7 13l2 2M10 10l2 2M13 7l2 2",
  compass: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM15.5 8.5l-2 5-5 2 2-5z",
  mountain: "M2 20l7-12 4 6 3-4 6 10zM9 8l2 3 2-1.5",
  layers: "M12 3l9 5-9 5-9-5zM3 13l9 5 9-5",
};

export type IconKey = keyof typeof PATHS;

export function Icon({ name, size = 20, className }: { name: IconKey; size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 32" aria-label="Allpa" role="img">
      <path d="M2 25L11.5 8l5 8.5 3-4.5L27 25z" fill="currentColor" />
      <path d="M11.5 8l2.6 4.4-1.4-.8-1.2 1.6-1.3-1.4-1.3.6z" fill="#f4ece0" />
      <text x="33" y="24" fill="currentColor" fontFamily="'Bricolage Grotesque Variable', system-ui, sans-serif" fontSize="25" fontWeight="700" letterSpacing="-0.5">
        allpa
      </text>
    </svg>
  );
}
