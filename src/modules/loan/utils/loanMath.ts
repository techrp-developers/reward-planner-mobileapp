export const LOAN_MIN = 10000;
export const LOAN_MAX = 300000;
export const TENURES = [6, 12, 18, 24] as const;

export const money = (value: number) =>
  `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

// Illustrative terms from the journey brief. Replace with the lender's quote.
export function calculateOffer(
  amount: number,
  months: number,
  annualRate = 12,
) {
  if (
    !Number.isFinite(amount) ||
    amount < LOAN_MIN ||
    amount > LOAN_MAX ||
    !TENURES.includes(months as (typeof TENURES)[number]) ||
    annualRate < 0 ||
    !Number.isFinite(annualRate)
  ) {
    throw new Error('Invalid loan terms');
  }
  const rate = annualRate / 1200;
  const emi =
    rate === 0
      ? amount / months
      : (amount * rate) / (1 - Math.pow(1 + rate, -months));
  const fee = Math.round(amount * 0.02);
  let balance = amount;
  const schedule = Array.from({ length: months }, (_, index) => {
    const interest = balance * rate;
    const principal = index === months - 1 ? balance : emi - interest;
    const payment = principal + interest;
    balance = Math.max(0, balance - principal);
    return { number: index + 1, payment, interest, principal, balance };
  });
  const total = schedule.reduce((sum, row) => sum + row.payment, 0);
  return {
    amount,
    months,
    annualRate,
    emi,
    fee,
    net: amount - fee,
    total,
    interest: total - amount,
    schedule,
  };
}

export function isAdult(value: string, today = new Date()) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) {
    return false;
  }
  const [, day, month, year] = match.map(Number);
  const birth = new Date(year, month - 1, day);
  if (
    birth.getFullYear() !== year ||
    birth.getMonth() !== month - 1 ||
    birth.getDate() !== day
  ) {
    return false;
  }
  let age = today.getFullYear() - year;
  if (
    today.getMonth() < month - 1 ||
    (today.getMonth() === month - 1 && today.getDate() < day)
  ) {
    age--;
  }
  return age >= 18;
}
