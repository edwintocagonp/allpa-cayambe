export const RESERVE = 500;
export const MIN_DOWN = 20;
export const TERMS = [12, 24, 36, 48, 60] as const;
export const FREE_MONTHS = 24;
export const RATE = 9;
export const CASH_DISCOUNT = 0.06;
export const PRESALE = new Date(2026, 9, 1);
export const DELIVERY: Record<1 | 2, Date> = { 1: new Date(2027, 2, 15), 2: new Date(2027, 11, 15) };

export type Simulation = {
  price: number;
  discount: number;
  total: number;
  down: number;
  financed: number;
  months: number;
  monthly: number;
  interest: number;
  rate: number;
};

export function simulate(price: number, downPct: number, months: number, cash: boolean): Simulation {
  if (cash) {
    const discount = Math.round(price * CASH_DISCOUNT);
    return { price, discount, total: price - discount, down: price - discount, financed: 0, months: 0, monthly: 0, interest: 0, rate: 0 };
  }
  const down = Math.round(price * downPct);
  const financed = price - down;
  const rate = months > FREE_MONTHS ? RATE : 0;
  const r = rate / 100 / 12;
  const monthly = r === 0 ? financed / months : (financed * r) / (1 - Math.pow(1 + r, -months));
  const interest = monthly * months - financed;
  return { price, discount: 0, total: price + interest, down, financed, months, monthly, interest, rate };
}

const usd = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const num = new Intl.NumberFormat("es-EC", { maximumFractionDigits: 2 });

export const money = (value: number) => usd.format(Math.round(value));
export const decimal = (value: number) => num.format(value);
export const monthLabel = (date: Date) => date.toLocaleDateString("es-EC", { month: "long", year: "numeric" });

export function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}
