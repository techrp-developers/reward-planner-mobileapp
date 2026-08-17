// Independence Day window: Aug 13-15, any year.
export function isFestivePeriod(date: Date = new Date()): boolean {
  return date.getMonth() === 7 && date.getDate() >= 13 && date.getDate() <= 15;
}
