import { useState, useEffect } from 'react';
import { HelpCircle, ArrowRight } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { simulateAbsence, countSkippableDays, getUsedHours, getSummary, getCourseSummaries } from '../../lib/calc';
import { tr, WEEKDAYS_ACCUSATIVE, WEEKDAYS_SHORT, WEEKDAYS } from '../../i18n/tr';
import { Stepper } from '../ui/Stepper';

export function SimulatorCard() {
  const { data } = useApp();
  const unit = data.trackingUnit || 'hours';
  const isDays = unit === 'days';
  const isCourseHours = unit === 'course_hours';

  const courses = data.courses || [];
  const courseSummaries = isCourseHours && courses.length > 0 ? getCourseSummaries(courses, data.absences) : [];

  // Course mode state
  const [selectedCourseId, setSelectedCourseId] = useState<string>(() => courses[0]?.id || '');
  const activeCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];
  const activeCourseSummary = courseSummaries.find((s) => s.course.id === activeCourse?.id);

  const getSessionHours = (courseName?: string) => {
    if (!courseName) return 2;
    for (const d of data.schedule) {
      const found = d.classes?.find((c) => c.name === courseName);
      if (found) return found.hours;
    }
    return 2;
  };

  const [courseHoursSimulate, setCourseHoursSimulate] = useState<number>(() =>
    activeCourse ? getSessionHours(activeCourse.name) : 2,
  );

  // When selected course changes, update hours to simulate to that course's session hours
  useEffect(() => {
    if (activeCourse) {
      setCourseHoursSimulate(getSessionHours(activeCourse.name));
    }
  }, [selectedCourseId, activeCourse?.name]);

  // General hours/days mode state
  const summary = getSummary(data);
  const used = getUsedHours(data.absences);
  const allowed = data.allowedHours;

  const [selectedDay, setSelectedDay] = useState<number | 'custom'>(() => {
    const firstWithClasses = data.schedule.findIndex((d) => d.hours > 0);
    return firstWithClasses >= 0 ? firstWithClasses : 'custom';
  });

  const [customHours, setCustomHours] = useState(4);

  // If in course-based mode and courses are available:
  if (isCourseHours && courses.length > 0 && activeCourse && activeCourseSummary) {
    const sim = simulateAbsence(activeCourse.allowedHours, activeCourseSummary.used, courseHoursSimulate);
    const newUsed = activeCourseSummary.used + courseHoursSimulate;
    const sessionHours = getSessionHours(activeCourse.name);
    const skippableSessions = sessionHours > 0 ? Math.floor(activeCourseSummary.remaining / sessionHours) : 0;

    let outcomeText = '';
    if (sim.overBy > 0) {
      outcomeText = `limiti ${sim.overBy} saat aşarsın ve dersten kalma riski doğar!`;
    } else if (sim.remainingAfter === 0 && activeCourse.allowedHours > 0) {
      outcomeText = `tüm devamsızlık hakkını tüketirsin (tam sınıra ulaşırsın).`;
    } else {
      outcomeText = `devamsızlığın ${newUsed} / ${activeCourse.allowedHours} sa olur (${sim.remainingAfter} sa kalır).`;
    }

    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
        {/* Title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
              <HelpCircle className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {tr.whatIf.title}
            </h3>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
            Ders Simülasyonu
          </span>
        </div>

        {/* Course Selectors */}
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {courses.map((c) => {
              const isSelected = c.id === activeCourse.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCourseId(c.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                  }`}
                >
                  {c.name}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
              Simüle Edilecek Ders Saati:
            </span>
            <Stepper
              value={courseHoursSimulate}
              onChange={setCourseHoursSimulate}
              min={1}
              max={Math.max(10, activeCourse.allowedHours)}
              unit="sa"
              label="Saat"
              size="sm"
            />
          </div>
        </div>

        {/* Result Simulation Box */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200/50 dark:border-zinc-800 space-y-2">
          <div className="flex items-start gap-2">
            <ArrowRight className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 leading-snug">
              Bir sonraki <strong className="text-zinc-900 dark:text-zinc-100">{activeCourse.name}</strong> dersini ({courseHoursSimulate} sa) kaçırırsan:{' '}
              <strong className={sim.overBy > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-900 dark:text-zinc-100'}>
                {outcomeText}
              </strong>
            </p>
          </div>

          {sessionHours > 0 && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 pl-6">
              Bu dersten sınırı aşmadan en fazla <strong>{skippableSessions} ders</strong> ({skippableSessions * sessionHours} sa) daha kaçırabilirsin.
            </p>
          )}
        </div>
      </div>
    );
  }

  // Fallback / standard days or hours simulator
  const hasClassesOnDay =
    selectedDay !== 'custom' && (data.schedule[selectedDay]?.hours ?? 0) > 0;
  const activeSelected = hasClassesOnDay ? selectedDay : 'custom';

  const hoursToSimulate =
    activeSelected === 'custom'
      ? customHours
      : (data.schedule[activeSelected]?.hours ?? 0);

  const simulation = simulateAbsence(allowed, used, hoursToSimulate);

  // Result sentence construction
  let outcomeText = '';
  if (simulation.overBy > 0) {
    outcomeText = isDays ? `limiti ${simulation.overBy} gün aşarsın.` : tr.whatIf.over(simulation.overBy);
  } else if (simulation.remainingAfter === 0 && allowed > 0) {
    outcomeText = tr.whatIf.exact;
  } else {
    outcomeText = isDays ? `${simulation.remainingAfter} gün kalır.` : tr.whatIf.remains(simulation.remainingAfter);
  }

  let introText = '';
  if (activeSelected === 'custom') {
    introText = isDays ? `${hoursToSimulate} gün daha kaçırırsan` : `${tr.whatIf.customPrefix(hoursToSimulate)}`;
  } else {
    introText = isDays ? `Tam bir ${WEEKDAYS_ACCUSATIVE[activeSelected]} kaçırırsan 1 gün düşülür ve` : `${tr.whatIf.day(WEEKDAYS_ACCUSATIVE[activeSelected], hoursToSimulate)}`;
  }

  const skippable =
    activeSelected !== 'custom' && hoursToSimulate > 0
      ? countSkippableDays(summary.remaining, hoursToSimulate)
      : null;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
      {/* Title */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
          <HelpCircle className="w-4 h-4" />
        </div>
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
          {tr.whatIf.title}
        </h3>
      </div>

      {/* Selectors */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {data.schedule.map((d, idx) => {
            if (d.hours === 0) return null;
            const isSelected = selectedDay === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedDay(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                }`}
              >
                {WEEKDAYS_SHORT[idx]} ({isDays ? '1 gün' : `${d.hours} sa`})
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setSelectedDay('custom')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedDay === 'custom'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
            }`}
          >
            {tr.whatIf.custom}
          </button>
        </div>

        {selectedDay === 'custom' && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
              {isDays ? 'Özel Gün:' : tr.whatIf.customHours}:
            </span>
            <Stepper
              value={customHours}
              onChange={setCustomHours}
              min={1}
              max={30}
              unit={tr.common.unitShort(unit)}
              label={isDays ? 'Gün' : tr.whatIf.customHours}
              size="sm"
            />
          </div>
        )}
      </div>

      {/* Result Simulation Box */}
      <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200/50 dark:border-zinc-800 space-y-2">
        <div className="flex items-start gap-2">
          <ArrowRight className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 leading-snug">
            {introText} <strong className="text-zinc-900 dark:text-zinc-100">{outcomeText}</strong>
          </p>
        </div>

        {skippable !== null && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 pl-6">
            {tr.whatIf.skippable(skippable, WEEKDAYS[selectedDay as number])}
          </p>
        )}
      </div>
    </div>
  );
}
