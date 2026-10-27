import type { Filter } from "../lots";

export const HERO_AZ = 1.72;

export const stage = {
  camAz: HERO_AZ,
  azTarget: HERO_AZ,
  look: 0,
  touched: -100,
  hover: null as string | null,
};

export type SceneView = {
  mode: "intro" | "explore";
  lot: string | null;
  vista: boolean;
  filter: Filter;
  future: boolean;
};

export type Insets = { left: number; right: number; top: number; bottom: number };

export const STATUS_COLOR = {
  disponible: "#3e9c74",
  reservado: "#dda23a",
  vendido: "#a59c90",
} as const;
