export function getDayRange(dateInput?: string) {
  const baseDate = dateInput ? new Date(`${dateInput}T00:00:00.000Z`) : new Date();
  const start = new Date(Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), baseDate.getUTCDate()));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return {
    dateKey: start.toISOString().slice(0, 10),
    start,
    end
  };
}
