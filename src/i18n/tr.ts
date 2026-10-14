import type { AbsenceWarning, SetupIssue } from '../lib/validation';
import type { Status, ThemePreference, TrackingUnit } from '../types';

/*
 * All user-facing Turkish copy lives here. Number-dependent phrases are
 * written to avoid Turkish suffix harmony issues (e.g. "%40'ı" vs "%45'i").
 */

export const WEEKDAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'] as const;
export const WEEKDAYS_SHORT = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'] as const;
/** Accusative forms: "Tam bir Pazartesi'yi kaçırırsan…" */
export const WEEKDAYS_ACCUSATIVE = ["Pazartesi'yi", "Salı'yı", "Çarşamba'yı", "Perşembe'yi", "Cuma'yı", "Cumartesi'yi", "Pazar'ı"] as const;

const h = (n: number) => `${n} saat`;
const d = (n: number) => `${n} gün`;
export const formatUnit = (n: number, unit?: TrackingUnit) => (unit === 'days' ? d(n) : h(n));
export const formatUnitShort = (unit?: TrackingUnit) => (unit === 'days' ? 'gün' : 'sa');
const pct = (ratio: number) => `%${Math.round(ratio * 100)}`;

export const tr = {
  appName: 'Devamsızlık',
  appTagline: 'Devamsızlık takibi',

  common: {
    save: 'Kaydet',
    cancel: 'Vazgeç',
    back: 'Geri',
    next: 'İleri',
    close: 'Kapat',
    delete: 'Sil',
    edit: 'Düzenle',
    today: 'Bugün',
    yesterday: 'Dün',
    hours: h,
    days: d,
    unit: (n: number, unit?: TrackingUnit) => (unit === 'days' ? d(n) : h(n)),
    unitShort: (unit?: TrackingUnit) => (unit === 'days' ? 'gün' : 'sa'),
    hoursShort: 'sa',
    daysShort: 'gün',
    decrease: (label: string) => `${label}: azalt`,
    increase: (label: string) => `${label}: artır`,
  },

  nav: {
    dashboard: 'Panel',
    history: 'Geçmiş',
    settings: 'Ayarlar',
    addAbsence: 'Devamsızlık ekle',
    mainMenu: 'Ana menü',
    skipToContent: 'İçeriğe geç',
  },

  status: {
    safe: 'Güvende',
    warning: 'Dikkat',
    critical: 'Kritik',
    over: 'Limit aşıldı',
  } satisfies Record<Status | 'over', string>,

  today: {
    class: (n: number, unit?: TrackingUnit) =>
      unit === 'days' ? (n > 0 ? 'Bugün ders günün.' : 'Bugün dersin yok.') : `Bugün ${h(n)} dersin var.`,
    holiday: 'Bugün tatil.',
    'no-class': 'Bugün dersin yok.',
  },

  summary: {
    remainingUnit: (unit?: TrackingUnit) => (unit === 'days' ? 'gün kaldı' : 'saat kaldı'),
    overUnit: (unit?: TrackingUnit) => (unit === 'days' ? 'gün aşıldı' : 'saat aşıldı'),
    used: 'Kullanılan',
    allowed: 'Toplam hak',
    usage: 'Kullanım',
    ringLabel: (percent: number) => `Devamsızlık hakkının yüzde ${percent} kadarı kullanıldı`,
    headline: {
      safe: (_remaining: number) => 'Durumun iyi, rahat olabilirsin.',
      warning: (remaining: number, unit?: TrackingUnit) =>
        `Limite yaklaşıyorsun; ${unit === 'days' ? d(remaining) : h(remaining)} hakkın kaldı.`,
      critical: (remaining: number, unit?: TrackingUnit) =>
        `Limite çok yakınsın — yalnızca ${unit === 'days' ? d(remaining) : h(remaining)} kaldı.`,
    } satisfies Record<Status, (remaining: number, unit?: TrackingUnit) => string>,
    reached: (unit?: TrackingUnit) =>
      `Hakkının tamamını kullandın. Bundan sonraki her ${unit === 'days' ? 'gün' : 'saat'} limiti aşar.`,
    over: (n: number, unit?: TrackingUnit) =>
      `Devamsızlık limitini ${unit === 'days' ? d(n) : h(n)} aştın.`,
    noAllowance: 'Bu dönem için devamsızlık hakkın yok.',
  },

  projection: {
    title: 'Tahmin',
    datePrefix: 'Bu tempoyla limite yaklaşık',
    dateSuffix: 'civarında ulaşırsın.',
    pace: (ratio: number) => `Şu ana kadarki kaçırma oranın: ${pct(ratio)}`,
    safeUntilEnd: 'Bu tempoyla dönem sonuna kadar limite ulaşmazsın.',
    projectedTotal: (n: number, unit?: TrackingUnit) => `Dönem sonu tahmini toplam: ~${formatUnit(n, unit)}`,
    noData: 'Henüz devamsızlığın yok. Böyle devam edersen limite hiç ulaşmayacaksın.',
    reached: 'Devamsızlık hakkın doldu; yeni bir tahmin yapılamıyor.',
    ended: 'Dönem sona erdi.',
    notStarted: (date: string) => `Dönem ${date} tarihinde başlıyor.`,
    remainingClassHours: 'Kalan ders saati',
    remainingClassHoursHint: 'bugün dahil',
    termEnd: 'Dönem sonu',
    daysLeft: (n: number) => (n === 0 ? 'son gün' : `${n} gün kaldı`),
    finished: 'bitti',
  },

  whatIf: {
    title: 'Ya şöyle olursa?',
    options: 'Senaryo seç',
    fullWeek: 'Tüm hafta',
    custom: 'Özel',
    customHours: 'Saat',
    day: (accusative: string, n: number) => `Tam bir ${accusative} kaçırırsan ${h(n)} düşülür ve`,
    week: (n: number, unit?: TrackingUnit) =>
      unit === 'days'
        ? `Bir haftanın tamamını kaçırırsan ${n} gün düşülür ve`
        : `Bir haftanın tamamını kaçırırsan ${h(n)} düşülür ve`,
    customPrefix: (n: number) => `${h(n)} daha kaçırırsan`,
    remains: (n: number) => `${h(n)} kalır.`,
    exact: 'hakkın tamamen dolar.',
    over: (n: number) => `limiti ${h(n)} aşarsın.`,
    skippable: (n: number, day: string) =>
      n > 0 ? `Şu an en fazla ${n} tam ${day} daha kaçırabilirsin.` : `Tam bir ${day} daha kaçırmak limiti aşar.`,
    noClasses: 'Programında ders günü olmadığı için yalnızca özel saat denenebilir.',
  },

  chart: {
    title: 'Dağılım',
    weekly: 'Haftalık',
    monthly: 'Aylık',
    view: 'Görünüm',
    empty: 'Kayıt ekledikçe dağılım burada görünecek.',
    weekBar: (label: string, n: number) => `${label} haftası: ${h(n)}`,
    monthBar: (label: string, n: number) => `${label}: ${h(n)}`,
  },

  recent: {
    title: 'Son kayıtlar',
    seeAll: 'Tümünü gör',
  },

  empty: {
    title: 'Henüz kayıt yok',
    text: 'Kaçırdığın dersleri eklediğinde burada kronolojik olarak listelenecek.',
    cta: 'İlk kaydı ekle',
  },

  termBanner: {
    ended: 'Dönem sona erdi',
    endedText: 'Bu dönemi arşivleyip yeni döneme temiz bir sayfayla başlayabilirsin.',
    newTerm: 'Yeni dönem başlat',
  },

  absence: {
    addTitle: 'Devamsızlık ekle',
    editTitle: 'Kaydı düzenle',
    date: 'Tarih',
    hours: 'Kaçırılan miktar',
    unitLabel: (unit?: TrackingUnit) => (unit === 'days' ? 'Kaçırılan gün' : 'Kaçırılan saat'),
    hoursRange: (max: number, unit?: TrackingUnit) =>
      unit === 'days'
        ? (max === 1 ? '1 gün' : `${max} güne kadar`)
        : (max === 1 ? 'En fazla 1 saat' : `1 – ${max} saat arası`),
    fullDay: (n: number, unit?: TrackingUnit) => (unit === 'days' ? 'Tam gün (1 gün)' : `Tüm gün (${h(n)})`),
    halfDay: 'Yarım gün (0.5 gün)',
    classHours: (n: number, unit?: TrackingUnit) => (unit === 'days' ? `${d(n)} ders` : `${h(n)} ders`),
    alreadyLogged: (n: number, unit?: TrackingUnit) => (unit === 'days' ? `${d(n)} kayıtlı` : `${h(n)} kayıtlı`),
    classes: 'Kaçırılan dersler',
    unnamedClass: 'Adsız ders',
    note: 'Not',
    noteOptional: 'isteğe bağlı',
    notePlaceholder: 'ör. Hastaydım',
    submit: 'Kaydet',
    delete: 'Kaydı sil',
    confirmDelete: 'Silmek için tekrar dokun',
    errors: {
      invalidDate: 'Geçerli bir tarih seç.',
      outsideTerm: (range: string) => `Bu tarih dönem aralığının dışında (${range}).`,
      holiday: 'Bu gün tatil olarak işaretli; devamsızlık sayılmaz.',
      noClass: 'Bu gün dersin yok.',
      dayFull: 'Bu günün tüm ders saatleri zaten kayıtlı. Mevcut kaydı düzenleyebilirsin.',
      hours: (max: number, unit?: TrackingUnit) =>
        unit === 'days'
          ? `Günde en fazla ${max} gün devamsızlık seçilebilir.`
          : `Saat 1 ile ${max} arasında bir tam sayı olmalı.`,
    },
    warnings: {
      future: 'İleri bir tarih seçtin; planlanmış devamsızlık olarak kaydedilecek.',
      'has-entries': 'Bu güne ait başka bir kayıt var; bu kayıt ayrıca eklenecek.',
      'over-limit': 'Bu kayıtla devamsızlık limitini aşacaksın.',
    } satisfies Record<AbsenceWarning, string>,
  },

  history: {
    title: 'Geçmiş',
    subtitle: (count: number, total: number, unit?: TrackingUnit) => `${count} kayıt · toplam ${formatUnit(total, unit)}`,
    deleteTitle: 'Kayıt silinsin mi?',
    deleteText: (date: string, n: number, unit?: TrackingUnit) => `${date} tarihli ${formatUnit(n, unit)} devamsızlık kaydı silinecek.`,
    deleteAria: (date: string) => `${date} kaydını sil`,
    editAria: (date: string) => `${date} kaydını düzenle`,
    inconsistent: 'Bu kayıt güncel programla uyuşmuyor.',
  },

  settings: {
    title: 'Ayarlar',
    termSection: 'Dönem',
    termName: 'Dönem adı',
    dates: 'Tarihler',
    duration: 'Süre',
    weeks: (n: number) => `${n} hafta`,
    allowance: 'Devamsızlık hakkı',
    schedule: 'Haftalık program',
    totalClassHours: 'Toplam ders saati',
    holidays: 'Tatiller',
    holidayCount: (n: number) => (n === 0 ? 'Yok' : `${n} tatil`),
    editSetup: 'Programı ve dönemi düzenle',
    newTermSection: 'Yeni dönem',
    newTermText:
      'Mevcut dönemi özet olarak arşivleyip yeni bir döneme temiz bir sayfayla başla. Programın ve hakkın taslak olarak korunur; dönem süresini ve tarihleri yeniden girersin.',
    newTerm: 'Yeni dönem başlat',
    archive: 'Geçmiş dönemler',
    archiveItem: (used: number, allowed: number, unit?: TrackingUnit) => `${used} / ${formatUnit(allowed, unit)} devamsızlık`,
    deleteArchive: 'Arşivden kaldır',
    deleteArchiveTitle: 'Dönem arşivden kaldırılsın mı?',
    deleteArchiveText: 'Bu dönemin özeti kalıcı olarak silinecek.',
    appearance: 'Görünüm',
    theme: 'Tema',
    themes: { system: 'Sistem', light: 'Açık', dark: 'Koyu' } satisfies Record<ThemePreference, string>,
    data: 'Veriler',
    export: 'Yedeği indir',
    import: 'Yedekten yükle',
    exportDone: 'Yedek dosyası indirildi.',
    importTitle: 'Yedek yüklensin mi?',
    importText: 'Mevcut tüm verilerin yedekteki verilerle değiştirilecek.',
    importConfirm: 'Yükle',
    importDone: 'Yedek başarıyla yüklendi.',
    importParseError: 'Dosya okunamadı. Geçerli bir JSON yedeği seç.',
    importInvalid: 'Bu dosya geçerli bir devamsızlık yedeği değil.',
    reset: 'Tüm verileri sıfırla',
    resetTitle: 'Tüm veriler silinsin mi?',
    resetText: 'Programın, dönem bilgilerin, arşivin ve tüm kayıtların kalıcı olarak silinecek. Bu işlem geri alınamaz.',
    resetConfirm: 'Evet, sıfırla',
    saveError: 'Veriler tarayıcıya kaydedilemedi. Depolama dolu ya da devre dışı olabilir.',
    privacy: 'Verilerin yalnızca bu cihazda, tarayıcında saklanır.',
  },

  setup: {
    welcome: 'Hoş geldin',
    welcomeText: 'Birkaç adımda programını kur, devamsızlığını kolayca takip et.',
    editTitle: 'Programı düzenle',
    newTermTitle: 'Yeni dönem',
    newTermNote:
      'Kaydettiğinde mevcut dönem özet olarak arşivlenir ve devamsızlık kayıtların temizlenir.',
    backupFirst: 'Önce yedek indir',
    stepOf: (i: number, n: number) => `Adım ${i} / ${n}`,
    goToStep: (i: number, title: string) => `Adım ${i}: ${title}`,
    steps: [
      { title: 'Haftalık program', description: 'Her gün toplam kaç saat dersin olduğunu gir. Dersi olmayan günleri 0 bırak.' },
      { title: 'Dönem ve devamsızlık hakkı', description: 'Dönemin ne zaman başlayıp ne kadar süreceğini ve toplam devamsızlık hakkını gir.' },
      { title: 'Tatiller', description: 'Ders yapılmayacak günleri işaretle; bu günler hesaplamaya dahil edilmez.' },
    ],
    finish: { initial: 'Başla', edit: 'Değişiklikleri kaydet', newTerm: 'Yeni dönemi başlat' },

    trackingUnitLabel: 'Devamsızlık Takip Sistemi',
    trackingUnits: {
      hours: 'Genel Saat',
      days: 'Gün Sistemi',
      course_hours: 'Ders Bazlı Saat',
    },
    trackingUnitHint: 'Kurumunuz devamsızlığı ders ders mi, genel saat havuzundan mı yoksa gün bazlı mı takip ediyor?',
    courseAllowanceTitle: 'Ders Devamsızlık Hakları',
    courseAllowanceDesc: 'Üniversitelerdeki standart %30 devamsızlık kuralına göre hesaplandı. Her dersin limitini dilediğin gibi ayarlayabilirsin.',
    calcPercentageRule: (pct: number) => `%${pct} Kuralı`,
    weeklyTotal: 'Haftalık toplam',
    weeklyDaysTotal: 'Haftalık ders günü',
    weeklyCoursesTotal: (coursesCount: number, hoursCount: number) => `${coursesCount} farklı ders · Haftalık ${hoursCount} saat`,
    dayHoursLabel: (day: string) => `${day} ders saati`,
    dayPresenceLabel: (day: string) => `${day} günü ders var mı?`,
    addClassNames: 'Ders adı ekle',
    classCount: (n: number) => `${n} ders`,
    className: 'Ders adı',
    classNamePlaceholder: 'ör. Reading',
    classHoursLabel: (name: string) => `${name} saati`,
    addClass: 'Ders ekle',
    removeClass: 'Dersi kaldır',
    classHint: 'Ders eklediğinde günlük saat, derslerin toplamından hesaplanır.',

    termName: 'Dönem adı',
    optional: 'isteğe bağlı',
    termNamePlaceholder: 'ör. 2026 Güz · Hazırlık',
    start: 'Başlangıç tarihi',
    endBy: 'Bitişi nasıl gireceksin?',
    endModes: { end: 'Bitiş tarihi', weeks: 'Süre (hafta)' },
    end: 'Bitiş tarihi',
    weeks: 'Hafta sayısı',
    endsOn: (date: string) => `Bitiş: ${date}`,
    termSummary: (weeks: number, count: number, unit?: TrackingUnit) =>
      `${weeks} hafta · ${unit === 'days' ? `${count} ders günü` : `${count} saat ders`}`,
    allowedHours: 'Toplam devamsızlık hakkı',
    allowedLabel: (unit?: TrackingUnit) =>
      unit === 'days' ? 'Toplam devamsızlık hakkı (Gün)' : 'Toplam devamsızlık hakkı (Saat)',
    allowedHint: (unit?: TrackingUnit) =>
      unit === 'days'
        ? 'Kurumunun dönem boyunca izin verdiği toplam devamsızlık günü (ör. 15 veya 20 gün).'
        : 'Kurumunun dönem boyunca izin verdiği toplam devamsızlık saati.',
    allowanceShare: (ratio: number, unit?: TrackingUnit) =>
      unit === 'days'
        ? `Toplam ders gününe oranı: ${pct(ratio)}`
        : `Toplam ders saatine oranı: ${pct(ratio)}`,

    holidayStart: 'Başlangıç',
    holidayEnd: 'Bitiş',
    holidayLabel: 'Açıklama',
    holidayLabelPlaceholder: 'ör. Ara tatil',
    addHoliday: 'Tatil ekle',
    addNational: 'Resmî tatilleri ekle',
    nationalHint: 'Dini bayramlar her yıl değiştiği için elle eklenmeli.',
    nationalAdded: (n: number) => `${n} resmî tatil eklendi.`,
    noNational: 'Dönem aralığında eklenecek yeni resmî tatil yok.',
    noHolidays: 'Henüz tatil eklenmedi.',
    holidayImpact: (n: number) => (n > 0 ? `−${h(n)} ders` : 'Ders saatini etkilemiyor'),
    holidayOutside: 'Dönem dışında',
    removeHoliday: (label: string) => `${label} tatilini kaldır`,
    holidayInvalidStart: 'Geçerli bir başlangıç tarihi seç.',
    holidayInvalidOrder: 'Bitiş tarihi başlangıçtan önce olamaz.',
    totalAfterHolidays: (n: number) => `Tatiller düşüldükten sonra dönemde toplam ${h(n)} ders var.`,

    issues: {
      'hours-invalid': 'Günlük ders saati 0 ile 16 arasında bir tam sayı olmalı.',
      'schedule-empty': 'En az bir güne ders saati girmelisin.',
      'term-start-invalid': 'Geçerli bir başlangıç tarihi gir.',
      'term-end-invalid': 'Geçerli bir bitiş tarihi gir.',
      'term-order': 'Bitiş tarihi başlangıç tarihinden önce olamaz.',
      'term-too-long': 'Dönem en fazla 2 yıl sürebilir.',
      'allowed-invalid': 'Devamsızlık hakkı 0 veya daha büyük bir tam sayı olmalı.',
      'holiday-invalid': 'Tatil tarihlerinden biri geçersiz.',
      'term-no-classes': 'Bu tarihler arasında hiç ders saati yok. Programı veya tarihleri kontrol et.',
    } satisfies Record<SetupIssue, string>,
  },

  courses: {
    title: 'Derslerim',
    badge: 'Ders Bazlı',
    weeklyHours: 'Haftalık',
    allowedHours: 'Hak',
    remaining: 'Kalan',
    used: 'Kullanılan',
    safe: 'Güvende',
    warning: 'Sınırda',
    critical: 'Kritik Risk',
    over: 'Limit Aşıldı!',
    allSafe: 'Tüm derslerinde devamsızlık durumun güvende',
    summaryPill: (safe: number, total: number) => `${safe}/${total} Ders Güvende`,
    atRiskDesc: (name: string, remaining: number) => `${name} dersinde sınıra çok yaklaştın (${remaining} sa kaldı)!`,
    overDesc: (name: string, over: number) => `${name} dersinde devamsızlık limitini ${over} sa aştın!`,
    selectCourse: 'Ders Seçimi',
    courseName: 'Ders Adı',
    allCourses: 'Tüm Dersler',
    noCourses: 'Henüz tanımlı ders yok.',
    addAbsenceForCourse: (name: string) => `${name} için devamsızlık ekle`,
  },
};

