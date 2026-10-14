# devamsızlık takip

üniversite öğrencileri için minimalist, modern ve esnek devamsızlık takip uygulaması.

canlı demo: [yudevamsizlik.tech](https://yudevamsizlik.tech)

---

### kullanılan teknolojiler

- **frontend:** react 18, typescript, tailwind css v4, vite, lucide icons
- **backend:** node.js, express 5, better-sqlite3 (wal mode)
- **güvenlik:** json web tokens (jwt), bcrypt, rate limiting, helmet
- **test:** vitest (38 unit test)

---

### öne çıkan özellikler

- **esnek takip modelleri:**
  - **saat bazlı:** dönemlik toplam izin ve ders saati takibi
  - **gün bazlı:** gün hesabı yapan üniversiteler için tam gün takibi
  - **ders bazlı:** her derse ayrı haftalık saat ve ayrı devamsızlık limiti belirleme
- **hesap & bulut senkronizasyonu:**
  - güvenli kayıt & giriş (bcrypt ile tuzlanmış şifreler, jwt oturumu)
  - profil resmi yükleme ve eski avatarların otomatik temizlenmesi
  - şifrenin iki kez girilmesini isteyen güvenli hesap silme
  - hesap açmak istemeyenler için kesintisiz misafir modu (localstorage)
- **panel & analiz:**
  - svg ilerleme halkası ve renkli durum rozetleri
  - "bu tempoyla hangi tarihte kalırsın?" projeksiyon tahmini
  - "ya şu gün gitmezsem?" devamsızlık simülatörü
  - haftalık ve aylık etkileşimli devamsızlık grafikleri
  - kronolojik devamsızlık geçmişi
- **arayüz & deneyim:**
  - açık (light) ve koyu (dark) tema desteği
  - mobilde ekrana yapışmayan, yuvarlatılmış estetik pencereler
  - masaüstü ve mobilde tam duyarlı (responsive) tasarım

---

### yerel geliştirme

```bash
# repoyu klonlayın
git clone https://github.com/mavefka/devamsizlik.git
cd devamsizlik

# paketleri kurun
npm install

# ortam değişkeni şablonunu kopyalayın
cp .env.example .env

# geliştirme ortamını başlatın (vite + express)
npm run dev
```

tarayıcıda açın:
- arayüz: `http://localhost:5173`
- api: `http://localhost:3000`

---

### testler

```bash
npm test
```

---

### canlıya alma (production)

```bash
# ön yüzü derleyin
npm run build

# sunucuyu başlatın
npm start
```

---

### lisans & katkı

açık kaynaklıdır. geliştirmeye katkıda bulunmak için issue açabilir veya pull request gönderebilirsiniz.
