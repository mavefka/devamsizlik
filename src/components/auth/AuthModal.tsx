import { useState, useEffect } from 'react';
import { LogIn, UserPlus, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../state/AuthContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { AppLogo } from '../ui/AppLogo';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register' | 'choose';
}

export function AuthModal({ isOpen, onClose, defaultMode = 'choose' }: AuthModalProps) {
  const { login, register, continueAsGuest } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'choose'>(defaultMode);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Sync mode whenever modal is opened or defaultMode changes
  useEffect(() => {
    if (isOpen) {
      setMode(defaultMode);
      setError(null);
      setShowPassword(false);
    }
  }, [isOpen, defaultMode]);

  if (!isOpen) return null;

  // Handle closing: if started in 'choose' mode and currently in login/register, return to 'choose'
  const handleClose = () => {
    if (defaultMode === 'choose' && mode !== 'choose') {
      setMode('choose');
      setError(null);
      return;
    }
    onClose();
  };

  const handleBack = () => {
    if (mode !== 'choose') {
      setMode('choose');
      setError(null);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUser = username.trim();
    if (!cleanUser || !password) {
      setError('Kullanıcı adı ve şifre gereklidir.');
      return;
    }

    setLoading(true);
    const res = await login(cleanUser, password);
    setLoading(false);

    if (res.ok) {
      onClose();
    } else {
      setError(res.error || 'Giriş yapılamadı.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUser = username.trim();
    if (cleanUser.length < 3) {
      setError('Kullanıcı adı en az 3 karakter olmalıdır.');
      return;
    }
    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.');
      return;
    }

    setLoading(true);
    const res = await register(cleanUser, password, displayName.trim());
    setLoading(false);

    if (res.ok) {
      onClose();
    } else {
      setError(res.error || 'Kayıt yapılamadı.');
    }
  };

  const handleGuest = () => {
    continueAsGuest();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      onBack={mode !== 'choose' ? handleBack : undefined}
      showClose={defaultMode !== 'choose' || mode !== 'choose'}
      title={
        mode === 'choose'
          ? 'Hoş Geldiniz!'
          : mode === 'login'
            ? 'Giriş Yap'
            : 'Yeni Hesap Oluştur'
      }
      subtitle={
        mode === 'choose'
          ? 'Ders ve devamsızlıklarınızı bulutta güvenle saklayın.'
          : mode === 'login'
            ? 'Kayıtlı hesabınıza giriş yaparak verilerinize ulaşın.'
            : 'Ücretsiz bir hesap oluşturarak verilerinizi güvenceye alın.'
      }
      maxWidth="sm"
    >
      {/* 1. INITIAL CHOICE SCREEN */}
      {mode === 'choose' && (
        <div key="choose" className="animate-mode-in space-y-4 py-2">
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 text-center space-y-1.5">
            <div className="flex justify-center mb-2">
              <AppLogo className="w-12 h-12" rounded="rounded-2xl" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Hesabınız var mı?
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Daha önce oluşturduğunuz bir hesabınız varsa giriş yaparak doğrudan derslerinize ulaşabilirsiniz.
            </p>
          </div>

          <div className="space-y-2">
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                setError(null);
                setMode('login');
              }}
              icon={<LogIn className="w-4 h-4" />}
              className="w-full justify-between px-5"
            >
              <span>Evet, Giriş Yap</span>
              <ArrowRight className="w-4 h-4 opacity-70" />
            </Button>

            <Button
              variant="secondary"
              size="lg"
              onClick={() => {
                setError(null);
                setMode('register');
              }}
              icon={<UserPlus className="w-4 h-4" />}
              className="w-full justify-between px-5"
            >
              <span>Yeni Hesap Oluştur</span>
              <ArrowRight className="w-4 h-4 opacity-70" />
            </Button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleGuest}
                className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 font-medium underline underline-offset-4 transition-colors"
              >
                Hesapsız Devam Et (Misafir Modu)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. LOGIN SCREEN */}
      {mode === 'login' && (
        <div key="login" className="animate-mode-in">
          {/* Quick tab toggle */}
          <div className="flex bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl mb-3 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setMode('login');
              }}
              className="flex-1 py-1.5 text-center rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs transition-all"
            >
              Giriş Yap
            </button>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setMode('register');
              }}
              className="flex-1 py-1.5 text-center rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-all"
            >
              Kayıt Ol
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 py-1">
            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-600 dark:text-rose-400 font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Kullanıcı Adı
              </label>
              <input
                type="text"
                required
                autoFocus
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError(null);
                }}
                placeholder="kullaniciadi"
                className="w-full text-sm px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Şifre
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="••••••••"
                  className="w-full text-sm px-3.5 py-2.5 pr-10 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading || !username.trim() || !password}
              className="w-full mt-2"
            >
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </Button>

            <div className="flex items-center justify-between pt-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode('register');
                }}
                className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium hover:underline"
              >
                Hesabın yok mu? Kayıt Ol
              </button>

              <button
                type="button"
                onClick={handleGuest}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                Misafir olarak devam et
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. REGISTER SCREEN */}
      {mode === 'register' && (
        <div key="register" className="animate-mode-in">
          {/* Quick tab toggle */}
          <div className="flex bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl mb-3 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setMode('login');
              }}
              className="flex-1 py-1.5 text-center rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-all"
            >
              Giriş Yap
            </button>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setMode('register');
              }}
              className="flex-1 py-1.5 text-center rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs transition-all"
            >
              Kayıt Ol
            </button>
          </div>

          <form onSubmit={handleRegister} className="space-y-4 py-1">
            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-600 dark:text-rose-400 font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Ad Soyad / Görünen İsim <span className="text-zinc-400 font-normal">(isteğe bağlı)</span>
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="ör. Ali Yılmaz"
                className="w-full text-sm px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Kullanıcı Adı
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError(null);
                }}
                placeholder="kullaniciadi (en az 3 karakter)"
                className="w-full text-sm px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Şifre
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="en az 6 karakter"
                  className="w-full text-sm px-3.5 py-2.5 pr-10 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading || username.trim().length < 3 || password.length < 6}
              className="w-full mt-2"
            >
              {loading ? 'Hesap oluşturuluyor...' : 'Kayıt Ol ve Başla'}
            </Button>

            <div className="flex items-center justify-between pt-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode('login');
                }}
                className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium hover:underline"
              >
                Zaten hesabın var mı? Giriş Yap
              </button>

              <button
                type="button"
                onClick={handleGuest}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                Misafir olarak devam et
              </button>
            </div>
          </form>
        </div>
      )}
    </Modal>
  );
}
