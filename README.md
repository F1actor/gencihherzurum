<div align="center">

<img src="frontend/src/assets/logo.jpg" alt="Genç İHH Erzurum Logo" width="120" style="border-radius: 50%;" />

# 🌿 Genç İHH Erzurum — Teşkilat Yönetim Portalı

**Birim başkanlarını takip eden, performansı ölçen ve raporlayan modern bir teşkilat yönetim sistemi.**

[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6-646cff?logo=vite&logoColor=white)](https://vitejs.dev)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![MySQL](https://img.shields.io/badge/MySQL-8+-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/Lisans-MIT-green)](LICENSE)

</div>

---

## 📖 Proje Hakkında

**Genç İHH Erzurum Teşkilat Portalı**, Genç İHH Erzurum teşkilatının birim başkanlarını dijital ortamda yönetmek, rutin görevleri takip etmek ve performansı ölçmek için geliştirilmiş tam donanımlı bir web uygulamasıdır.

Sistem; **Süper Admin** ve **Birim Başkanı** olmak üzere iki farklı kullanıcı rolü sunar. Her birim başkanı, kendi faaliyetlerini raporlayıp puan kazanırken; süper admin tüm sistemi merkezi olarak yönetebilir.

---

## ✨ Özellikler

### 🔐 Kimlik Doğrulama
- E-posta ile kayıt ve OTP (tek kullanımlık kod) doğrulama
- JWT tabanlı güvenli oturum yönetimi
- Şifre sıfırlama (e-posta ile OTP)
- KVKK aydınlatma metni onayı

### 🏠 Birim Başkanı Paneli
- **Rutin Görevler:** Haftalık planlı dersleri kaydet ve kanıt fotoğrafı yükle
- **Ekstra Faaliyetler:** Ekstra etkinlikleri sisteme ekle (+20 puan)
- **Aylık Hedefler:** Süper admin tarafından atanan aylık hedef etkinliklerini tamamla
- **Liderlik Tablosu:** Haftalık / Aylık / Genel puan sıralaması
- **Eksik Rutin Uyarısı:** Tamamlanmamış rutin varsa otomatik turuncu uyarı banner'ı
- **Etkinlik Silme:** Son 24 saat içindeki etkinlikleri iptal etme
- **Duyuru Badge'i:** Okunmamış duyuruları gösteren kırmızı sayaç

### 🛡️ Süper Admin Paneli
- **Kullanıcı Onayı:** Kayıt olan üyeleri onaylayıp birim atama
- **Rutin Yönetimi:** Birim başkanlarına haftalık rutin görev tanımlama
- **Duyurular:** Tüm birim başkanlarına duyuru gönderme
- **Aylık Hedefler:** Birimlere özel aylık hedef atama
- **Sistem Denetimi:** Pasif birim tespiti ve audit log
- **Şampiyon Arşivi:** Aylık şampiyonları kayıt altına alma
- **Birim Devir:** Birim başkanlığı geçmişini yönetme

### 📊 Raporlama
- **Performans Raporları:** Son 30 günlük rutin başarı oranı ve KPI analizi
- **Aylık Raporlar:** Seçilen ay için detaylı birim performans tablosu
- **Yıllık Raporlar:** 12 aylık trend grafiği ve birim bazlı istatistikler
- **PDF & Excel İndirme:** Tüm raporlar güzel şablonlu PDF ve Excel olarak çıktı alınabilir
- **Genel Bakış PDF:** Admin pano özeti tek tuşla PDF'e aktarılır

### 🖼️ Etkinlik Medyası
- **Tanıtım ve Medya Başkanı** için özel galeri
- Tüm birimlerin kanıt fotoğraflarını birim / tür / kanıt durumuna göre filtreleme
- Fotoğraf önizleme ve indirme

### 🤖 AI Asistan
- Yerleşik AI sohbet botu (LLM entegrasyonu)
- Teşkilat soruları ve sistem yardımı

---

## 🛠️ Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| **Frontend** | React 19, Vite 6, Vanilla CSS |
| **Grafikler** | Chart.js 4, react-chartjs-2 |
| **İkonlar** | Lucide React |
| **PDF Export** | html2pdf.js |
| **Excel Export** | SheetJS (xlsx) |
| **Backend** | Node.js, Express.js |
| **Veritabanı** | MySQL 8+ |
| **Auth** | JWT, bcryptjs |
| **E-posta** | Nodemailer |
| **Dosya Yükleme** | Multer |
| **Zamanlayıcı** | node-cron |

---

## 📁 Proje Yapısı

```
gencihherzurum/
├── frontend/                 # React + Vite uygulaması
│   └── src/
│       ├── assets/           # Logo ve görseller
│       ├── components/       # Yeniden kullanılabilir bileşenler
│       │   ├── AuthLayout.jsx          # Giriş/Kayıt ekranı layout
│       │   ├── AnnualReportPanel.jsx   # Yıllık rapor
│       │   ├── MonthlyReportPanel.jsx  # Aylık rapor
│       │   ├── PerformancePanel.jsx    # Performans raporu
│       │   ├── MonthlyGoalsPanel.jsx   # Aylık görevler
│       │   ├── SystemSettingsPanel.jsx # Sistem ayarları
│       │   ├── EventMediaGallery.jsx   # Etkinlik medyası
│       │   └── AIChatWidget.jsx        # AI sohbet botu
│       ├── context/          # React Context (Auth, Notification)
│       └── pages/
│           ├── Login.jsx           # Giriş sayfası
│           ├── Register.jsx        # Kayıt sayfası (KVKK)
│           ├── VerifyOtp.jsx       # OTP doğrulama
│           ├── AdminDashboard.jsx  # Süper Admin paneli
│           └── UnitDashboard.jsx   # Birim Başkanı paneli
│
└── backend/                  # Express.js API sunucusu
    ├── config/
    │   └── database.js       # MySQL bağlantısı
    ├── controllers/          # İş mantığı katmanı
    │   ├── authController.js
    │   ├── adminController.js
    │   ├── eventController.js
    │   ├── reportController.js
    │   ├── announcementController.js
    │   └── llmController.js
    ├── middleware/
    │   └── authMiddleware.js  # JWT doğrulama
    ├── routes/               # API route tanımları
    ├── services/
    │   ├── emailService.js   # Nodemailer
    │   └── cronService.js    # Otomatik denetim görevleri
    └── uploads/              # Yüklenen kanıt fotoğrafları
```

---

## 🚀 Kurulum

### Gereksinimler
- Node.js 18+
- MySQL 8+ veritabanı

### 1. Depoyu klonla

```bash
git clone https://github.com/F1actor/gencihherzurum.git
cd gencihherzurum
```

### 2. Backend kurulumu

```bash
cd backend
npm install
```

`backend/.env` dosyası oluştur:

```env
PORT=5000
DATABASE_URL=mysqls://user:password@host:3306/dbname
JWT_SECRET=cok_gizli_bir_anahtar
EMAIL_USER=ornek@gmail.com
EMAIL_PASS=uygulama_sifresi
GEMINI_API_KEY=gemini_api_anahtarin
```

```bash
npm start
```

### 3. Frontend kurulumu

```bash
cd frontend
npm install
npm run dev
```

`frontend/.env` dosyası oluştur:

```env
VITE_API_URL=http://localhost:5000/api
```

Uygulama `http://localhost:5173` adresinde çalışır.

---

## 🗄️ Veritabanı Şeması

Uygulama ilk çalıştığında veritabanı tablolarını otomatik olarak oluşturur. Temel tablolar:

| Tablo | Açıklama |
|-------|----------|
| `users` | Kullanıcılar (Admin / Birim Başkanı / Bekleyen) |
| `events` | Etkinlik kayıtları (Rutin / Ekstra / Hedef) |
| `routines` | Birimlere atanmış haftalık rutin planları |
| `targets` | Birimlere atanmış aylık hedefler |
| `announcements` | Duyurular |
| `audits` | Sistem denetim logları |
| `champions` | Şampiyon arşivi |
| `unit_history` | Birim devir geçmişi |

---

## 📱 Ekran Görüntüleri

> Sistem; açık/koyu tema desteğine sahiptir ve tüm ekran boyutlarında duyarlı (responsive) çalışır.

### Giriş Ekranı
- Fotoğraf slaytlı, split-screen modern tasarım
- Yeşil-Beyaz kurumsal renk paleti

### Birim Başkanı Paneli
- Haftalık puan kartları ve liderlik tablosu
- Kanıt fotoğraflı etkinlik giriş formu
- Duyuru ve aylık hedef kartları

### Süper Admin Paneli
- Özet istatistik kartları + trend grafiği
- Birim performans analizi ve KPI tablosu
- PDF / Excel dışa aktarma

---

## 🏆 Puan Sistemi

| Etkinlik Türü | Puan |
|---------------|------|
| Rutin Görev (zamanında) | 10 Puan |
| Rutin Görev (gecikmeli) | 10 Puan |
| Ekstra Faaliyet | 20 Puan |
| Aylık Hedef | Hedef puanına göre değişken |

- **Haftalık puan:** Her haftanın başında sıfırlanır
- **Aylık puan:** Her ayın başında sıfırlanır
- **Genel puan:** Yıl sonuna kadar birikir

---

## 🔒 Güvenlik

- Şifreler **bcryptjs** ile hashlenerek saklanır
- API erişimi **JWT token** doğrulaması gerektirir
- Rol tabanlı yetkilendirme: `SUPER_ADMIN`, `UNIT_PRESIDENT`, `PENDING`
- E-posta doğrulama (OTP) zorunludur
- Etkinlik kanıtları yalnızca 24 saat içinde düzenlenebilir / silinebilir
- KVKK aydınlatma metni onayı kayıt sırasında alınır

---

## 📄 Lisans

Bu proje [MIT Lisansı](LICENSE) altında lisanslanmıştır.

---

<div align="center">
  <strong>Genç İHH Erzurum</strong> tarafından ❤️ ile geliştirildi
</div>
