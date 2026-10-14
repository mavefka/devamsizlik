/**
 * Fixed-date national holidays in Türkiye. Religious holidays (Ramazan / Kurban
 * Bayramı) move every year and must be added manually.
 */
const NATIONAL_HOLIDAYS: { monthDay: string; label: string }[] = [
  { monthDay: '01-01', label: 'Yılbaşı' },
  { monthDay: '04-23', label: 'Ulusal Egemenlik ve Çocuk Bayramı' },
  { monthDay: '05-01', label: 'Emek ve Dayanışma Günü' },
  { monthDay: '05-19', label: "Atatürk'ü Anma, Gençlik ve Spor Bayramı" },
  { monthDay: '07-15', label: 'Demokrasi ve Millî Birlik Günü' },
  { monthDay: '08-30', label: 'Zafer Bayramı' },
  { monthDay: '10-29', label: 'Cumhuriyet Bayramı' },
];

export function getNationalHolidays(start: string, end: string): { date: string; label: string }[] {
  const result: { date: string; label: string }[] = [];
  const firstYear = Number(start.slice(0, 4));
  const lastYear = Number(end.slice(0, 4));
  for (let year = firstYear; year <= lastYear; year++) {
    for (const h of NATIONAL_HOLIDAYS) {
      const date = `${year}-${h.monthDay}`;
      if (date >= start && date <= end) result.push({ date, label: h.label });
    }
  }
  return result;
}
