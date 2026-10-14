import { useState, useEffect } from 'react';
import { useApp } from './state/AppContext';
import { useAuth } from './state/AuthContext';
import { Header } from './components/dashboard/Header';
import { StatusHero } from './components/dashboard/StatusHero';
import { CourseCards } from './components/dashboard/CourseCards';
import { TodayBanner } from './components/dashboard/TodayBanner';
import { ProjectionCard } from './components/dashboard/ProjectionCard';
import { SimulatorCard } from './components/dashboard/SimulatorCard';
import { AbsenceChart } from './components/dashboard/AbsenceChart';
import { AbsenceHistory } from './components/dashboard/AbsenceHistory';
import { LogAbsenceModal } from './components/modals/LogAbsenceModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { SetupWizard } from './components/setup/SetupWizard';
import { AuthModal } from './components/auth/AuthModal';
import { ProfileModal } from './components/auth/ProfileModal';
import { AppLogo } from './components/ui/AppLogo';
import { pickSetup } from './lib/defaults';
import { suggestNextTermSetup } from './lib/term';
import { tr } from './i18n/tr';
import type { Absence, SetupData } from './types';
import { Plus, Sparkles } from 'lucide-react';
import { resetBodyScroll } from './lib/scrollLock';

export default function App() {
  const { data, dispatch, today } = useApp();
  const { user, isGuest, isLoading } = useAuth();

  // Clear any legacy persistent guest flag
  useEffect(() => {
    localStorage.removeItem('devamsizlik-guest-mode');
  }, []);

  // Modal visibility states
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [editingAbsence, setEditingAbsence] = useState<Absence | null>(null);
  const [selectedLogDate, setSelectedLogDate] = useState<string | undefined>(undefined);
  const [selectedLogCourseName, setSelectedLogCourseName] = useState<string | undefined>(undefined);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [wizardMode, setWizardMode] = useState<'initial' | 'edit' | 'newTerm' | null>(null);

  // Auth modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'choose' | 'login' | 'register'>('login');
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Unconditionally ensure body scroll is unlocked whenever all modals are closed
  useEffect(() => {
    const hasModal = logModalOpen || settingsOpen || Boolean(wizardMode) || authModalOpen || profileModalOpen;
    if (!hasModal) {
      resetBodyScroll();
    }
  }, [logModalOpen, settingsOpen, wizardMode, authModalOpen, profileModalOpen]);

  // 1. Initial auth loading check
  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-center items-center p-4">
        <div className="flex flex-col items-center gap-3">
          <AppLogo className="w-12 h-12" rounded="rounded-2xl" />
        </div>
      </div>
    );
  }

  // 2. Ask if user has an account on first visit before any onboarding
  if (!user && !isGuest) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-center items-center p-4">
        <AuthModal
          isOpen={true}
          defaultMode="choose"
          onClose={() => {}}
        />
      </div>
    );
  }

  // 3. If user or guest is not yet onboarded, show onboarding setup wizard
  if (!data.onboarded) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-center items-center p-4">
        <SetupWizard
          isOpen={true}
          mode="initial"
          initialSetup={pickSetup(data)}
          onOpenLogin={!user ? () => {
            setAuthModalMode('login');
            setAuthModalOpen(true);
          } : undefined}
          onComplete={(setup: SetupData) => {
            dispatch({ type: 'completeSetup', setup });
          }}
        />
        <AuthModal
          isOpen={authModalOpen}
          defaultMode={authModalMode}
          onClose={() => setAuthModalOpen(false)}
        />
      </div>
    );
  }

  const isTermEnded = today > data.term.end;

  const handleOpenLogModal = (targetDate?: string, courseName?: string) => {
    setEditingAbsence(null);
    setSelectedLogDate(targetDate);
    setSelectedLogCourseName(courseName);
    setLogModalOpen(true);
  };

  const handleEditAbsence = (absence: Absence) => {
    setEditingAbsence(absence);
    setSelectedLogDate(absence.date);
    setSelectedLogCourseName(absence.courseName);
    setLogModalOpen(true);
  };

  const handleDeleteAbsence = (id: string) => {
    dispatch({ type: 'deleteAbsence', id });
  };

  const handleOpenEditSetup = () => {
    setSettingsOpen(false);
    setWizardMode('edit');
  };

  const handleOpenNewTerm = () => {
    setSettingsOpen(false);
    setWizardMode('newTerm');
  };

  const handleCompleteWizard = (setup: SetupData) => {
    if (wizardMode === 'edit') {
      dispatch({ type: 'updateSetup', setup });
    } else if (wizardMode === 'newTerm') {
      dispatch({ type: 'startNewTerm', setup, now: new Date().toISOString() });
    }
    setWizardMode(null);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors pb-20 sm:pb-12">
      {/* Top Header */}
      <Header
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenLogModal={() => handleOpenLogModal()}
        onOpenAuth={() => {
          setAuthModalMode('login');
          setAuthModalOpen(true);
        }}
        onOpenProfile={() => setProfileModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 pt-5 sm:pt-7 space-y-5 sm:space-y-6">
        {/* Term Ended Banner */}
        {isTermEnded && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                {tr.termBanner.ended}
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                {tr.termBanner.endedText}
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenNewTerm}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-colors shrink-0 self-start sm:self-auto"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {tr.termBanner.newTerm}
            </button>
          </div>
        )}

        {/* Hero Card: Used vs. Remaining Hours & Status */}
        <StatusHero />

        {/* Course-based Cards when in course_hours tracking mode */}
        <CourseCards onOpenLogModal={handleOpenLogModal} />

        {/* Today's Context Banner & Quick Log */}
        <TodayBanner onOpenLogModal={handleOpenLogModal} />

        {/* Responsive Grid: Cards & Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {/* Left Column: Pace Projection & What-If Simulator */}
          <div className="space-y-5 sm:space-y-6">
            <ProjectionCard />
            <SimulatorCard />
          </div>

          {/* Right Column: Distribution Chart & History */}
          <div className="space-y-5 sm:space-y-6">
            <AbsenceChart />
            <AbsenceHistory
              onEdit={handleEditAbsence}
              onOpenLogModal={() => handleOpenLogModal()}
            />
          </div>
        </div>
      </main>

      {/* Floating Action Button (Mobile only) */}
      <div className="sm:hidden fixed bottom-5 right-5 z-20">
        <button
          type="button"
          onClick={() => handleOpenLogModal()}
          aria-label={tr.nav.addAbsence}
          className="w-14 h-14 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xl flex items-center justify-center active:scale-95 transition-all"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Modals */}
      <LogAbsenceModal
        isOpen={logModalOpen}
        onClose={() => setLogModalOpen(false)}
        initialAbsence={editingAbsence}
        initialDate={selectedLogDate}
        initialCourseName={selectedLogCourseName}
        onDelete={handleDeleteAbsence}
      />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onEditSetup={handleOpenEditSetup}
        onStartNewTerm={handleOpenNewTerm}
      />

      {wizardMode && (
        <SetupWizard
          isOpen={true}
          mode={wizardMode}
          initialSetup={
            wizardMode === 'newTerm' ? suggestNextTermSetup(data, today) : pickSetup(data)
          }
          onComplete={handleCompleteWizard}
          onCancel={() => setWizardMode(null)}
        />
      )}

      <AuthModal
        isOpen={authModalOpen}
        defaultMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
      />

      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
    </div>
  );
}
