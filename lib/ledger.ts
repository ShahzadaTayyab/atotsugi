export type LedgerEntry = {
  ts: string;
  item: string;
  qty: number;
  buyer_msg: string;
};

export function parseLedger(raw: string): LedgerEntry[] {
  if (!raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
