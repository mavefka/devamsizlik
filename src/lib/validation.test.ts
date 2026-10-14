import { describe, expect, it } from 'vitest';
import { absence, makeData } from './fixtures';
import { exportAppData, importAppData } from './importExport';
import { startNewTerm, suggestNextTermSetup } from './term';
import { validateAbsence, validateSetup } from './validation';

const TODAY = '2026-10-13';

describe('validateAbsence', () => {
  const data = makeData();

  it('accepts a full class day', () => {
    const v = validateAbsence(data, { date: '2026-10-05', hours: 7 }, TODAY);
    expect(v.errors).toEqual([]);
    expect(v.maxHours).toBe(7);
  });

  it('rejects days without classes, holidays, out-of-term and invalid dates', () => {
    expect(validateAbsence(data, { date: '2026-10-09', hours: 1 }, TODAY).errors).toEqual(['no-class']);
    expect(validateAbsence(data, { date: '2026-10-29', hours: 1 }, TODAY).errors).toEqual(['holiday']);
    expect(validateAbsence(data, { date: '2026-11-02', hours: 1 }, TODAY).errors).toEqual(['outside-term']);
    expect(validateAbsence(data, { date: '2026-02-30', hours: 1 }, TODAY).errors).toEqual(['invalid-date']);
    expect(validateAbsence(data, { date: '', hours: 1 }, TODAY).errors).toEqual(['invalid-date']);
  });

  it('rejects hours outside 1..max', () => {
    expect(validateAbsence(data, { date: '2026-10-05', hours: 0 }, TODAY).errors).toEqual(['invalid-hours']);
    expect(validateAbsence(data, { date: '2026-10-05', hours: 2.5 }, TODAY).errors).toEqual(['invalid-hours']);
    expect(validateAbsence(data, { date: '2026-10-05', hours: 8 }, TODAY).errors).toEqual(['exceeds-day']);
  });

  it('allows multiple entries per day within the day total', () => {
    const withEntry = makeData({ absences: [absence('2026-10-05', 4, 'a')] });
    const ok = validateAbsence(withEntry, { date: '2026-10-05', hours: 3 }, TODAY);
    expect(ok.errors).toEqual([]);
    expect(ok.warnings).toContain('has-entries');
    expect(ok.maxHours).toBe(3);
    expect(validateAbsence(withEntry, { date: '2026-10-05', hours: 4 }, TODAY).errors).toEqual(['exceeds-day']);

    const full = makeData({ absences: [absence('2026-10-05', 7, 'a')] });
    expect(validateAbsence(full, { date: '2026-10-05', hours: 1 }, TODAY).errors).toEqual(['day-full']);
    // Editing the existing entry ignores itself.
    expect(validateAbsence(full, { date: '2026-10-05', hours: 7 }, TODAY, 'a').errors).toEqual([]);
  });

  it('warns about future dates and exceeding the allowance', () => {
    expect(validateAbsence(data, { date: '2026-10-19', hours: 7 }, TODAY).warnings).toContain('future');
    const nearLimit = makeData({ absences: [absence('2026-10-05', 7), absence('2026-10-06', 7), absence('2026-10-07', 4), absence('2026-10-08', 4), absence('2026-10-12', 5)] });
    expect(validateAbsence(nearLimit, { date: '2026-10-13', hours: 2 }, TODAY).warnings).toContain('over-limit');
  });
});

describe('validateSetup', () => {
  it('accepts the default fixture', () => {
    expect(validateSetup(makeData())).toEqual([]);
  });

  it('detects bad dates, empty schedule and invalid allowance', () => {
    const base = makeData();
    expect(validateSetup({ ...base, term: { ...base.term, end: '2026-09-01' } })).toContain('term-order');
    expect(validateSetup({ ...base, term: { ...base.term, start: '' } })).toContain('term-start-invalid');
    expect(validateSetup({ ...base, schedule: base.schedule.map((d) => ({ ...d, hours: 0 })) })).toContain('schedule-empty');
    expect(validateSetup({ ...base, allowedHours: -1 })).toContain('allowed-invalid');
  });

  it('detects a term with no class hours at all', () => {
    const base = makeData();
    // Term covering only a Friday–Sunday.
    expect(validateSetup({ ...base, term: { ...base.term, start: '2026-10-09', end: '2026-10-11' } })).toContain('term-no-classes');
  });
});

describe('import / export', () => {
  it('round-trips data', () => {
    const data = makeData({ absences: [absence('2026-10-05', 7)] });
    const result = importAppData(exportAppData(data));
    expect(result).toEqual({ ok: true, data });
  });

  it('rejects malformed input', () => {
    expect(importAppData('{not json')).toEqual({ ok: false, error: 'parse' });
    expect(importAppData('{"version":1}')).toEqual({ ok: false, error: 'invalid' });
    expect(importAppData(JSON.stringify({ ...makeData(), absences: [{ date: '2026-10-05', hours: 0 }] }))).toEqual({ ok: false, error: 'invalid' });
  });
});

describe('new term', () => {
  it('archives the current term and clears absences', () => {
    const data = makeData({ absences: [absence('2026-10-05', 7)], theme: 'dark' });
    const setup = suggestNextTermSetup(data, TODAY);
    const next = startNewTerm(data, setup, '2026-11-01T00:00:00.000Z');

    expect(next.absences).toEqual([]);
    expect(next.theme).toBe('dark');
    expect(next.archive).toHaveLength(1);
    expect(next.archive[0]).toMatchObject({ name: 'Test', usedHours: 7, totalClassHours: 84, absenceCount: 1 });
  });

  it('suggests the Monday after the current term with the same length', () => {
    const setup = suggestNextTermSetup(makeData(), TODAY);
    expect(setup.term.start).toBe('2026-11-02');
    expect(setup.term.end).toBe('2026-11-29'); // 4 weeks
    expect(setup.allowedHours).toBe(28);
    expect(setup.holidays).toEqual([]);
  });

  it('preserves trackingUnit when suggesting next term', () => {
    const dayData = makeData({ trackingUnit: 'days', allowedHours: 15 });
    const setup = suggestNextTermSetup(dayData, TODAY);
    expect(setup.trackingUnit).toBe('days');
  });
});

describe('day-based tracking unit validation', () => {
  const dayData = makeData({
    trackingUnit: 'days',
    allowedHours: 15,
    schedule: [
      { hours: 1, classes: [{ id: 'c1', name: 'Matematik', hours: 1 }] },
      { hours: 1, classes: [{ id: 'c2', name: 'Fizik', hours: 1 }] },
      { hours: 0, classes: [] },
      { hours: 1, classes: [{ id: 'c3', name: 'Kimya', hours: 1 }] },
      { hours: 0, classes: [] },
      { hours: 0, classes: [] },
      { hours: 0, classes: [] },
    ],
  });

  it('accepts full day (1) and half day (0.5) absences', () => {
    const full = validateAbsence(dayData, { date: '2026-10-05', hours: 1 }, TODAY);
    expect(full.errors).toEqual([]);

    const half = validateAbsence(dayData, { date: '2026-10-05', hours: 0.5 }, TODAY);
    expect(half.errors).toEqual([]);
  });

  it('rejects invalid fractions in day mode', () => {
    const invalid = validateAbsence(dayData, { date: '2026-10-05', hours: 0.7 }, TODAY);
    expect(invalid.errors).toEqual(['invalid-hours']);

    const zero = validateAbsence(dayData, { date: '2026-10-05', hours: 0 }, TODAY);
    expect(zero.errors).toEqual(['invalid-hours']);
  });

  it('rejects hours exceeding day max in day mode', () => {
    const exceeds = validateAbsence(dayData, { date: '2026-10-05', hours: 1.5 }, TODAY);
    expect(exceeds.errors).toEqual(['exceeds-day']);
  });
});

