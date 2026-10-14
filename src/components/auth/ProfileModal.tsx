import { useState, useRef, useEffect } from 'react';
import { Camera, LogOut, ShieldCheck, Calendar, Pencil, Check, X, Trash2, AlertTriangle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../../state/AuthContext';
import { useApp } from '../../state/AppContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { formatDate } from '../../lib/dates';

export interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, logout, uploadAvatar, updateDisplayName, deleteAccount } = useAuth();
  const { dispatch, today } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [viewMode, setViewMode] = useState<'profile' | 'deleteAccount'>('profile');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.displayName || user?.username || '');
  const [savingName, setSavingName] = useState(false);

  // Delete account form state
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState('');
  const [showDeletePass, setShowDeletePass] = useState(false);
  const [showDeleteConfirmPass, setShowDeleteConfirmPass] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setViewMode('profile');
      setEditingName(false);
      setNameInput(user?.displayName || user?.username || '');
      setUploadError(null);
      setDeletePassword('');
      setDeleteConfirmPassword('');
      setDeleteError(null);
      setIsDeleting(false);
      setDeleteSuccess(false);
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    const res = await uploadAvatar(file);
    setUploading(false);

    if (!res.ok) {
      setUploadError(res.error || 'Resim yüklenemedi.');
    }

    e.target.value = '';
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  const handleSaveName = async () => {
    const clean = nameInput.trim();
    if (!clean) return;
    setSavingName(true);
    const res = await updateDisplayName(clean);
    setSavingName(false);
    if (res.ok) {
      setEditingName(false);
    } else {
      setUploadError(res.error || 'İsim güncellenemedi.');
    }
  };

  const handleDeleteAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError(null);

    if (!deletePassword || !deleteConfirmPassword) {
      setDeleteError('Lütfen şifrenizi her iki alana da girin.');
      return;
    }

    if (deletePassword !== deleteConfirmPassword) {
      setDeleteError('Girdiğiniz şifreler eşleşmiyor.');
      return;
    }

    setIsDeleting(true);
    const res = await deleteAccount(deletePassword, deleteConfirmPassword);
    setIsDeleting(false);

    if (res.ok) {
      dispatch({ type: 'resetAll', today });
      setDeleteSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setDeleteError(res.error || 'Hesap silinemedi.');
    }
  };

  const initial = user.displayName ? user.displayName[0].toUpperCase() : user.username[0].toUpperCase();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onBack={viewMode === 'deleteAccount' && !deleteSuccess ? () => setViewMode('profile') : undefined}
      title={viewMode === 'deleteAccount' ? 'Hesabı Sil' : 'Profilim'}
      maxWidth="sm"
    >
      {viewMode === 'profile' ? (
        <div className="space-y-5 py-2">
          {/* Avatar & Basic Info */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-2xl font-black text-zinc-700 dark:text-zinc-200 shadow-md">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName || user.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{initial}</span>
                )}
              </div>

              {/* Upload Button Overlay */}
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                aria-label="Profil resmini değiştir"
                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-md hover:scale-105 transition-all"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            <div className="w-full max-w-[240px]">
              {editingName ? (
                <div className="flex items-center gap-1.5 justify-center">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Görünen İsim"
                    className="w-full text-xs px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 text-center focus:outline-hidden"
                    autoFocus
                  />
                  <button
                    type="button"
                    disabled={savingName || !nameInput.trim()}
                    onClick={handleSaveName}
                    aria-label="Kaydet"
                    className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNameInput(user.displayName || user.username);
                      setEditingName(false);
                    }}
                    aria-label="Vazgeç"
                    className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-1.5">
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {user.displayName || user.username}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setNameInput(user.displayName || user.username);
                      setEditingName(true);
                    }}
                    aria-label="İsmi düzenle"
                    className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-md transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                @{user.username}
              </p>
            </div>

            {uploading && (
              <p className="text-xs text-zinc-500 animate-pulse">Resim yükleniyor...</p>
            )}

            {uploadError && (
              <p className="text-xs text-rose-500">{uploadError}</p>
            )}
          </div>

          {/* Cloud Sync Status */}
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-left min-w-0">
              <h4 className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                Bulut Senkronizasyonu Aktif
              </h4>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                Verileriniz hesabınızda güvenle saklanır, dilediğiniz cihazdan erişebilirsiniz.
              </p>
            </div>
          </div>

          {/* Member since */}
          {user.createdAt && (
            <div className="flex items-center justify-between text-xs text-zinc-500 px-1">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                Kayıt Tarihi:
              </span>
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {formatDate(user.createdAt.slice(0, 10))}
              </span>
            </div>
          )}

          {/* Account Actions */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
            <Button
              variant="secondary"
              size="md"
              onClick={handleLogout}
              icon={<LogOut className="w-4 h-4" />}
              className="w-full text-xs"
            >
              Oturumu Kapat
            </Button>

            <button
              type="button"
              onClick={() => {
                setViewMode('deleteAccount');
                setDeleteError(null);
                setDeletePassword('');
                setDeleteConfirmPassword('');
              }}
              className="w-full py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Hesabı Sil
            </button>
          </div>
        </div>
      ) : deleteSuccess ? (
        <div className="py-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <Check className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Hesabınız Başarıyla Silindi
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Tüm verileriniz kaldırıldı. Çıkış yapılıyor...
          </p>
        </div>
      ) : (
        <form onSubmit={handleDeleteAccountSubmit} className="space-y-4 py-2">
          {/* Warning box */}
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/70 dark:border-rose-900/50 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-900 dark:text-rose-200">Bu işlem kalıcıdır ve geri alınamaz!</p>
              <p className="mt-0.5 text-[11px] text-rose-700 dark:text-rose-400 leading-relaxed">
                Hesabınız, kayıtlı ders programınız, tatilleriniz ve devamsızlık geçmişiniz kalıcı olarak silinecektir.
              </p>
            </div>
          </div>

          <p className="text-xs text-zinc-600 dark:text-zinc-300">
            Hesabınızı silmek için şifrenizi <strong>2 kez</strong> girerek onaylayın:
          </p>

          {/* Password 1 */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Şifreniz
            </label>
            <div className="relative">
              <input
                type={showDeletePass ? 'text' : 'password'}
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Mevcut şifreniz"
                className="w-full text-xs px-3 py-2 pr-9 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowDeletePass(!showDeletePass)}
                aria-label="Şifreyi göster/gizle"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5"
              >
                {showDeletePass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Password 2 */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Şifrenizi Tekrar Girin
            </label>
            <div className="relative">
              <input
                type={showDeleteConfirmPass ? 'text' : 'password'}
                value={deleteConfirmPassword}
                onChange={(e) => setDeleteConfirmPassword(e.target.value)}
                placeholder="Şifrenizi doğrulayın"
                className="w-full text-xs px-3 py-2 pr-9 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowDeleteConfirmPass(!showDeleteConfirmPass)}
                aria-label="Şifreyi tekrar göster/gizle"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5"
              >
                {showDeleteConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {deleteError && (
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-600 dark:text-rose-400">
              {deleteError}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isDeleting}
              onClick={() => setViewMode('profile')}
            >
              Vazgeç
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              disabled={isDeleting || !deletePassword || !deleteConfirmPassword}
              icon={isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            >
              {isDeleting ? 'Siliniyor...' : 'Hesabımı Sil'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
