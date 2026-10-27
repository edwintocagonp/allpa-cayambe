import { useEffect, useState } from "react";

import { PRESALE } from "./finance";

export function useToday() {
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => setToday(new Date()), []);
  return today;
}

export const useReferenceDate = () => useToday() ?? PRESALE;
