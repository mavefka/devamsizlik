import { useState } from 'react';
import { History, Pencil, Trash2, Calendar, FileText } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { groupAbsencesByWeek, isAbsenceConsistent } from '../../lib/calc';
import { tr } from '../../i18n/tr';
import { formatDate, formatDayMonth, formatWeekday } from '../../lib/dates';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import type { Absence } from '../../types';

export interface AbsenceHistoryProps {
  onEdit: (absence: Absence) => void;
  onOpenLogModal: () => void;
}

export function AbsenceHistory({ onEdit, onOpenLogModal }: AbsenceHistoryProps) {
  const { data, dispatch } = useApp();
  const [deleteTarget, setDeleteTarget] = useState<Absence | null>(null);

  const groups = groupAbsencesByWeek(data.absences);
  const totalCount = data.absences.length;
  const totalHours = data.absences.reduce((s, a) => s + a.hours, 0);

  const handleDelete = () => {
    if (deleteTarget) {
      dispatch({ type: 'deleteAbsence', id: deleteTarget.id });
      setDeleteTarget(null);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {tr.history.title}
            </h3>
            {totalCount > 0 && (
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {totalCount} kayıt · toplam {tr.common.unit(totalHours, data.trackingUnit)}
              </p>
            )}
          </div>
        </div>

        {totalCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenLogModal}
            className="text-xs"
          >
            + {tr.nav.addAbsence}
          </Button>
        )}
      </div>

      {/* Empty State */}
      {totalCount === 0 ? (
        <div className="text-center py-12 px-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
            <Calendar className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              {tr.empty.title}
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
              {tr.empty.text}
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={onOpenLogModal}>
            {tr.empty.cta}
          </Button>
        </div>
      ) : (
        /* Chronological Grouped List */
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.weekStart} className="space-y-2">
              {/* Week header */}
              <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-1">
                <span>{formatDayMonth(group.weekStart)} haftası</span>
                <span>{tr.common.unit(group.total, data.trackingUnit)}</span>
              </div>

              {/* Records */}
              <div className="space-y-1.5">
                {group.items.map((absence) => {
                  const consistent = isAbsenceConsistent(data, absence);

                  return (
                    <div
                      key={absence.id}
                      className="group flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/70 border border-zinc-200/50 dark:border-zinc-800 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Hours pill */}
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60 flex flex-col items-center justify-center shrink-0">
                          <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tabular-nums leading-none">
                            {absence.hours}
                          </span>
                          <span className="text-[9px] text-zinc-500 font-medium">
                            {tr.common.unitShort(data.trackingUnit)}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                              {formatDate(absence.date)}
                            </span>
                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                              ({formatWeekday(absence.date)})
                            </span>
                            {absence.courseName && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700 truncate max-w-[140px]">
                                📚 {absence.courseName}
                              </span>
                            )}
                          </div>

                          {absence.note ? (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate flex items-center gap-1 mt-0.5">
                              <FileText className="w-3 h-3 shrink-0" />
                              {absence.note}
                            </p>
                          ) : null}

                          {!consistent && (
                            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">
                              {tr.history.inconsistent}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          type="button"
                          onClick={() => onEdit(absence)}
                          aria-label={tr.history.editAria(absence.date)}
                          className="w-8 h-8 rounded-xl text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-white dark:hover:bg-zinc-700 flex items-center justify-center transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(absence)}
                          aria-label={tr.history.deleteAria(absence.date)}
                          className="w-8 h-8 rounded-xl text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center justify-center transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={tr.history.deleteTitle}
        message={
          deleteTarget
            ? deleteTarget.courseName
              ? `${formatDate(deleteTarget.date)} tarihli ${deleteTarget.courseName} dersi ${deleteTarget.hours} saat devamsızlık kaydı silinecek.`
              : tr.history.deleteText(formatDate(deleteTarget.date), deleteTarget.hours, data.trackingUnit)
            : ''
        }
      />
    </div>
  );
}
