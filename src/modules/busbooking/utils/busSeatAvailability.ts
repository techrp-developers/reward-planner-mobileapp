export const isSeatAvailable = (value: unknown): boolean =>
  value === true || value === "true" || value === 1 || value === "1";

export const countAvailableSeats = (seats: { SeatStatus: unknown }[]): number =>
  seats.filter(seat => isSeatAvailable(seat.SeatStatus)).length;

export const formatAvailableSeats = (value: unknown): string => {
  const text = String(value ?? "").trim();
  const match = text.match(/^(\d+)(?:\.0+)?(?:\s+SEATS?(?:\s+LEFT|\s+AVAILABLE)?)?$/i);
  return match ? `${Number(match[1])} SEATS LEFT` : "CHECK AVAILABILITY";
};
