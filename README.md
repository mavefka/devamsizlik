# Devamsızlık Takip (University Absence Tracker)

Minimalist, modern, gizlilik odaklı ve Türkçe arayüze sahip üniversite devamsızlık takip web uygulaması.

---

## 🚀 Özellikler

1. **Çoklu Takip Sistemi (Üniversite Sistemine Göre Özelleştirilebilir):**
   - **Toplam Saat Sistemi:** Dönemlik toplam ders saati ve izin verilen devamsızlık saati üzerinden takip.
   - **Toplam Gün Sistemi:** Gün hesabı yapan üniversiteler için gün bazlı izin ve devamsızlık takibi.
   - **Ders Bazlı Saat Sistemi:** Her ders için ayrı haftalık saat ve ayrı devamsızlık limiti belirleme (örneğin: *Yönetim Bilişim: 2 saat devamsızlık*, *Matematik: 5 saat devamsızlık*).

2. **Güvenli Hesap & Bulut Senkronizasyonu:**
   - **Kullanıcı Kayıt & Giriş:** Şifreler `bcrypt` ile tuzlanarak (salted hash) veritabanında saklanır. `JWT` ile güvenli oturum yönetimi.
   - **Brute-Force Koruması:** `express-rate-limit` ile kimlik doğrulama uç noktalarında istek sınırlaması.
   - **Profil & Avatar:** Kullanıcılar profil resmi (JPG, PNG, WEBP) yükleyebilir; resimler güvenli MIME doğrulamasından geçirilerek sunucuda saklanır ve eski avatarlar otomatik temizlenir.
   - **Hesap Silme:** Yanlışlıkla hesap silmeyi önlemek amacıyla şifrenin iki kez girilmesini zorunlu kılan güvenli silme mekanizması (tüm kullanıcı verilerini ve avatar dosyasını kalıcı olarak siler).
   - **İzole SQLite Depolama:** Her kullanıcının verileri sunucudaki SQLite veritabanında (`data/app.db`, WAL modunda) tamamen izole saklanır.
   - **Misafir Modu & Veri Güvencesi:** Hesap açmak istemeyenler için tarayıcıda (`localStorage`) çalışma desteği mevcuttur. Giriş yapıldığında yerel veriler otomatik yedeklenir.

3. **İlk Kurulum (Onboarding & Sihirbaz):**
   - Takip birimi seçimi (Saat / Gün / Ders Bazlı Saat).
   - Haftalık ders programı girişi (Pazartesi – Cuma ve isteğe bağlı Cumartesi/Pazar saatleri).
   - Gün içindeki derslere isim verme ve saat dağılımı ayarlama.
   - Dönem başlangıç ve bitiş tarihleri (hafta sayısı veya doğrudan tarih seçimiyle).
   - Tatil ve resmî tatilleri ekleme (otomatik resmî tatil önerici).

4. **Devamsızlık Kaydetme:**
   - Tarih seçimi ve o günün ders yüküne göre varsayılan saat/ders önerisi.
   - Ders bazlı modda devamsızlık yapılan dersi seçebilme.
   - Tek dokunuşla "Tüm Gün" veya hızlı kayıt shortcut'ı.
   - Kayıtları düzenleme ve silme.
   - Ders olmayan gün, tatil veya dönem dışı tarihlerde uyarı ve engelleme.
   - Limit aşımı ve ileri tarih uyarıları.

5. **Takip Paneli (Dashboard):**
   - **Birincil Gösterge:** Kalan ve kullanılan saat/gün, SVG dairesel ilerleme halkası (Progress Ring).
   - **Ders Bazlı Kartlar:** Ders bazlı takipte her dersin kendi devamsızlık durumu ve ilerleme çubuğu.
   - **Durum Rozetleri:** Güvende (Yeşil), Dikkat (Sarı), Kritik (Kırmızı), Limit Aşıldı (Koyu Kırmızı).
   - **Gidişat Tahmini (Projeksiyon):** "Bu tempoyla limite yaklaşık [Tarih] civarında ulaşırsın" + dönemde kalan toplam ders yükü.
   - **"Ya Şöyle Olursa?" Simülatörü (What-If):** Kaçırma durumunda kalan hakkı simüle etme.
   - **Dağılım Grafiği:** Haftalık ve Aylık minimal interaktif sütun grafiği.
   - **Kronolojik Geçmiş:** Haftalık gruplanmış geçmiş listesi.

6. **Tasarım & Deneyim:**
   - **Inter** modern tipografisi (`font-feature-settings: cv11, ss01`).
   - Açık (Light) ve Koyu (Dark) tema desteği (tek tıkla doğrudan geçiş).
   - Mobil öncelikli (Mobile-First) duyarlı tasarım; mobil cihazlarda köşeleri yuvarlatılmış estetik popup pencereler.
   - Üst çubukta doğrudan kaynak koduna giden GitHub bağlantısı ([mavefka/devamsizlik](https://github.com/mavefka/devamsizlik)).

---

## 🛠️ Kurulum ve Canlıya Alma (Production Deployment)

### Gereksinimler
- Node.js (v18 veya üzeri)
- npm

### 1. Yerel Geliştirme (Local Development)

```bash
# Bağımlılıkları yükleyin
npm install

# Geliştirme sunucularını başlatın (Vite + Express aynı anda çalışır):
npm run dev
# Vite frontend: http://localhost:5173
# Express backend: http://localhost:3000
```

### 2. Canlı Sunucuda Dağıtım (VPS / Azure / Render / Railway vb.)

Proje, tek bir port üzerinden hem REST API'yi hem de derlenmiş React ön yüzünü sunacak şekilde tam entegre (monorepo full-stack) çalışır.

```bash
# 1. Projeyi sunucunuza klonlayın ve klasöre girin
git clone https://github.com/mavefka/devamsizlik.git
cd devamsizlik

# 2. Bağımlılıkları yükleyin
npm install

# 3. Ortam değişkenlerini yapılandırın (.env.example dosyasından kopyalayarak)
cp .env.example .env
# .env dosyasını açıp JWT_SECRET için güçlü, rastgele bir anahtar belirleyin.

# 4. Ön yüzü derleyin (dist klasörü oluşur)
npm run build

# 5. Sunucuyu başlatın
npm start
```

#### Arka Planda Sürekli Çalıştırma (PM2 ile - Önerilen)
Sunucu kapansa veya yeniden başlasa bile uygulamanın 7/24 çalışması için:

```bash
npm install -g pm2
pm2 start "npm start" --name devamsizlik
pm2 save
pm2 startup
```

---

## 🔒 Güvenlik & Mimari

- **Helmet Güvenlik Başlıkları:** CSP, X-Frame-Options, X-Content-Type-Options ve HSTS yapılandırması.
- **CORS Yönetimi:** `CORS_ORIGIN` ortam değişkeniyle belirli alan adlarına kısıtlanabilir.
- **Rate Limiting:** Auth endpoint'lerinde brute-force kaba kuvvet saldırılarına karşı IP başına istek sınırlaması.
- **Kriptografik Güvenlik:** Şifreler `bcrypt` ile tuzlanır; rastgele JWT oturum belirteçleri kullanılır.
- **Dosya Yükleme Güvenliği:** Yalnızca güvenli resim MIME türleri kabul edilir; uzantılar kullanıcı girdisinden değil MIME tipinden türetilir.
- **Tek Port Dağıtımı:** Canlıda React `dist` çıktısı Express üzerinden statik olarak sunulur; SPA routing fallback desteğiyle sayfa yenilemelerinde yönlendirme hatası yaşanmaz.
