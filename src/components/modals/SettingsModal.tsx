import { useState, useRef } from 'react';
import { useApp } from '../../state/AppContext';
import { useAuth } from '../../state/AuthContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { SegmentedControl } from '../ui/SegmentedControl';
import { tr } from '../../i18n/tr';
import { formatDate, formatRange, weeksBetween } from '../../lib/dates';
import { getTotalClassHours, getSummary, getCourseSummaries } from '../../lib/calc';
import { exportAppData, importAppData } from '../../lib/importExport';
import type { ThemePreference, AppData } from '../../types';
import {
  Download,
  Upload,
  Sparkles,
  Archive,
  Trash2,
  ShieldCheck,
  Check,
  Share2,
  Github,
} from 'lucide-react';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEditSetup: () => void;
  onStartNewTerm: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  onEditSetup,
  onStartNewTerm,
}: SettingsModalProps) {
  const { data, dispatch, today } = useApp();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<AppData | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const totalClasses = getTotalClassHours(data);
  const weeksCount = weeksBetween(data.term.start, data.term.end);

  const themeOptions = [
    { value: 'system' as const, label: tr.settings.themes.system },
    { value: 'light' as const, label: tr.settings.themes.light },
    { value: 'dark' as const, label: tr.settings.themes.dark },
  ];

  const handleExport = () => {
    const json = exportAppData(data);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `devamsizlik-yedek-${today}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  const handleCopySummary = async () => {
    const summary = getSummary(data);
    const isDays = data.trackingUnit === 'days';
    const isCourseHours = data.trackingUnit === 'course_hours';
    const unitLabel = isDays ? 'Gün' : 'Saat';
    const percent = Math.round(summary.ratio * 100);
    const statusText =
      summary.overBy > 0
        ? `Limit Aşıldı (+${summary.overBy} ${unitLabel.toLowerCase()})`
        : summary.status === 'critical'
          ? 'Kritik Seviye'
          : summary.status === 'warning'
            ? 'Uyarı Seviyesi'
            : 'Güvenli Seviye';

    const courseDetails =
      isCourseHours && data.courses && data.courses.length > 0
        ? [
            '',
            '📚 DERS BAZLI DETAYLAR:',
            ...getCourseSummaries(data.courses, data.absences).map(
              (s) =>
                `• ${s.course.name}: ${s.used} / ${s.course.allowedHours} sa (Kalan: ${s.remaining} sa${
                  s.overBy > 0 ? `, ${s.overBy} sa aşıldı!` : ''
                })`,
            ),
          ]
        : [];

    const text = [
      `📊 DEVAMSIZLIK RAPORU`,
      data.term.name ? `Dönem: ${data.term.name}` : null,
      `Tarih Aralığı: ${formatRange(data.term.start, data.term.end)}`,
      `Takip Sistemi: ${isCourseHours ? 'Ders Bazlı Saat' : isDays ? 'Gün Bazlı' : 'Genel Saat'}`,
      `Toplam Hak: ${summary.allowed} ${unitLabel.toLowerCase()}`,
      `Kullanılan: ${summary.used} ${unitLabel.toLowerCase()} (%${percent})`,
      `Kalan Hak: ${summary.remaining} ${unitLabel.toLowerCase()}`,
      `Durum: ${statusText}`,
      `Kayıt Sayısı: ${data.absences.length}`,
      ...courseDetails,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    } catch {
      // Fallback if clipboard API not available
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const res = importAppData(text);
      if (res.ok) {
        setPendingImportData(res.data);
      } else {
        setImportStatus(
          res.error === 'parse' ? tr.settings.importParseError : tr.settings.importInvalid,
        );
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const confirmImport = () => {
    if (pendingImportData) {
      dispatch({ type: 'replaceAll', data: pendingImportData });
      setPendingImportData(null);
      setImportStatus(tr.settings.importDone);
      setTimeout(() => setImportStatus(null), 3500);
    }
  };

  const handleReset = () => {
    dispatch({ type: 'resetAll', today });
    setConfirmResetOpen(false);
    onClose();
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={tr.settings.title} maxWidth="md">
        <div className="space-y-6 pb-2">
          {/* Section: Term Overview & Edit */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                {tr.settings.termSection}
              </h3>
              <Button variant="outline" size="sm" onClick={onEditSetup} className="text-xs">
                {tr.settings.editSetup}
              </Button>
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 space-y-2 text-xs">
              {data.term.name && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">{tr.settings.termName}:</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">{data.term.name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-zinc-500">{tr.settings.dates}:</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {formatRange(data.term.start, data.term.end)} ({tr.settings.weeks(weeksCount)})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Takip Sistemi:</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {data.trackingUnit === 'course_hours'
                    ? '📚 Ders Bazlı Saat'
                    : data.trackingUnit === 'days'
                      ? '📅 Gün Bazlı'
                      : '⏱️ Genel Saat'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">{tr.settings.allowance}:</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {tr.common.unit(data.allowedHours, data.trackingUnit)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">{data.trackingUnit === 'days' ? 'Toplam Ders Günü' : tr.settings.totalClassHours}:</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {tr.common.unit(totalClasses, data.trackingUnit)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">{tr.settings.holidays}:</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {tr.settings.holidayCount(data.holidays.length)}
                </span>
              </div>

              {data.trackingUnit === 'course_hours' && data.courses && data.courses.length > 0 && (
                <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800 space-y-1.5">
                  <span className="text-zinc-500 block font-medium">Kayıtlı Dersler ve Limitleri:</span>
                  <div className="space-y-1">
                    {data.courses.map((c) => (
                      <div key={c.id} className="flex justify-between text-[11px] text-zinc-700 dark:text-zinc-300">
                        <span>• {c.name} ({c.weeklyHours} sa/hf)</span>
                        <span className="font-semibold">{c.allowedHours} sa limit</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section: New Term */}
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                {tr.settings.newTermSection}
              </h4>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {tr.settings.newTermText}
            </p>
            <div className="pt-1">
              <Button variant="secondary" size="sm" onClick={onStartNewTerm} className="text-xs">
                {tr.settings.newTerm}
              </Button>
            </div>
          </div>

          {/* Section: Past Archive */}
          {data.archive.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <Archive className="w-3.5 h-3.5" />
                {tr.settings.archive}
              </h3>
              <div className="space-y-2">
                {data.archive.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200/50 dark:border-zinc-800 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {item.name || `${formatDate(item.start)} – ${formatDate(item.end)}`}
                      </div>
                      <div className="text-zinc-500 text-[11px] mt-0.5">
                        {tr.settings.archiveItem(item.usedHours, item.allowedHours, data.trackingUnit)} · {item.absenceCount} kayıt
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => dispatch({ type: 'deleteArchivedTerm', id: item.id })}
                      className="p-1 text-zinc-400 hover:text-rose-500"
                      aria-label={tr.settings.deleteArchive}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: Theme */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                {tr.settings.appearance}
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">{tr.settings.theme}</p>
            </div>
            <SegmentedControl
              options={themeOptions}
              value={data.theme}
              onChange={(theme: ThemePreference) => dispatch({ type: 'setTheme', theme })}
              size="sm"
            />
          </div>

          {/* Section: Data Backup & Restore */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {tr.settings.data}
            </h3>

            {importStatus && (
              <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-medium text-zinc-800 dark:text-zinc-200">
                {importStatus}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                icon={exportSuccess ? <Check className="w-4 h-4 text-emerald-500" /> : <Download className="w-4 h-4" />}
                className="text-xs"
              >
                {exportSuccess ? tr.settings.exportDone : tr.settings.export}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                icon={<Upload className="w-4 h-4" />}
                className="text-xs"
              >
                {tr.settings.import}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopySummary}
              icon={copySuccess ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
              className="w-full text-xs"
            >
              {copySuccess ? '✓ Rapor Panoya Kopyalandı' : '📋 Durum Raporunu Panoya Kopyala'}
            </Button>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setConfirmResetOpen(true)}
                className="text-xs font-medium text-rose-600 dark:text-rose-400 hover:underline"
              >
                {tr.settings.reset}
              </button>

              <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{user ? 'Verileriniz bulut hesabınızda güvenle saklanır.' : tr.settings.privacy}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-center">
              <a
                href="https://github.com/mavefka/devamsizlik"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors font-medium py-1 px-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <Github className="w-3.5 h-3.5" />
                <span>GitHub · mavefka/devamsizlik</span>
              </a>
            </div>
          </div>
        </div>
      </Modal>

      {/* Import Confirmation Dialog */}
      <ConfirmDialog
        isOpen={pendingImportData !== null}
        onClose={() => setPendingImportData(null)}
        onConfirm={confirmImport}
        title={tr.settings.importTitle}
        message={tr.settings.importText}
        confirmLabel={tr.settings.importConfirm}
        danger={false}
      />

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmResetOpen}
        onClose={() => setConfirmResetOpen(false)}
        onConfirm={handleReset}
        title={tr.settings.resetTitle}
        message={tr.settings.resetText}
        confirmLabel={tr.settings.resetConfirm}
        danger={true}
      />
    </>
  );
}
