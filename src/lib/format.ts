export const fmt = (n: number) =>
  n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
export const time = (s: number) =>
  `${String(Math.floor(Math.max(0, s) / 60)).padStart(2, "0")}:${String(Math.floor(Math.max(0, s) % 60)).padStart(2, "0")}`;
