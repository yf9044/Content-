/**
 * Lebanon prices in "fresh" US dollars, with lira shown underneath because a lot
 * of customers still budget in LBP. 89,500 is the Banque du Liban peg.
 */
export const LBP_PER_USD = 89_500;

export function formatUsd(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function formatLbp(amountUsd: number): string {
  const lbp = Math.round((amountUsd * LBP_PER_USD) / 1000) * 1000;
  return `${lbp.toLocaleString('en-US')} LL`;
}

/** `+96170123456` -> `+961 70 123 456` */
export function formatPhone(phone: string): string {
  const national = phone.replace(/^\+961/, '');
  if (national.length < 7) return phone;
  const [, prefix, middle, last] = national.match(/^(\d{2})(\d{3})(\d+)$/) ?? [];
  return prefix ? `+961 ${prefix} ${middle} ${last}` : phone;
}

export function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

export function formatEta(minutes: number): string {
  return `${minutes}-${minutes + 10} min`;
}
