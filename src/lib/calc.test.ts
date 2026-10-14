import { describe, expect, it } from 'vitest';
import {
  countSkippableDays,
  findDefaultAbsenceDate,
  getClassHoursForDate,
  getRemainingClassHours,
  getStatus,
  getSummary,
  getTotalClassHours,
  getWeeklyBuckets,
  groupAbsencesByWeek,
  isAbsenceConsistent,
  projectLimitDate,
  simulateAbsence,
  extractCoursesFromSchedule,
  getCourseSummaries,
  getOverallCourseSummary,
} from './calc';
import { absence, makeData } from './fixtures';
import { getNationalHolidays } from './holidays';

describe('class hours', () => {
  const data = makeData();

  it('returns scheduled hours only on class days inside the term', () => {
    expect(getClassHoursForDate(data, '2026-10-05')).toBe(7); // Monday
    expect(getClassHoursForDate(data, '2026-10-07')).toBe(4); // Wednesday
    expect(getClassHoursForDate(data, '2026-10-09')).toBe(0); // Friday, no classes
    expect(getClassHoursForDate(data, '2026-10-29')).toBe(0); // holiday
    expect(getClassHoursForDate(data, '2026-11-02')).toBe(0); // after term
  });

  it('sums total and remaining class hours excluding holidays', () => {
    expect(getTotalClassHours(data)).toBe(84);
    // Mon 26 (7) + Tue 27 (7) + Wed 28 (4) + Thu 29 holiday + Fri 30 (0)
    expect(getRemainingClassHours(data, '2026-10-26')).toBe(18);
    expect(getRemainingClassHours(data, '2026-11-10')).toBe(0);
  });
});

describe('status & summary', () => {
  it('maps usage ratio to status thresholds', () => {
    expect(getStatus(0, 28)).toBe('safe');
    expect(getStatus(16, 28)).toBe('safe');
    expect(getStatus(17, 28)).toBe('warning');
    expect(getStatus(24, 28)).toBe('critical');
    expect(getStatus(30, 28)).toBe('critical');
  });

  it('handles a zero allowance', () => {
    expect(getStatus(0, 0)).toBe('safe');
    expect(getStatus(1, 0)).toBe('critical');
  });

  it('reports overage without negative remaining', () => {
    const s = getSummary(makeData({ absences: [absence('2026-10-05', 7), absence('2026-10-06', 7), absence('2026-10-12', 7), absence('2026-10-13', 7), absence('2026-10-14', 3)] }));
    expect(s.used).toBe(31);
    expect(s.remaining).toBe(0);
    expect(s.overBy).toBe(3);
    expect(s.ratio).toBe(1);
    expect(s.status).toBe('critical');
  });
});

describe('simulation', () => {
  it('matches the "skip a full Monday" example', () => {
    const sim = simulateAbsence(28, 7, 7);
    expect(sim.deducted).toBe(7);
    expect(sim.remainingAfter).toBe(14);
    expect(sim.overBy).toBe(0);
    expect(sim.statusAfter).toBe('safe');
  });

  it('reports how far a simulation exceeds the limit', () => {
    const sim = simulateAbsence(28, 25, 7);
    expect(sim.remainingAfter).toBe(0);
    expect(sim.overBy).toBe(4);
    expect(sim.statusAfter).toBe('critical');
  });

  it('counts skippable full days', () => {
    expect(countSkippableDays(14, 7)).toBe(2);
    expect(countSkippableDays(13, 7)).toBe(1);
    expect(countSkippableDays(0, 7)).toBe(0);
    expect(countSkippableDays(10, 0)).toBe(0);
  });
});

describe('projection', () => {
  it('projects the limit date from the current pace', () => {
    // 14 h missed out of 22 elapsed class hours → rate 14/22; 14 h remain.
    // Future: Mon 12 (+4.45) Tue 13 (+4.45) Wed 14 (+2.55) Thu 15 (+2.55) = 14.
    const data = makeData({ absences: [absence('2026-10-05', 7), absence('2026-10-06', 7)] });
    expect(projectLimitDate(data, '2026-10-11')).toMatchObject({ kind: 'date', date: '2026-10-15' });
  });

  it('reports safe-until-end for a slow pace', () => {
    const data = makeData({ absences: [absence('2026-10-05', 1)] });
    const p = projectLimitDate(data, '2026-10-11');
    expect(p.kind).toBe('safe-until-end');
    if (p.kind === 'safe-until-end') expect(p.projectedTotal).toBeCloseTo(1 + 62 / 22, 5);
  });

  it('handles no data, reached limit, not started and ended terms', () => {
    expect(projectLimitDate(makeData(), '2026-10-11').kind).toBe('no-data');
    expect(projectLimitDate(makeData({ allowedHours: 7, absences: [absence('2026-10-05', 7)] }), '2026-10-11')).toEqual({ kind: 'limit-reached', overBy: 0 });
    expect(projectLimitDate(makeData(), '2026-09-01').kind).toBe('not-started');
    expect(projectLimitDate(makeData(), '2026-11-05').kind).toBe('ended');
  });
});

describe('grouping & buckets', () => {
  const data = makeData({
    absences: [absence('2026-10-05', 7, 'a'), absence('2026-10-06', 3, 'b'), absence('2026-10-20', 4, 'c')],
  });

  it('builds one weekly bucket per term week', () => {
    const buckets = getWeeklyBuckets(data);
    expect(buckets.map((b) => b.key)).toEqual(['2026-10-05', '2026-10-12', '2026-10-19', '2026-10-26']);
    expect(buckets.map((b) => b.hours)).toEqual([10, 0, 4, 0]);
  });

  it('groups history by week, newest first', () => {
    const groups = groupAbsencesByWeek(data.absences);
    expect(groups.map((g) => g.weekStart)).toEqual(['2026-10-19', '2026-10-05']);
    expect(groups[1].items.map((a) => a.id)).toEqual(['b', 'a']);
    expect(groups[1].total).toBe(10);
  });
});

describe('default date & consistency', () => {
  it('suggests today on a class day, otherwise the last class day', () => {
    const data = makeData();
    expect(findDefaultAbsenceDate(data, '2026-10-05')).toBe('2026-10-05');
    expect(findDefaultAbsenceDate(data, '2026-10-10')).toBe('2026-10-08'); // Saturday → Thursday
  });

  it('skips days that are already fully logged', () => {
    const data = makeData({ absences: [absence('2026-10-06', 7)] });
    expect(findDefaultAbsenceDate(data, '2026-10-06')).toBe('2026-10-05');
  });

  it('flags entries that no longer fit after a schedule change', () => {
    const entry = absence('2026-10-05', 7);
    const data = makeData({ absences: [entry] });
    expect(isAbsenceConsistent(data, entry)).toBe(true);
    const schedule = data.schedule.map((d, i) => (i === 0 ? { ...d, hours: 4 } : d));
    expect(isAbsenceConsistent({ ...data, schedule }, entry)).toBe(false);
  });
});

describe('national holidays', () => {
  it('returns fixed holidays within range across years', () => {
    expect(getNationalHolidays('2026-10-01', '2027-01-15').map((h) => h.date)).toEqual(['2026-10-29', '2027-01-01']);
  });
});

describe('course-based tracking calculations', () => {
  it('extracts unique courses and aggregates weekly hours and calculates 30% default allowance', () => {
    const schedule = [
      {
        hours: 4,
        classes: [
          { id: '1', name: 'Matematik', hours: 2 },
          { id: '2', name: 'Fizik', hours: 2 },
        ],
      },
      {
        hours: 4,
        classes: [
          { id: '3', name: 'Matematik', hours: 2 },
          { id: '4', name: 'Kimya', hours: 2 },
        ],
      },
      { hours: 0, classes: [] },
      { hours: 0, classes: [] },
      { hours: 0, classes: [] },
    ];

    const courses = extractCoursesFromSchedule(schedule, 14, 0.3);
    expect(courses.length).toBe(3);

    const mat = courses.find((c) => c.name === 'Matematik');
    expect(mat).toBeDefined();
    expect(mat?.weeklyHours).toBe(4);
    // 4 hours * 14 weeks * 0.3 = 16.8 -> Math.round is 17
    expect(mat?.allowedHours).toBe(17);

    const fizik = courses.find((c) => c.name === 'Fizik');
    expect(fizik?.weeklyHours).toBe(2);
    // 2 hours * 14 weeks * 0.3 = 8.4 -> Math.round is 8
    expect(fizik?.allowedHours).toBe(8);
  });

  it('calculates course summaries and identifies at-risk courses', () => {
    const courses = [
      { id: 'c1', name: 'Matematik', weeklyHours: 4, allowedHours: 16 },
      { id: 'c2', name: 'Fizik', weeklyHours: 2, allowedHours: 8 },
    ];

    const absences = [
      { id: 'a1', date: '2026-10-05', hours: 4, courseName: 'Matematik', note: '', createdAt: '' },
      { id: 'a2', date: '2026-10-12', hours: 4, courseName: 'Matematik', note: '', createdAt: '' },
      { id: 'a3', date: '2026-10-06', hours: 8, courseName: 'Fizik', note: '', createdAt: '' },
      { id: 'a4', date: '2026-10-13', hours: 2, courseName: 'Fizik', note: '', createdAt: '' },
    ];

    const summaries = getCourseSummaries(courses, absences);
    expect(summaries[0].course.name).toBe('Matematik');
    expect(summaries[0].used).toBe(8);
    expect(summaries[0].remaining).toBe(8);
    expect(summaries[0].status).toBe('safe'); // 8 / 16 = 50% <= 60%

    expect(summaries[1].course.name).toBe('Fizik');
    expect(summaries[1].used).toBe(10);
    expect(summaries[1].remaining).toBe(0);
    expect(summaries[1].overBy).toBe(2);
    expect(summaries[1].status).toBe('critical');

    const overall = getOverallCourseSummary(courses, absences);
    expect(overall.totalCourses).toBe(2);
    expect(overall.totalUsed).toBe(18);
    expect(overall.totalAllowed).toBe(24);
    expect(overall.overCount).toBe(1);
    expect(overall.criticalCount).toBe(1);
    expect(overall.safeCount).toBe(1);
    expect(overall.mostAtRisk?.course.name).toBe('Fizik');
  });
});

